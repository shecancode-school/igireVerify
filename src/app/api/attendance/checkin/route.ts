import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAttendanceStatus, isValidAttendanceDay } from "@/lib/attendance-rules";
import { emitAttendanceUpdate } from "@/lib/socket-server";
import { checkInSchema } from "@/lib/validation";

/**
 * POST /api/attendance/checkin
 * Record check-in for a participant
 * Required: userId, programId, userName, programName, checkInTime, photoUrl
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const result = checkInSchema.safeParse(body);
    if (!result.success) {
      console.warn("[CHECKIN] Validation failed:", result.error.issues);
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { userId, programId, userName, programName, checkInTime, photoUrl, gpsLocation, role } =
      result.data;

    const db = await getDb();
    const [attendance, programs, users] = await Promise.all([
      db.collection("attendance"),
      db.collection("programs"),
      db.collection("users"),
    ]);

    const now = new Date();
    const checkInDateTime = new Date(checkInTime);

    // Get program to fetch schedule
    const program = await programs.findOne({
      _id: new ObjectId(programId),
      isActive: true,
    });

    if (!program) {
      console.warn(`[CHECKIN] Program not found: ${programId}`);
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Validate attendance day
    const programCode = program.code;
    if (!isValidAttendanceDay(programCode, checkInDateTime)) {
      console.warn(
        `[CHECKIN] Invalid attendance day for ${programCode} on ${checkInDateTime.toDateString()}`
      );
      const validDays = program.schedule.days.join(", ");
      return NextResponse.json(
        {
          error: `Check-in not allowed today. Valid days: ${validDays}`,
        },
        { status: 400 }
      );
    }

    // Check if already checked in today
    const today = new Date(checkInDateTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await attendance.findOne({
      userId: new ObjectId(userId),
      programId: new ObjectId(programId),
      type: "checkin",
      checkInTime: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingCheckIn) {
      console.warn(`[CHECKIN] User ${userId} already checked in today`);
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 400 }
      );
    }

    // Determine check-in status
    const status = getAttendanceStatus(checkInDateTime, program.schedule);

    const record = {
      userId: new ObjectId(userId),
      programId: new ObjectId(programId),
      userName,
      programName,
      role: role || "participant",
      type: "checkin",
      checkInTime: checkInDateTime.toISOString(),
      checkInStatus: status,
      checkInPhotoUrl: photoUrl,
      checkInGpsLocation: gpsLocation,
      checkInMethod: "AUTO",
      createdAt: now,
      updatedAt: now,
      date: today, // Date component for filtering
    };

    const insertResult = await attendance.insertOne(record);

    // Verify insertion
    const verification = await attendance.findOne({ _id: insertResult.insertedId });
    if (!verification) {
      throw new Error("Check-in data not persisted");
    }

    console.log(
      `[CHECKIN] User ${userName} checked in. ID: ${insertResult.insertedId}, Status: ${status}`
    );

    // Emit real-time update to the program room
    emitAttendanceUpdate(programId, {
      type: "checkin",
      userId,
      userName,
      programName,
      status,
      timestamp: checkInDateTime.toISOString(),
    });

    // Emit to user's dashboard
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (user) {
      emitAttendanceUpdate(userId, {
        type: "checkin",
        userId,
        userName,
        programName,
        status,
        timestamp: checkInDateTime.toISOString(),
      });
    }

    // Emit to HR officer if assigned
    if (program.hrOfficer) {
      emitAttendanceUpdate(program.hrOfficer.toString(), {
        type: "checkin",
        userId,
        userName,
        programName,
        status,
        timestamp: checkInDateTime.toISOString(),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        status,
        message: status === "on-time" ? "Check-in successful" : "Check-in recorded as late",
        recordId: insertResult.insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKIN] Error:", error);
    const message = error instanceof Error ? error.message : "Check-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}