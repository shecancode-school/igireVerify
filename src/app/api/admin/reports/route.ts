import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { eachDayOfInterval, format, isSameDay, parseISO } from "date-fns";

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

    const userQuery: any = { role: { $in: ["participant", "staff"] } };
    if (programId && ObjectId.isValid(programId)) {
      userQuery.programId = new ObjectId(programId);
    }
    const users = await usersCol.find(userQuery).toArray();

    // 3. Fetch all attendance records for the range to avoid multiple DB calls
    const attendanceRecords = await attendanceCol.find({
      checkInTime: { $gte: startDate, $lte: endDate }
    }).toArray();

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
        const record = attendanceRecords.find(r => 
          r.userId === user._id.toString() && isSameDay(new Date(r.checkInTime), date)
        );

        const dateStr = format(date, 'MM/dd/yyyy');
        
        if (record) {
          // Present or Late
          const checkInTime = new Date(record.checkInTime);
          const checkInStr = format(checkInTime, 'HH:mm');
          let checkOutStr = '--';
          if (record.checkOutTime) {
            checkOutStr = format(new Date(record.checkOutTime), 'HH:mm');
          }

          // Calculate Late By (dynamic)
          let lateBy = '-';
          if (record.status === 'late' && program.schedule?.lateAfter) {
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
            status: record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('-', ' '),
            lateBy: lateBy,
            photo: user.profilePhotoUrl ? '[View]' : '-'
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
               photo: '-'
             });
          }
        }
      }
    }

    // 5. Output response based on format
    if (formatType === 'json') {
      return NextResponse.json({ data: reportData });
    }

    // CSV fallback (basic implementation)
    const headers = ['Date', 'Name', 'Email', 'Program', 'Status', 'Check-in', 'Check-out', 'Late By'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(r => [
        r.date, r.name, r.email, r.program, r.status, r.checkIn, r.checkOut, r.lateBy
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