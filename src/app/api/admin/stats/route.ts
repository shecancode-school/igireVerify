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

    // Professional rule:
    // Present = completed session only (has check-in + check-out).
    const [presentToday, lateToday, checkedInToday, incompleteToday] = await Promise.all([
      attendance.distinct("userId", {
        type: "completed",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      }).then((usersToday) => Array.isArray(usersToday) ? usersToday.length : 0),
      attendance.countDocuments({
        type: { $in: ["checkin", "completed"] },
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        checkInStatus: "late",
      }),
      attendance.distinct("userId", {
        type: { $in: ["checkin", "completed"] },
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        checkInStatus: { $in: ["on-time", "late"] },
      }).then((usersToday) => Array.isArray(usersToday) ? usersToday.length : 0),
      attendance.distinct("userId", {
        type: "checkin",
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        checkOutTime: { $exists: false },
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
      type: { $in: ["checkin", "completed"] },
      createdAt: { $gte: startOfMonth, $lte: now },
      checkInStatus: "late"
    });
    
    const totalParticipantsCount = await users.countDocuments({ role: "participant" });
    const absentTodayCount = Math.max(0, totalParticipantsCount - checkedInToday);

    // Calculate real average attendance rate this month
    const monthRecordCount = await attendance.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: now },
      type: "completed"
    });
    const avgAttendanceRate = totalParticipantsCount > 0 && monthRecordCount > 0
      ? Math.round((monthRecordCount / (totalParticipantsCount * now.getDate())) * 100)
      : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        totalPrograms,
        totalUsers,
        totalAttendanceRecords,
        activeProgramsToday,
        presentToday,
        lateToday,
        incompleteToday,
        absentToday: absentTodayCount,
        checkinsLastHour,
        mostActiveProgram,
        lateThisMonth,
        avgAttendanceRate: Math.min(100, avgAttendanceRate),
      },
    });
  } catch (error) {
    console.error("[ADMIN/STATS] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
