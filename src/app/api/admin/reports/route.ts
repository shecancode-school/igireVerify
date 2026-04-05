import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/admin/reports
 * Generate attendance report in CSV format
 * Query params: startDate, endDate, format (csv|excel)
 * Admin only
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const programId = searchParams.get('programId');
    const format = searchParams.get('format') || 'csv';

    if (!startDate || !endDate) {
      return NextResponse.json({
        error: "startDate and endDate are required"
      }, { status: 400 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");
    const users = db.collection("users");
    const programs = db.collection("programs");

    // Parse dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query: any = {
      checkInTime: { $gte: start, $lte: end }
    };

    if (programId) {
      const programUsers = await users.find({ programId }).project({ _id: 1 }).toArray();
      const userIds = programUsers.map(u => u._id.toHexString());
      query.userId = { $in: userIds };
    }

    // Get attendance records for the date range
    const attendanceRecords = await attendance
      .find(query)
      .sort({ checkInTime: 1 })
      .toArray();

    // Get unique user IDs
    const userIds = [...new Set(attendanceRecords.map(record => record.userId))];

    // Get user details
    const userList = await users.find({
      _id: { $in: userIds.map(id => new ObjectId(id)) }
    }).toArray();

    const userMap = new Map(userList.map(user => [user._id.toString(), user]));

    // Get program details
    const programIds = [...new Set(userList.map(user => user.programId).filter(Boolean))];
    const programList = programIds.length > 0 ?
      await programs.find({
        _id: { $in: programIds.map(id => new ObjectId(id)) },
        isActive: true
      }).toArray() : [];

    const programMap = new Map(programList.map(program => [program._id.toString(), program]));

    // Generate CSV content
    const csvHeaders = [
      'Date',
      'Time',
      'User Name',
      'Email',
      'Program',
      'Status',
      'Check-in Time',
      'Check-out Time',
      'Location'
    ];

    const csvRows = attendanceRecords.map(record => {
      const user = userMap.get(record.userId);
      const program = user?.programId ? programMap.get(user.programId.toString()) : null;

      const checkInDate = new Date(record.checkInTime);
      const date = checkInDate.toLocaleDateString();
      const time = checkInDate.toLocaleTimeString();

      return [
        date,
        time,
        user?.name || 'Unknown User',
        user?.email || '',
        program?.name || 'No Program',
        record.status,
        record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '',
        record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '',
        record.location || ''
      ];
    });

    const jsonRows = attendanceRecords.map(record => {
      const user = userMap.get(record.userId);
      const program = user?.programId ? programMap.get(user.programId.toString()) : null;

      const checkInDate = new Date(record.checkInTime);
      const dateStr = checkInDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
      const timeStr = checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      let checkOutStr = '--';
      if (record.checkOutTime) {
        checkOutStr = new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      // Calculate Late By
      let lateBy = '-';
      if (record.status === 'late' && program && program.schedule?.lateAfter) {
        // program.schedule.lateAfter is something like "08:15"
        const lateAfterParts = program.schedule.lateAfter.split(':');
        const expectedTime = new Date(checkInDate);
        expectedTime.setHours(parseInt(lateAfterParts[0], 10), parseInt(lateAfterParts[1], 10), 0, 0);
        
        const diffInMs = checkInDate.getTime() - expectedTime.getTime();
        if (diffInMs > 0) {
          const diffMins = Math.floor(diffInMs / 60000);
          if (diffMins > 0) {
             const h = Math.floor(diffMins / 60);
             const m = diffMins % 60;
             lateBy = h > 0 ? `${h}h ${m}m` : `${m} min`;
          }
        }
      }

      return {
        date: dateStr,
        name: user?.name || 'Unknown User',
        program: program?.name || '--',
        checkIn: timeStr,
        checkOut: checkOutStr,
        status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
        lateBy: lateBy,
        photo: user?.profilePhotoUrl ? '[View]' : '-'
      };
    });

    if (format === 'json') {
      return NextResponse.json({
        data: jsonRows
      });
    }

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Generate filename
    const filename = `attendance-report-${startDate}-to-${endDate}.${format === 'excel' ? 'csv' : 'csv'}`;

    console.log(`[ADMIN/REPORTS] Generated report with ${attendanceRecords.length} records`);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[ADMIN/REPORTS] GET error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}