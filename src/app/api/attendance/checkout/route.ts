import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, isWithinCheckOutWindow } from "@/lib/attendance-rules";
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
      console.warn("[CHECKOUT] Validation failed:", result.error.issues);
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
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

    // Get program to fetch rules
    const program = await programs.findOne({
      _id: new ObjectId(programId),
      isActive: true,
    });
    if (!program) {
      console.warn(`[CHECKOUT] Program not found: ${programId}`);
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const rules = role === "staff" ? STAFF_RULES : program.schedule;

    // Check if within checkout window
    const withinWindow = isWithinCheckOutWindow(rules, checkOutDateTime);

    // Find today's check-in record
    const today = new Date(checkOutDateTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInRecord = await attendance.findOne({
      userId: new ObjectId(userId),
      programId: new ObjectId(programId),
      type: "checkin",
      checkInTime: { $gte: today, $lt: tomorrow },
    });

    if (!checkInRecord) {
      console.warn(`[CHECKOUT] No check-in found for user ${userId}`);
      return NextResponse.json(
        {
          error: "No check-in found for today. Check out not allowed.",
        },
        { status: 400 }
      );
    }

    // Check if already checked out
    if (checkInRecord.checkOutTime) {
      console.warn(`[CHECKOUT] User ${userId} already checked out today`);
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 400 }
      );
    }

    // Determine checkout status
    const checkOutStatus = withinWindow ? "on-time" : "early";

    // Update attendance record
    const updateResult = await attendance.updateOne(
      { _id: checkInRecord._id },
      {
        $set: {
          checkOutTime: checkOutDateTime.toISOString(),
          checkOutStatus,
          checkOutPhotoUrl: photoUrl,
          checkOutGpsLocation: gpsLocation,
          checkOutMethod: "AUTO",
          updatedAt: now,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to update attendance record");
    }

    // Get user info for socket emit
    const user = await users.findOne({ _id: new ObjectId(userId) });

    // Emit real-time update
    emitAttendanceUpdate(programId, {
      type: "checkout",
      userId,
      userName: user?.name || "Unknown",
      programName: program.name,
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