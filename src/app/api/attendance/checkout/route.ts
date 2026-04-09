import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, getAttendanceWindowMessage, isWithinCheckOutWindow } from "@/lib/attendance-rules";
import { emitAttendanceUpdate } from "@/lib/socket-server";
import { checkOutSchema } from "@/lib/validation";

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
        { error: "Missing required information. Please ensure all steps are completed." },
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
    const checkOutDateTime = new Date(checkOutTime);
    let schedule;
    let program;

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
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
      schedule = program.schedule;
    }

    // Validate attendance window and day
    const windowMessage = getAttendanceWindowMessage('checkout', schedule, checkOutDateTime);
    if (windowMessage) {
      return NextResponse.json({ error: windowMessage }, { status: 400 });
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
        error: "You must complete your check-in first before you can check out. Please ensure you have checked in for today's session." 
      }, { status: 400 });
    }

    // Check if already checked out
    if (checkInRecord.checkOutTime) {
      console.warn(`[CHECKOUT] User ${userId} already checked out today`);
      return NextResponse.json(
        { error: "You have already completed your check-out for today. No further action is needed." },
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
        message: withinWindow ? "Check-out recorded" : "Check-out recorded (early)",
        timestamp: checkOutDateTime.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CHECKOUT] Error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}