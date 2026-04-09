import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, formatTimeToHHMM } from "@/lib/attendance-rules";
import { ObjectId } from "mongodb";

/**
 * GET /api/attendance/maintenance/absentees
 * Identifies and marks participants who missed the check-in window as "Absent".
 * Can be triggered on dashboard load by Admin/Staff.
 */
export async function GET() {
  try {
    const db = await getDb();
    const [attendance, users, programs] = await Promise.all([
      db.collection("attendance"),
      db.collection("users"),
      db.collection("programs"),
    ]);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // 1. Get all active programs and their schedules
    const activePrograms = await programs.find({ isActive: true }).toArray();
    
    let totalMarked = 0;

    for (const program of activePrograms) {
      const schedule = program.schedule;
      if (!schedule) continue;

      // Only check if we are past the check-in window end
      const currentTimeStr = formatTimeToHHMM(now);
      if (currentTimeStr <= schedule.checkInEnd) continue;

      // 2. Get all active participants for this program
      const participants = await users.find({
        role: "participant",
        programId: program._id,
        isActive: true,
      }).toArray();

      for (const participant of participants) {
        // 3. Check if they have a check-in record for today
        const existingRecord = await attendance.findOne({
          userId: participant._id,
          programId: program._id,
          $or: [
            { date: { $gte: todayStart, $lt: tomorrowStart } },
            { checkInTime: { $gte: todayStart, $lt: tomorrowStart } },
            { createdAt: { $gte: todayStart, $lt: tomorrowStart } },
          ],
          type: { $in: ["checkin", "completed", "manual", "absent"] },
        });

        if (!existingRecord) {
          // 4. Mark as Absent
          await attendance.insertOne({
            userId: participant._id,
            programId: program._id,
            userName: participant.name,
            programName: program.name,
            role: "participant",
            type: "absent",
            date: todayStart,
            checkInStatus: "absent",
            createdAt: now,
            updatedAt: now,
            notes: "Automatically marked as absent after window closure.",
          });
          totalMarked++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Maintenance complete. Marked ${totalMarked} absentees.`,
      absenteesCount: totalMarked,
    });
  } catch (error) {
    console.error("[ABSENTEE_MAINTENANCE] Error:", error);
    return NextResponse.json({ error: "Failed to run absentee maintenance" }, { status: 500 });
  }
}
