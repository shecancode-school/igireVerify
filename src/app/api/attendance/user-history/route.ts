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

    if (!ObjectId.isValid(userIdStr) || !ObjectId.isValid(programIdStr)) {
      return NextResponse.json({ error: "Invalid user or program ID" }, { status: 400 });
    }

    const userId = new ObjectId(userIdStr);
    const programId = new ObjectId(programIdStr);
    const db = await getDb();
    const attendance = db.collection("attendance");

    const now = new Date();

    // Helper to get stats for a range
    async function getStatsForRange(start: Date, end: Date) {
      const records = await attendance
        .find({
          userId,
          programId,
          type: { $in: ["checkin", "completed", "manual", "absent"] },
          $or: [
            { date: { $gte: start, $lte: end } },
            { checkInTime: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } },
          ],
        })
        .toArray();

      const attended = records.filter(
        (r) => r.type !== "absent" && r.checkInStatus !== "absent" && (r.checkInTime || r.type === "manual")
      );
      const checkedOut = records.filter((r) => r.type === "completed" || !!r.checkOutTime);
      const onTime = records.filter(
        (r) => (r.type === "checkin" || r.type === "completed" || r.type === "manual") && r.checkInStatus === "on-time"
      ).length;

      const uniqueDays = new Set(
        attended.map((r) =>
          new Date((r.date as string) || (r.checkInTime as string) || (r.createdAt as string)).toDateString()
        )
      ).size;
      
      return {
        checkedIn: attended.length,
        checkedOut: checkedOut.length,
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
