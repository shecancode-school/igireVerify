import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId');
    const programIdStr = searchParams.get('programId');

    if (!userIdStr || !programIdStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const userId = new ObjectId(userIdStr);
    const programId = new ObjectId(programIdStr);
    const db = await getDb();
    const attendance = db.collection("attendance");

    const now = new Date();

    // Helper to get stats for a range
    async function getStatsForRange(start: Date, end: Date) {
      const records = await attendance.find({
        userId,
        programId,
        createdAt: { $gte: start, $lte: end }
      }).toArray();

      const checkins = records.filter(r => r.type === 'checkin');
      const checkouts = records.filter(r => r.type === 'checkout');
      const onTime = checkins.filter(r => r.status === 'on-time').length;
      
      const uniqueDays = new Set(checkins.map(r => new Date(r.createdAt).toDateString())).size;
      
      return {
        checkedIn: checkins.length,
        checkedOut: checkouts.length,
        onTimeCount: onTime,
        uniqueDays,
        onTimeStatus: onTime > 0 ? "On-Time" : "Needs Improvement",
        percentage: 0 // Will handle via UI or further logic
      };
    }

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [weekStats, monthStats] = await Promise.all([
      getStatsForRange(weekStart, weekEnd),
      getStatsForRange(monthStart, monthEnd)
    ]);

    return NextResponse.json({
      week: weekStats,
      month: monthStats
    });

  } catch (error) {
    console.error("User history fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
