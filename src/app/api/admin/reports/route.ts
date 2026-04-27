import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { eachDayOfInterval, format, isSameDay } from "date-fns";

/**
 * GET /api/admin/reports
 * Generate comprehensive attendance report
 * Query params: startDate, endDate, programId, format (csv|json)
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const programId = searchParams.get('programId');
    const formatType = searchParams.get('format') || 'json';

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const db = await getDb();
    const attendanceCol = db.collection("attendance");
    const usersCol = db.collection("users");
    const programsCol = db.collection("programs");

    // 1. Get Date Range
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

    // 2. Fetch Programs & Users
    let programs;
    if (programId && ObjectId.isValid(programId)) {
      programs = await programsCol.find({ _id: new ObjectId(programId) }).toArray();
    } else {
      programs = await programsCol.find({ isActive: true }).toArray();
    }
    const programMap = new Map(programs.map(p => [p._id.toString(), p]));

    const userQuery: any = { role: "participant" };
    if (programId && ObjectId.isValid(programId)) {
      userQuery.programId = new ObjectId(programId);
    }
    const users = await usersCol.find(userQuery).toArray();

    // 3. Fetch attendance records for the range based on attendance day.
    const attendanceRecords = await attendanceCol
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .toArray();

    const sameUser = (record: any, userId: ObjectId): boolean => {
      const rid = record?.userId;
      if (!rid) return false;
      if (typeof rid === "string") return rid === userId.toString();
      if (typeof rid === "object" && "toString" in rid) {
        return rid.toString() === userId.toString();
      }
      return false;
    };

    const formatGps = (gps: unknown) => {
      const point = gps as
        | { latitude?: unknown; longitude?: unknown; accuracy?: unknown }
        | null
        | undefined;
      if (
        !point ||
        typeof point.latitude !== "number" ||
        typeof point.longitude !== "number"
      ) {
        return null;
      }
      const accuracy =
        typeof point.accuracy === "number" ? ` (${Math.round(point.accuracy)}m)` : "";
      return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}${accuracy}`;
    };

    // 4. Generate Daily Report Data
    const reportData: any[] = [];

    for (const date of datesInRange) {
      const dayName = format(date, 'EEEE'); // e.g., 'Monday'
      
      for (const user of users) {
        if (!user.programId) continue;
        
        const program = programMap.get(user.programId.toString());
        if (!program) continue;

        // Skip if it's not a working day for this program
        const workingDays = program.schedule?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        if (!workingDays.includes(dayName)) continue;

        // Find attendance for this user on this day
        const record = attendanceRecords.find((r: any) => {
          if (!sameUser(r, user._id)) return false;
          const recordDate = r.date || r.checkInTime || r.createdAt;
          if (!recordDate) return false;
          return isSameDay(new Date(recordDate), date);
        });

        const dateStr = format(date, 'MM/dd/yyyy');
        
        if (record) {
          const checkInTime = record.checkInTime ? new Date(record.checkInTime) : null;
          const checkInStr = checkInTime ? format(checkInTime, 'HH:mm') : 'None';
          let checkOutStr = '--';
          if (record.checkOutTime) {
            checkOutStr = format(new Date(record.checkOutTime), 'HH:mm');
          }

          const getStrictStatus = () => {
            if (record.type === "manual") {
              const inStatus = record.checkInStatus || "";
              const outStatus = record.checkOutStatus || "";
              
              if (inStatus === "excused" || outStatus === "excused") return "Excused";
              if (inStatus === "half-day" || outStatus === "half-day") return "Half-Day";
              if (inStatus === "absent" || outStatus === "absent") return "Absent";
              if (inStatus === "late") return "Late";
              return "Present";
            }
            
            if (record.type === "absent") return "Absent";
            
            const hasCheckIn = Boolean(record.checkInTime);
            const hasCheckOut = Boolean(record.checkOutTime) || record.type === "completed";
            
            if (hasCheckIn && hasCheckOut) {
               return (record.status === "late" || record.checkInStatus === "late") ? "Late" : "Present";
            }
            
            if (hasCheckIn && !hasCheckOut) {
               const recordDateObj = new Date(record.date || record.checkInTime);
               recordDateObj.setHours(0,0,0,0);
               const todayObj = new Date();
               todayObj.setHours(0,0,0,0);
               
               if (recordDateObj < todayObj) {
                  return "Half-Day";
               } else {
                  return "Checked In";
               }
            }
            
            return "Absent";
          };

          const statusDisplay = getStrictStatus();
          const gps = record.checkInGpsLocation || record.checkOutGpsLocation;
          const location =
            record.locationLabel ||
            formatGps(gps) ||
            (statusDisplay === "Present" || statusDisplay === "Late" || statusDisplay === "Checked In"
              ? "Igire Rwanda Organisation premises"
              : "Unknown");

          // Calculate Late By (dynamic)
          let lateBy = '-';
          if (statusDisplay === 'Late' && checkInTime && program.schedule?.lateAfter) {
            const [h, m] = program.schedule.lateAfter.split(':').map(Number);
            const expected = new Date(checkInTime);
            expected.setHours(h, m, 0, 0);
            const diffMins = Math.floor((checkInTime.getTime() - expected.getTime()) / 60000);
            if (diffMins > 0) {
              lateBy = diffMins >= 60 
                ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m` 
                : `${diffMins} min`;
            }
          }

          reportData.push({
            date: dateStr,
            name: user.name,
            email: user.email,
            program: program.name,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            status: statusDisplay,
            lateBy: lateBy,
            statusExplanation:
              record.type === "manual" && record.manualNotes
                ? `Admin Adjustment: ${record.manualNotes}`
                : statusDisplay === "Present"
                  ? "Full attendance (check-in + check-out)"
                  : statusDisplay === "Late"
                    ? "Completed session with late arrival"
                    : statusDisplay === "Checked In"
                      ? "Checked in only (no check-out yet)"
                      : statusDisplay === "Half-Day"
                        ? "Checked in, but never checked out"
                        : statusDisplay === "Excused"
                          ? "Manually excused"
                          : "No attendance record for scheduled session",
            location,
            photo: record.checkInPhotoUrl || record.checkOutPhotoUrl || "-"
          });
        } else {
          // Check if the day is in the past or today (don't mark as absent for future dates)
          const today = new Date();
          today.setHours(0,0,0,0);
          if (date <= today) {
             // Absent
             reportData.push({
               date: dateStr,
               name: user.name,
               email: user.email,
               program: program.name,
               checkIn: 'None',
               checkOut: '--',
               status: 'Absent',
               lateBy: '-',
               statusExplanation: "No attendance record for scheduled session",
               location: "Unknown",
               photo: '-'
             });
          }
        }
      }
    }

    // 5. Output response based on format
    const presentCount = reportData.filter((r) => r.status === "Present").length;
    const lateCount = reportData.filter((r) => r.status === "Late").length;
    const absentCount = reportData.filter((r) => r.status === "Absent").length;
    const incompleteCount = reportData.filter((r) => r.status === "Checked In").length;
    const halfDayCount = reportData.filter((r) => r.status === "Half-Day").length;
    const excusedCount = reportData.filter((r) => r.status === "Excused").length;
    const totalExpectedSessions = reportData.length;
    const attendanceRate =
      totalExpectedSessions > 0
        ? Math.round((presentCount / totalExpectedSessions) * 100)
        : 0;

    if (formatType === 'json') {
      return NextResponse.json({
        data: reportData,
        summary: {
          totalRecords: totalExpectedSessions,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          incomplete: incompleteCount,
          halfDay: halfDayCount,
          excused: excusedCount,
          attendanceRate,
        },
      });
    }

    // CSV fallback (basic implementation)
    const headers = ['Date', 'Name', 'Email', 'Program', 'Status', 'Status Explanation', 'Check-in', 'Check-out', 'Late By', 'Location', 'Photo'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(r => [
        r.date, r.name, r.email, r.program, r.status, r.statusExplanation, r.checkIn, r.checkOut, r.lateBy, r.location, r.photo
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance-report.csv"`,
      },
    });

  } catch (error) {
    console.error("[ADMIN/REPORTS] GET error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}