import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/admin/attendance
 * Get attendance records for a specific date or date range
 * Query params: date (YYYY-MM-DD), startDate, endDate
 * Admin only
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const programId = searchParams.get('programId');

    const db = await getDb();
    const attendance = db.collection("attendance");
    const users = db.collection("users");
    const programs = db.collection("programs");

    const query: any = {};

    if (date) {
      // Single date query
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.checkInTime = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      // Date range query
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.checkInTime = { $gte: start, $lte: end };
    } else {
      // Default to today
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      query.checkInTime = { $gte: startOfDay, $lte: endOfDay };
    }

    if (programId) {
      const programUsers = await users.find({ programId }).project({ _id: 1 }).toArray();
      const userIds = programUsers.map(u => u._id.toHexString());
      query.userId = { $in: userIds };
    }

    // Get attendance records
    const attendanceRecords = await attendance
      .find(query)
      .sort({ checkInTime: -1 })
      .toArray();

    // Get unique user IDs
    const userIds = [...new Set(attendanceRecords.map(record => record.userId))];

    // Get user details
    const userList = await users.find({
      _id: { $in: userIds.map(id => new ObjectId(id)) }
    }).toArray();

    const userMap = new Map(userList.map(user => [user._id.toString(), user]));

    // Get program details if needed
    const programIds = [...new Set(userList.map(user => user.programId).filter(Boolean))];
    const programList = programIds.length > 0 ?
      await programs.find({
        _id: { $in: programIds.map(id => new ObjectId(id)) },
        isActive: true
      }).toArray() : [];

    const programMap = new Map(programList.map(program => [program._id.toString(), program]));

    // Enrich attendance records
    const enrichedRecords = attendanceRecords.map(record => {
      const user = userMap.get(record.userId);
      const program = user?.programId ? programMap.get(user.programId.toString()) : null;

      return {
        _id: record._id,
        userId: record.userId,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || '',
        profilePhotoUrl: user?.profilePhotoUrl || null,
        programName: program?.name || 'No Program',
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        status: record.status,
        location: record.location,
        createdAt: record.createdAt,
      };
    });

    console.log(`[ADMIN/ATTENDANCE] Retrieved ${enrichedRecords.length} attendance records`);

    return NextResponse.json({
      records: enrichedRecords,
      date: date || new Date().toISOString().split('T')[0],
      total: enrichedRecords.length
    });
  } catch (error) {
    console.error("[ADMIN/ATTENDANCE] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance records" }, { status: 500 });
  }
}