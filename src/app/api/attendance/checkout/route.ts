import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, getAttendanceWindowMessage, isWithinCheckOutWindow } from "@/lib/attendance-rules";
import { emitAttendanceUpdate } from "@/lib/socket-server";
import { checkOutSchema } from "@/lib/validation";
import { getUserTimezone, formatTimeWithZone } from "@/lib/timezone-utils";
import { toZonedTime } from 'date-fns-tz';

/**
 * POST /api/attendance/checkout
 * Record checkout for a participant
 * Required: userId, programId, checkOutTime, photoUrl
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const result = checkOutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Some required information is missing. Please complete all steps and try again." },
        { status: 400 }
      );
    }

    const { userId, programId, checkOutTime, photoUrl, gpsLocation, role } =
      result.data;

    const db = await getDb();
    const [attendance, programs, users] = await Promise.all([
      db.collection("attendance"),
      db.collection("programs"),
      db.collection("users"),
    ]);

    const now = new Date();
    const checkOutDateTimeUTC = new Date(checkOutTime);
    // Get user's timezone from request headers if available, fallback to UTC
    const userTimeZone = req.headers.get('x-timezone') || 'UTC';
    let schedule;
    let program;
    let programTimeZone = 'Africa/Kigali'; // Default timezone

    if (role === 'staff') {
      schedule = STAFF_RULES;
    } else {
      // Validate programId format before conversion
      if (!/^[0-9a-fA-F]{24}$/.test(programId)) {
        return NextResponse.json({ error: "Invalid program selected" }, { status: 400 });
      }

      program = await programs.findOne({
        _id: new ObjectId(programId),
        isActive: true,
      });

        if (!program) {
          console.warn(`[CHECKOUT] Program not found: ${programId}`);
          return NextResponse.json({ error: "The selected program could not be found. Please contact support if this issue persists." }, { status: 404 });
        }
      schedule = program.schedule;
      if (program.timeZone) {
        programTimeZone = program.timeZone;
      }
    }

    // Convert checkout time to the program's timezone for schedule validation
    const checkOutDateTime = toZonedTime(checkOutDateTimeUTC, programTimeZone);

    // Always use the program.schedule for check-out validation.
    // The schedule is validated on program creation and update, so it is always correct.
    // The check-out window is strictly enforced by getAttendanceWindowMessage.
    const windowMessage = getAttendanceWindowMessage('checkout', schedule, checkOutDateTime);
    if (windowMessage) {
      // Show both session and user time for clarity
      const sessionTime = formatTimeWithZone(checkOutDateTime, programTimeZone);
      const userTime = formatTimeWithZone(now, userTimeZone);
      return NextResponse.json({
        error: `Check-out not allowed at this time. ${windowMessage}\nSession time: ${sessionTime}. Your current time: ${userTime}. If you believe this is an error, please contact the Help Desk.`
      }, { status: 400 });
    }

    // Find the matching check-in for today
    const today = new Date(checkOutDateTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Helper to safely create ObjectId
    const toObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id as any;

    const userObjectId = new ObjectId(userId);
    const programObjectId = toObjectId(programId);
    const timeRange = { $gte: today, $lt: tomorrow };

    let checkInRecord = await attendance.findOne({
      userId: userObjectId,
      programId: programObjectId,
      type: { $in: ["checkin", "completed"] },
      checkInTime: timeRange,
    });

    if (!checkInRecord) {
      checkInRecord = await attendance
        .find({
          userId: userObjectId,
          type: { $in: ["checkin", "completed"] },
          $or: [{ checkInTime: timeRange }, { date: timeRange }, { createdAt: timeRange }],
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(1)
        .next();
    }

    if (!checkInRecord) {
      return NextResponse.json({ 
        error: "You must check in before you can check out. Please ensure you have checked in for today's session. If you need help, contact the Help Desk."
      }, { status: 400 });
    }

    // Check if already checked out
    if (checkInRecord.checkOutTime) {
      console.warn(`[CHECKOUT] User ${userId} already checked out today`);
      return NextResponse.json(
        { error: "You have already checked out for today's session. No further action is needed. If you believe this is an error, please contact the Help Desk." },
        { status: 400 }
      );
    }

    // Determine checkout status
    const withinWindow = isWithinCheckOutWindow(schedule, checkOutDateTime);
    const checkOutStatus = withinWindow ? "on-time" : "early";

    // Update the record with check-out data
    const updateResult = await attendance.updateOne(
      { _id: checkInRecord._id },
      {
        $set: {
          checkOutTime: checkOutDateTime,
          checkOutStatus,
          checkOutPhotoUrl: photoUrl,
          checkOutGpsLocation: gpsLocation,
          // Attendance flow already geofence-verifies Igire premises before checkout.
          locationLabel: "Igire Rwanda Organisation premises",
          type: "completed", // Transition from checkin to completed
          updatedAt: now,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update attendance record");
    }

    // Get user info for socket emit
    const user = await users.findOne({ _id: userObjectId });

    // Emit real-time update
    emitAttendanceUpdate(programId, {
      type: "checkout",
      userId,
      programId,
      userName: user?.name || "Unknown",
      programName: program?.name || "Attendance Monitor",
      status: checkOutStatus,
      withinCheckOutWindow: withinWindow,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[CHECKOUT] User ${user?.name} (${userId}) checked out. Status: ${checkOutStatus}`
    );

    return NextResponse.json(
      {
        ok: true,
        status: checkOutStatus,
        message: withinWindow
          ? "Check-out successful. Thank you for attending your session!"
          : `Check-out recorded as early. The official session end time is ${schedule?.end ? new Date(schedule.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}. Please ensure you stay until the end of future sessions.`,
        timestamp: checkOutDateTime.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKOUT] Error:", error);
    return NextResponse.json({ error: "Check-out failed due to a server error. Please try again or contact support." }, { status: 500 });
  }
}