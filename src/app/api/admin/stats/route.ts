import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

export async function GET() {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const programs = db.collection("programs");
    const attendance = db.collection("attendance");

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalPrograms, totalUsers, totalAttendanceRecords, activeProgramsToday] =
      await Promise.all([
        programs.countDocuments({ isActive: true }),
        users.countDocuments({}),
        attendance.countDocuments({}),
        programs.countDocuments({
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        }),
      ]);

    const [presentToday, lateToday, checkedInToday] = await Promise.all([
      attendance.countDocuments({
        type: "checkin",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: "on-time",
      }),
      attendance.countDocuments({
        type: "checkin",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: "late",
      }),
      attendance.distinct("userId", {
        type: "checkin",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).then((usersToday) => Array.isArray(usersToday) ? usersToday.length : 0),
    ]);
    
    // Checkins in last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const checkinsLastHour = await attendance.countDocuments({
      type: "checkin",
      createdAt: { $gte: oneHourAgo, $lte: now },
    });

    // Most active program today
    const activeProgramAgg = await attendance.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay } } },
      { $group: { _id: "$programName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]).toArray();
    const mostActiveProgram = activeProgramAgg.length > 0 ? activeProgramAgg[0]._id : "None";

    // Late arrivals this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lateThisMonth = await attendance.countDocuments({
      type: "checkin",
      createdAt: { $gte: startOfMonth, $lte: now },
      status: "late"
    });
    
    const avgAttendanceRate = 85; // Default approximation for weekley avg rate

    const absentToday = Math.max(0, checkedInToday - presentToday - lateToday); // placeholder (depends on registered users)

    return NextResponse.json({
      ok: true,
      stats: {
        totalPrograms,
        totalUsers,
        totalAttendanceRecords,
        activeProgramsToday,
        presentToday,
        lateToday,
        absentToday,
        checkinsLastHour,
        mostActiveProgram,
        lateThisMonth,
        avgAttendanceRate,
      },
    });
  } catch (error) {
    console.error("[ADMIN/STATS] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
