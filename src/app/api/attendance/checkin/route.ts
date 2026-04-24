import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getAttendanceStatus, isValidAttendanceDay, STAFF_RULES, getAttendanceWindowMessage } from "@/lib/attendance-rules";
import { emitAttendanceUpdate } from "@/lib/socket-server";
import { checkInSchema } from "@/lib/validation";
import { getUserTimezone, formatTimeWithZone } from "@/lib/timezone-utils";
import { toZonedTime } from 'date-fns-tz';
import { getProgramDateWindowError } from "@/lib/program-time";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = checkInSchema.safeParse(body);
    if (!result.success) {
      const issues = result.error.issues;
      const isPhotoMissing = issues.some(i => i.path.includes('photoUrl'));
      return NextResponse.json(
        { error: isPhotoMissing ? "A photo is required for check-in. Please capture your photo before submitting your attendance." : "Some required information is missing. Please complete all steps and try again." },
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

    const nowUTC = new Date();
    let schedule;
    let program;
    let programTimeZone = 'Africa/Kigali';
    if (role === 'staff') {
      schedule = STAFF_RULES;
    } else {
      if (!/^[0-9a-fA-F]{24}$/.test(programId)) {
        return NextResponse.json({ error: "Invalid program selected for participant" }, { status: 400 });
      }

      program = await programs.findOne({
        _id: new ObjectId(programId),
        isActive: true,
      });

      if (!program) {
        console.warn(`[CHECKIN] Program not found: ${programId}`);
        return NextResponse.json({ error: "The selected program could not be found. Please contact support if this issue persists." }, { status: 404 });
      }
      schedule = program.schedule;
      if (program.timeZone) {
        programTimeZone = program.timeZone;
      }

      const programDateError = getProgramDateWindowError(
        nowUTC,
        program as unknown as { startDate?: Date; endDate?: Date },
        programTimeZone
      );
      if (programDateError) {
        return NextResponse.json({ error: programDateError }, { status: 400 });
      }
    }

    const checkInDateTime = toZonedTime(nowUTC, programTimeZone);
    const clientReportedCheckInTimeUTC = new Date(checkInTime);

    const windowMessage = getAttendanceWindowMessage('checkin', schedule, checkInDateTime);
    if (windowMessage) {
      const sessionTime = formatTimeWithZone(checkInDateTime, programTimeZone);
      const userTime = formatTimeWithZone(new Date(), req.headers.get('x-timezone') || 'UTC');
      return NextResponse.json({
        error: `Check-in not allowed at this time. ${windowMessage}\nSession time: ${sessionTime}. Your current time: ${userTime}. If you believe this is an error, please contact the Help Desk.`
      }, { status: 400 });
    }

    const today = new Date(checkInDateTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const toObjectId = (id: string): ObjectId | string =>
      /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;

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
        { error: "You have already checked in for today's session. If you believe this is an error, please contact the Help Desk." },
        { status: 400 }
      );
    }

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
      clientReportedCheckInTimeUTC,
      locationLabel: "Igire Rwanda Organisation premises",
      checkInMethod: "AUTO",
      createdAt: nowUTC,
      updatedAt: nowUTC,
      date: today,
    };

    const insertResult = await attendance.insertOne(record);


    const verification = await attendance.findOne({ _id: insertResult.insertedId });
    if (!verification) {
      throw new Error("Check-in data not persisted");
    }

    console.log(
      `[CHECKIN] User ${userName} checked in. ID: ${insertResult.insertedId}, Status: ${status}`
    );

    emitAttendanceUpdate(programId, {
      type: "checkin",
      userId,
      programId,
      userName,
      programName: program?.name || programName,
      status,
      timestamp: checkInDateTime.toISOString(),
    });

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
        message: status === "on-time"
          ? "Check-in successful. Welcome to your session!"
          : "Check-in recorded as late. Please be on time for future sessions.",
        recordId: insertResult.insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKIN] Error:", error);
    const message = error instanceof Error ? error.message : "Check-in failed due to a server error. Please try again or contact support.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}