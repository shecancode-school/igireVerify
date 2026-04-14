import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { startOfWeek, addDays, format } from "date-fns";

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
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    // Fetch all attendance for this user for the current week
    const records = await attendance
      .find({
        userId,
        programId,
        type: { $in: ["checkin", "completed", "manual", "absent"] },
        $or: [
          { date: { $gte: weekStart, $lte: now } },
          { checkInTime: { $gte: weekStart, $lte: now } },
          { createdAt: { $gte: weekStart, $lte: now } },
        ],
      })
      .toArray();

    // Map to daily rates
    const data = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      const dayRecords = records.filter((r) => {
        const d = new Date((r.date as string) || (r.checkInTime as string) || (r.createdAt as string));
        return d.toDateString() === dayDate.toDateString();
      });
      
      const hasCheckedIn = dayRecords.some(
        (r) => (r.type === "checkin" || r.type === "completed" || r.type === "manual") && r.checkInStatus !== "absent"
      );
      const hasCheckedOut = dayRecords.some(
        (r) => r.type === "completed" || Boolean(r.checkOutTime)
      );
      const isLate = dayRecords.some(
        (r) => (r.type === "checkin" || r.type === "completed" || r.type === "manual") && r.checkInStatus === "late"
      );
      
      let rate = 0;
      if (hasCheckedIn && hasCheckedOut) {
        rate = isLate ? 85 : 100;
      } else if (hasCheckedIn) {
        rate = 50;
      }

      data.push({
        name: format(dayDate, 'EEE'), // Mon, Tue, etc.
        rate,
        previous: 75 // Constant or fetched baseline
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("User chart fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
