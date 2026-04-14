import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get('userId');
    const programIdStr = searchParams.get('programId');

    if (!userIdStr || !programIdStr) {
      return NextResponse.json({ error: "User ID and Program ID are required" }, { status: 400 });
    }

    if (!ObjectId.isValid(userIdStr) || !ObjectId.isValid(programIdStr)) {
      return NextResponse.json({ error: "Invalid user or program ID" }, { status: 400 });
    }

    const userId = new ObjectId(userIdStr);
    const programId = new ObjectId(programIdStr);

    const db = await getDb();
    const attendance = db.collection("attendance");
    const users = db.collection("users");
    const programs = db.collection("programs");

    const [user, program] = await Promise.all([
      users.findOne({ _id: userId }),
      programs.findOne({ _id: programId })
    ]);

    if (!user || !program) {
      return NextResponse.json({ error: "User or Program not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const userRecords = await attendance
      .find({
        userId,
        programId,
        type: { $in: ["checkin", "completed", "manual", "absent"] },
        $or: [
          { date: { $gte: startOfMonth, $lt: endOfMonth } },
          { checkInTime: { $gte: startOfMonth, $lt: endOfMonth } },
          { createdAt: { $gte: startOfMonth, $lt: endOfMonth } },
        ],
      })
      .toArray();

    const uniqueDaysAttended = new Set(
      userRecords
        .filter((r) => r.checkInStatus !== "absent" && r.type !== "absent" && (r.type === "completed" || !!r.checkOutTime))
        .map((r) =>
          new Date((r.date as string) || (r.checkInTime as string) || (r.createdAt as string)).toDateString()
        )
    ).size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysRecords = userRecords.filter((r) => {
      const d = new Date((r.date as string) || (r.checkInTime as string) || (r.createdAt as string));
      return d >= today && d < tomorrow;
    });

    let todaysStatus: 'not-checked-in' | 'checked-in' | 'checked-out' = 'not-checked-in';
    if (todaysRecords.some(r => r.type === 'completed' || r.checkOutTime)) {
      todaysStatus = 'checked-out';
    } else if (
      todaysRecords.some(
        (r) =>
          (r.type === 'checkin' || r.type === 'manual') &&
          r.checkInStatus !== 'absent' &&
          r.type !== 'absent'
      )
    ) {
      todaysStatus = 'checked-in';
    }

    const pendingAlerts = userRecords.filter(
      (r) => (r.type === 'checkin' || r.type === 'manual' || r.type === 'completed') && r.checkInStatus === 'late'
    ).length;

    // Expected schedule days from enrollment (or month start) through today.
    const calcStart = user.enrollmentDate && new Date(user.enrollmentDate) > startOfMonth 
      ? new Date(user.enrollmentDate) 
      : startOfMonth;
    
    let expectedDays = 0;
    const tempDate = new Date(calcStart);
    tempDate.setHours(0, 0, 0, 0);
    
    const countUntil = new Date(now);
    countUntil.setHours(0, 0, 0, 0);

    const programDays = program.schedule?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    while (tempDate <= countUntil) {
      const dayName = tempDate.toLocaleDateString('en-US', { weekday: 'long' });
      if (programDays.includes(dayName)) {
        expectedDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const missedDays = Math.max(0, expectedDays - uniqueDaysAttended);

    return NextResponse.json({
      ok: true,
      stats: {
        daysAttended: uniqueDaysAttended,
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