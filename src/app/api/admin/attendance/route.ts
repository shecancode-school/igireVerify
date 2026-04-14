import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { format } from "date-fns";

/**
 * GET /api/admin/attendance
 * Get attendance records for a specific date or date range
 * Dynamic view including Absent participants
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date');
    const programId = searchParams.get('programId');

    const db = await getDb();
    const attendanceCol = db.collection("attendance");
    const usersCol = db.collection("users");
    const programsCol = db.collection("programs");

    // Determine target date
    const targetDate = dateQuery ? new Date(dateQuery) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch relevant users
    const userQuery: any = { role: { $in: ["participant", "staff"] } };
    if (programId && ObjectId.isValid(programId)) {
      userQuery.programId = new ObjectId(programId);
    }
    const users = await usersCol.find(userQuery).toArray();

    // 2. Fetch attendance records for this day
    // Note: checkInTime/checkOutTime are stored as ISO strings, so we filter using Date fields (createdAt).
    const attendanceQuery: any = {
      $or: [
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { checkInTime: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ],
      type: { $in: ["checkin", "completed", "manual", "absent"] },
    };
    if (programId && ObjectId.isValid(programId)) {
      attendanceQuery.programId = new ObjectId(programId);
    }
    const attendanceRecords = await attendanceCol.find(attendanceQuery).toArray();

    // 3. Fetch programs for context
    const programs = await programsCol.find({ isActive: true }).toArray();
    const programMap = new Map(programs.map(p => [p._id.toString(), p]));

    // 4. Merge Users and Attendance
    const dayName = format(targetDate, 'EEEE');

    const getDisplayStatus = (checkInStatus?: unknown, hasCheckOut?: boolean) => {
      const raw = typeof checkInStatus === "string" ? checkInStatus : "";
      if (raw === "late") return "Late";
      if (raw === "absent") return "Absent";
      if (!hasCheckOut) return "Checked In";
      // "on-time" => Present
      if (raw === "on-time" || raw === "present") return "Present";
      return "Present";
    };

    const formatGps = (gps: any) => {
      if (
        !gps ||
        typeof gps.latitude !== "number" ||
        typeof gps.longitude !== "number"
      ) {
        return null;
      }
      const accuracyPart =
        typeof gps.accuracy === "number" ? ` (${gps.accuracy}m)` : "";
      return `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}${accuracyPart}`;
    };

    const recordPriority = (r: { type?: unknown; checkOutTime?: unknown; checkInTime?: unknown }) => {
      const type = typeof r.type === "string" ? r.type : "";
      if ((type === "completed" || r.checkOutTime) && r.checkInTime) return 4;
      if (type === "checkin" && r.checkInTime) return 3;
      if (type === "manual") return 2;
      if (type === "absent") return 1;
      return 0;
    };

    const enrichedResults = users.map(user => {
      const program = user.programId ? programMap.get(user.programId.toString()) : null;
      const userRecords = attendanceRecords
        .filter((r: any) => {
          const rid = r?.userId?.toString ? r.userId.toString() : String(r?.userId);
          return rid === user._id.toString();
        })
        .sort((a: any, b: any) => {
          const p = recordPriority(b) - recordPriority(a);
          if (p !== 0) return p;
          const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
          const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
          return bt - at;
        });
      const record = userRecords[0];
      
      const workingDays = program?.schedule?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const isWorkingDay = workingDays.includes(dayName);

      if (record) {
        const checkInStatus = record.checkInStatus ?? record.status;
        const hasCheckOut = Boolean(record.checkOutTime) || record.type === "completed";
        const displayStatus = getDisplayStatus(checkInStatus, hasCheckOut);

        const gpsLocation = record.checkInGpsLocation ?? record.checkOutGpsLocation;
        const resolvedLocation =
          record.locationLabel ||
          formatGps(gpsLocation) ||
          record.location;
        const location =
          resolvedLocation ||
          (displayStatus === "Present" || displayStatus === "Late" || displayStatus === "Checked In"
            ? "Igire Rwanda Organisation premises"
            : "Unknown");

        return {
          _id: record._id,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          profilePhotoUrl: user.profilePhotoUrl || null,
          programName: program?.name || 'No Program',
          checkInTime: record.checkInTime ?? null,
          checkOutTime: record.checkOutTime ?? null,
          status: displayStatus,
          location,
        };
      } else if (isWorkingDay) {
        // Only show as absent if it's a working day and it's not in the future
        const today = new Date();
        today.setHours(0,0,0,0);
        const status = targetDate <= today ? 'Absent' : 'Scheduled';
        
        return {
          _id: `absent-${user._id}`,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          profilePhotoUrl: user.profilePhotoUrl || null,
          programName: program?.name || 'No Program',
          checkInTime: null,
          checkOutTime: null,
          status: status,
          location: '-',
        };
      }
      return null;
    }).filter(Boolean);

    console.log(`[ADMIN/ATTENDANCE] Retrieved ${enrichedResults.length} combined records`);

    return NextResponse.json({
      records: enrichedResults,
      date: dateQuery || format(new Date(), 'yyyy-MM-dd'),
      total: enrichedResults.length
    });

  } catch (error) {
    console.error("[ADMIN/ATTENDANCE] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance monitoring data" }, { status: 500 });
  }
}