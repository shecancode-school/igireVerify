import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/attendance/stats/[programId]
 * Get attendance statistics for a program
 * Query params: from=DATE&to=DATE (optional)
 * Accessible by: Admin, HR, Program Facilitators
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const claims = await requireAuthOrRedirect();
    const programId = params.programId;
    const { searchParams } = new URL(req.url);

    // Validate ObjectId format
    if (!ObjectId.isValid(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    // Parse date range
    const fromDate = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const toDate = searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : new Date();

    toDate.setHours(23, 59, 59, 999);

    const db = await getDb();
    const [attendance, programs] = await Promise.all([
      db.collection("attendance"),
      db.collection("programs"),
    ]);

    // Verify program exists and user has access
    const program = await programs.findOne({
      _id: new ObjectId(programId),
      isActive: true,
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Access control: admin, hr officer, or facilitator
    const isFacilitator =
      program.facilitators?.some(
        (fac: ObjectId) => fac.toString() === claims.userId
      ) || false;
    const isHrOfficer = program.hrOfficer?.toString() === claims.userId;

    if (
      claims.role !== "admin" &&
      !isFacilitator &&
      !isHrOfficer
    ) {
      console.warn(
        `[STATS] Access denied for ${claims.role} user ${claims.userId}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get overall statistics
    const stats = await attendance
      .aggregate([
        {
          $match: {
            programId: new ObjectId(programId),
            date: { $gte: fromDate, $lte: toDate },
            type: { $in: ["checkin", "manual"] },
          },
        },
        {
          $group: {
            _id: "$checkInStatus",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const total = stats.reduce((sum, s) => sum + (s.count || 0), 0);
    const onTime = stats.find((s) => s._id === "on-time")?.count || 0;
    const late = stats.find((s) => s._id === "late")?.count || 0;
    const absent = stats.find((s) => s._id === "absent")?.count || 0;

    // Get daily breakdown
    const dailyBreakdown = await attendance
      .aggregate([
        {
          $match: {
            programId: new ObjectId(programId),
            date: { $gte: fromDate, $lte: toDate },
            type: { $in: ["checkin", "manual"] },
          },
        },
        {
          $group: {
            _id: "$date",
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
          },
        },
        {
          $sort: { _id: -1 },
        },
      ])
      .toArray();

    // Get per-participant breakdown
    const perParticipant = await attendance
      .aggregate([
        {
          $match: {
            programId: new ObjectId(programId),
            date: { $gte: fromDate, $lte: toDate },
            type: { $in: ["checkin", "manual"] },
          },
        },
        {
          $group: {
            _id: "$userId",
            userName: { $first: "$userName" },
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
            _id: 1,
            userName: 1,
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
                        {
                          $add: ["$onTime", "$late"],
                        },
                        "$total",
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
        {
          $sort: { attendanceRate: -1 },
        },
      ])
      .toArray();

    console.log(
      `[STATS] Generated stats for program ${programId}: ${total} records`
    );

    return NextResponse.json({
      programId,
      programName: program.name,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      summary: {
        total,
        onTime,
        late,
        absent,
        attendancePercentage:
          total > 0 ? Math.round(((onTime + late) / total) * 100) : 0,
        onTimePercentage: total > 0 ? Math.round((onTime / total) * 100) : 0,
        latePercentage: total > 0 ? Math.round((late / total) * 100) : 0,
        absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
      },
      dailyBreakdown,
      perParticipant,
    });
  } catch (error) {
    console.error("[STATS] Error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
