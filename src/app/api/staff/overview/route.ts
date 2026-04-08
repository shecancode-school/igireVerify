import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/staff/overview
 * Aggregated attendance across all active programs (admin-managed).
 * Query: programId (optional), range=today|week|month
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const programFilter = searchParams.get("programId");
    const range = searchParams.get("range") || "month";

    const now = new Date();
    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    let fromDate: Date;
    if (range === "today") {
      fromDate = new Date(now);
      fromDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 7);
      fromDate.setHours(0, 0, 0, 0);
    } else {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const db = await getDb();
    const programsCol = db.collection("programs");
    const usersCol = db.collection("users");
    const attendanceCol = db.collection("attendance");

    const programQuery: Record<string, unknown> = { isActive: true };
    if (programFilter && ObjectId.isValid(programFilter)) {
      programQuery._id = new ObjectId(programFilter);
    }

    const programs = await programsCol
      .find(programQuery)
      .project({ name: 1, code: 1 })
      .sort({ name: 1 })
      .toArray();

    const programIds = programs.map((p) => p._id);

    if (programIds.length === 0) {
      return NextResponse.json({
        programs: [],
        participantCount: 0,
        summary: {
          checkInRecords: 0,
          onTime: 0,
          late: 0,
          absent: 0,
          attendancePercentage: 0,
          onTimePercentage: 0,
          presentToday: 0,
          lateInPeriod: 0,
        },
        perParticipant: [],
        programBreakdown: [],
        dateRange: { from: fromDate.toISOString(), to: toDate.toISOString(), range },
      });
    }

    const participantCount = await usersCol.countDocuments({
      role: "participant",
      programId: { $in: programIds },
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    });

    const attendanceMatch = {
      programId: { $in: programIds },
      date: { $gte: fromDate, $lte: toDate },
      type: { $in: ["checkin", "manual"] },
    };

    const statusAgg = await attendanceCol
      .aggregate([
        { $match: attendanceMatch },
        { $group: { _id: "$checkInStatus", count: { $sum: 1 } } },
      ])
      .toArray();

    const checkInRecords = statusAgg.reduce((s, x) => s + (x.count || 0), 0);
    const onTime = statusAgg.find((s) => s._id === "on-time")?.count || 0;
    const late = statusAgg.find((s) => s._id === "late")?.count || 0;
    const absent = statusAgg.find((s) => s._id === "absent")?.count || 0;

    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday);
    endToday.setDate(endToday.getDate() + 1);

    const presentToday = await attendanceCol.countDocuments({
      programId: { $in: programIds },
      type: "checkin",
      createdAt: { $gte: startToday, $lt: endToday },
    });

    const programBreakdown = await Promise.all(
      programs.map(async (p) => {
        const enrolled = await usersCol.countDocuments({
          role: "participant",
          programId: p._id,
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        });
        const checkInsToday = await attendanceCol.countDocuments({
          programId: p._id,
          type: "checkin",
          createdAt: { $gte: startToday, $lt: endToday },
        });
        return {
          _id: p._id.toString(),
          name: p.name,
          code: p.code,
          enrolled,
          checkInsToday,
        };
      })
    );

    const perParticipant = await attendanceCol
      .aggregate([
        { $match: attendanceMatch },
        {
          $group: {
            _id: { userId: "$userId", programId: "$programId" },
            userName: { $first: "$userName" },
            programName: { $first: "$programName" },
            onTime: {
              $sum: {
                $cond: [{ $eq: ["$checkInStatus", "on-time"] }, 1, 0],
              },
            },
            late: {
              $sum: {
                $cond: [{ $eq: ["$checkInStatus", "late"] }, 1, 0],
              },
            },
            absent: {
              $sum: {
                $cond: [{ $eq: ["$checkInStatus", "absent"] }, 1, 0],
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            userId: { $toString: "$_id.userId" },
            programId: { $toString: "$_id.programId" },
            userName: 1,
            programName: 1,
            onTime: 1,
            late: 1,
            absent: 1,
            total: 1,
            attendanceRate: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $add: ["$onTime", "$late"] },
                        { $cond: [{ $eq: ["$total", 0] }, 1, "$total"] },
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { programName: 1, userName: 1 } },
      ])
      .toArray();

    return NextResponse.json({
      programs: programs.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        code: p.code,
      })),
      participantCount,
      summary: {
        checkInRecords,
        onTime,
        late,
        absent,
        attendancePercentage:
          checkInRecords > 0
            ? Math.round(((onTime + late) / checkInRecords) * 100)
            : 0,
        onTimePercentage:
          checkInRecords > 0 ? Math.round((onTime / checkInRecords) * 100) : 0,
        presentToday,
        lateInPeriod: late,
      },
      perParticipant,
      programBreakdown,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        range,
      },
    });
  } catch (error) {
    console.error("[STAFF/OVERVIEW] Error:", error);
    return NextResponse.json(
      { error: "Failed to load staff overview" },
      { status: 500 }
    );
  }
}
