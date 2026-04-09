import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAttendanceStatus, isValidAttendanceDay, STAFF_RULES, getAttendanceWindowMessage } from "@/lib/attendance-rules";
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
      const issues = result.error.issues;
      const isPhotoMissing = issues.some(i => i.path.includes('photoUrl'));
      
      return NextResponse.json(
        { error: isPhotoMissing ? "Please capture a photo before submitting your attendance." : "Missing required information. Please ensure all steps are completed." },
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

    let schedule;
    let program;

    if (role === 'staff') {
      schedule = STAFF_RULES;
    } else {
      // Validate programId format before conversion
      if (!/^[0-9a-fA-F]{24}$/.test(programId)) {
        return NextResponse.json({ error: "Invalid program selected for participant" }, { status: 400 });
      }

      program = await programs.findOne({
        _id: new ObjectId(programId),
        isActive: true,
      });

      if (!program) {
        console.warn(`[CHECKIN] Program not found: ${programId}`);
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
      schedule = program.schedule;
    }

    // Validate attendance window and day
    const windowMessage = getAttendanceWindowMessage('checkin', schedule, checkInDateTime);
    if (windowMessage) {
      return NextResponse.json({ error: windowMessage }, { status: 400 });
    }

    // Check if already checked in today
    const today = new Date(checkInDateTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Helper to safely create ObjectId
    const toObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id as any;

    const existingCheckIn = await attendance.findOne({
      userId: new ObjectId(userId),
      programId: toObjectId(programId),
      type: { $in: ["checkin", "completed"] },
      checkInTime: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: "You have already checked in for today." },
        { status: 400 }
      );
    }

    // Determine check-in status
    const status = getAttendanceStatus(checkInDateTime, schedule);

    const record = {
      userId: new ObjectId(userId),
      programId: toObjectId(programId),
      userName,
      programName,
      role: role || "participant",
      type: "checkin",
      checkInTime: checkInDateTime,
      checkInStatus: status,
      checkInPhotoUrl: photoUrl,
      checkInGpsLocation: gpsLocation,
      // Check-in is only allowed after location verification near Igire premises.
      locationLabel: "Igire Rwanda Organisation premises",
      checkInMethod: "AUTO",
      createdAt: now,
      updatedAt: now,
      date: today,
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
      programId,
      userName,
      programName: program?.name || programName,
      status,
      timestamp: checkInDateTime.toISOString(),
    });

    // Emit to user's dashboard
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (user) {
      emitAttendanceUpdate(userId, {
        type: "checkin",
        userId,
        programId,
        userName,
        programName: program?.name || programName,
        status,
        timestamp: checkInDateTime.toISOString(),
      });
    }

    // Emit to HR officer if assigned (only for participants with programs)
    if (program && program.hrOfficer) {
      emitAttendanceUpdate(program.hrOfficer.toString(), {
        type: "checkin",
        userId,
        programId,
        userName,
        programName: program.name,
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