import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, getAttendanceWindowMessage, formatTimeToHHMM } from "@/lib/attendance-rules";

/**
 * POST /api/attendance/preflight
 * Lightweight pre-check before photo upload.
 * Validates: time window, existing check-in (for checkout), duplicate records.
 * Does NOT upload photos or create records.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, programId, type, role } = body;

    if (!userId || !programId || !type) {
      return NextResponse.json(
        { error: "Missing required information. Please ensure all steps are completed." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [attendance, programs] = await Promise.all([
      db.collection("attendance"),
      db.collection("programs"),
    ]);

    const now = new Date();
    let schedule;

    if (role === "staff") {
      schedule = STAFF_RULES;
    } else {
      if (!/^[0-9a-fA-F]{24}$/.test(programId)) {
        return NextResponse.json(
          { error: "Your program could not be identified. Please log out and log back in." },
          { status: 400 }
        );
      }

      const program = await programs.findOne({
        _id: new ObjectId(programId),
        isActive: true,
      });

      if (!program) {
        return NextResponse.json(
          { error: "Your program is currently inactive or could not be found. Please contact your program coordinator." },
          { status: 404 }
        );
      }
      schedule = program.schedule;
    }

    // Check time window
    const windowMessage = getAttendanceWindowMessage(type, schedule, now);
    if (windowMessage) {
      return NextResponse.json({ error: windowMessage }, { status: 400 });
    }

    // Date boundaries for today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const toObjectId = (id: string) =>
      /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : (id as any);

    if (type === "checkin") {
      // Check for duplicate check-in
      const existingCheckIn = await attendance.findOne({
        userId: new ObjectId(userId),
        programId: toObjectId(programId),
        type: "checkin",
        checkInTime: { $gte: today, $lt: tomorrow },
      });

      if (existingCheckIn) {
        return NextResponse.json(
          { error: "You have already checked in for today. No further action is needed." },
          { status: 400 }
        );
      }
    }

    if (type === "checkout") {
      // Check that a check-in exists
      const checkInRecord = await attendance.findOne({
        userId: new ObjectId(userId),
        programId: toObjectId(programId),
        type: "checkin",
        checkInTime: {
          $gte: today.toISOString(),
          $lt: tomorrow.toISOString(),
        },
      });

      if (!checkInRecord) {
        return NextResponse.json(
          { error: "You must complete your check-in first before you can check out. Please ensure you have checked in for today's session." },
          { status: 400 }
        );
      }

      if (checkInRecord.checkOutTime) {
        return NextResponse.json(
          { error: "You have already completed your check-out for today. No further action is needed." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true, message: "Pre-flight check passed. You may proceed." });
  } catch (error) {
    console.error("[PREFLIGHT] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again in a moment." },
      { status: 500 }
    );
  }
}
