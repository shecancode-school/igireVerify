// src/app/api/attendance/user-stats/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const programId = searchParams.get('programId');

    if (!userId || !programId) {
      return NextResponse.json({ error: "User ID and Program ID are required" }, { status: 400 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    // Get current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all attendance records for this user this month
    const userRecords = await attendance.find({
      userId,
      programName: programId,
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth
      }
    }).toArray();

    // Calculate stats
    const uniqueDays = new Set(userRecords.map(r => new Date(r.createdAt).toDateString()));
    const daysAttended = uniqueDays.size;

    // Check today's status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysRecords = userRecords.filter(r =>
      new Date(r.createdAt) >= today && new Date(r.createdAt) < tomorrow
    );

    let todaysStatus: 'not-checked-in' | 'checked-in' | 'checked-out' = 'not-checked-in';
    if (todaysRecords.some(r => r.type === 'checkout')) {
      todaysStatus = 'checked-out';
    } else if (todaysRecords.some(r => r.type === 'checkin')) {
      todaysStatus = 'checked-in';
    }

    // For now, set pending alerts to late arrivals this month
    const pendingAlerts = userRecords.filter(r => r.type === 'checkin' && r.status === 'late').length;

    // Calculate missed days (simplified - would need enrollment data)
    const missedDays = 0; // TODO: Calculate based on expected vs actual attendance

    return NextResponse.json({
      ok: true,
      stats: {
        daysAttended,
        pendingAlerts,
        missedDays,
        todaysStatus
      }
    });

  } catch (error) {
    console.error("User stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
}