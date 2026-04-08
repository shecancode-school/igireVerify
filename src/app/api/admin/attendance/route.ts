import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { isSameDay, format } from "date-fns";

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
    const attendanceRecords = await attendanceCol.find({
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    }).toArray();

    // 3. Fetch programs for context
    const programs = await programsCol.find({ isActive: true }).toArray();
    const programMap = new Map(programs.map(p => [p._id.toString(), p]));

    // 4. Merge Users and Attendance
    const dayName = format(targetDate, 'EEEE');
    const enrichedResults = users.map(user => {
      const program = user.programId ? programMap.get(user.programId.toString()) : null;
      const record = attendanceRecords.find(r => r.userId === user._id.toString());
      
      const workingDays = program?.schedule?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const isWorkingDay = workingDays.includes(dayName);

      if (record) {
        return {
          _id: record._id,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          profilePhotoUrl: user.profilePhotoUrl || null,
          programName: program?.name || 'No Program',
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          status: record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' '),
          location: record.location || 'Unknown',
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