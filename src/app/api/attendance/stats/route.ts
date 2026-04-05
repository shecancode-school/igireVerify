// src/app/api/attendance/stats/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');
    const date = searchParams.get('date');

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    // Default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all attendance records for the program and date
    const records = await attendance.find({
      programName: programId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).toArray();

    // Calculate statistics
    const stats = {
      totalParticipants: new Set(records.filter(r => r.role === 'participant').map(r => r.userId)).size,
      totalStaff: new Set(records.filter(r => r.role === 'staff').map(r => r.userId)).size,
      checkedIn: new Set(records.filter(r => r.type === 'checkin').map(r => r.userId)).size,
      checkedOut: new Set(records.filter(r => r.type === 'checkout').map(r => r.userId)).size,
      onTime: records.filter(r => r.type === 'checkin' && r.status === 'on-time').length,
      late: records.filter(r => r.type === 'checkin' && r.status === 'late').length,
      absent: 0, // Would need to calculate based on enrolled users vs checked in
      present: new Set(records.filter(r => r.type === 'checkin').map(r => r.userId)).size,
      lastUpdate: new Date().toISOString()
    };

    return NextResponse.json({
      ok: true,
      stats,
      programId,
      date: targetDate.toISOString()
    });

  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance stats" }, { status: 500 });
  }
}