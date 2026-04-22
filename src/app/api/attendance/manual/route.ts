import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { emitAttendanceUpdate } from "@/lib/socket-server";
import { manualAttendanceSchema } from "@/lib/validation";
import { getProgramDateWindowErrorForDate } from "@/lib/program-time";
import { format } from "date-fns";

/**
 * POST /api/attendance/manual
 * Record attendance manually (Staff/Admin only)
 * Used for late participants or other special cases
 * Required: userId, programId, date, checkInStatus, notes (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();

    // Only staff and admin can record manually
    if (!["staff", "admin"].includes(claims.role)) {
      console.warn(
        `[MANUAL_ATTENDANCE] Unauthorized attempt by ${claims.role} user ${claims.userId}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const result = manualAttendanceSchema.safeParse(body);
    if (!result.success) {
      // ZodError exposes .issues for validation reports
      console.warn("[MANUAL_ATTENDANCE] Validation failed:", result.error.issues);
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { userId, programId, date, checkInStatus, checkOutStatus, notes } =
      result.data;

    const db = await getDb();
    const [attendance, users, programs] = await Promise.all([
      db.collection("attendance"),
      db.collection("users"),
      db.collection("programs"),
    ]);

    // Verify user and program exist
    const [user, program] = await Promise.all([
      users.findOne({ _id: new ObjectId(userId), isActive: true }),
      programs.findOne({ _id: new ObjectId(programId), isActive: true }),
    ]);

    if (!user) {
      console.warn(`[MANUAL_ATTENDANCE] User not found: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!program) {
      console.warn(`[MANUAL_ATTENDANCE] Program not found: ${programId}`);
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Normalize date (remove time component)
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(attendanceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Enforce program date range (inclusive) for the selected date.
    const programTimeZone =
      (program as unknown as { timeZone?: string })?.timeZone || "Africa/Kigali";
    const rangeError = getProgramDateWindowErrorForDate(
      attendanceDate,
      program as unknown as { startDate?: Date; endDate?: Date },
      programTimeZone
    );
    if (rangeError) {
      return NextResponse.json({ error: rangeError }, { status: 400 });
    }

    // Strict rule: manual attendance can only be recorded on scheduled program days.
    const workingDays =
      (program as unknown as { schedule?: { days?: string[] } })?.schedule?.days || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];
    const dayName = format(attendanceDate, "EEEE");
    if (!workingDays.includes(dayName)) {
      return NextResponse.json(
        {
          error: `Manual attendance is not allowed on ${dayName} because it is not a scheduled program day.`,
        },
        { status: 400 }
      );
    }

    // Check if record already exists for this date
    const existing = await attendance.findOne({
      userId: new ObjectId(userId),
      programId: new ObjectId(programId),
      date: attendanceDate,
    });

    if (existing) {
      console.warn(
        `[MANUAL_ATTENDANCE] Record already exists for user ${userId} on ${attendanceDate.toDateString()}`
      );
      return NextResponse.json(
        { error: "Attendance already recorded for this date" },
        { status: 409 }
      );
    }

    const recordedBy = new ObjectId(claims.userId);
    const now = new Date();

    // Create manual record
    const insertResult = await attendance.insertOne({
      userId: new ObjectId(userId),
      programId: new ObjectId(programId),
      type: "manual",
      date: attendanceDate,
      checkInStatus,
      checkOutStatus,
      checkInMethod: "MANUAL",
      checkOutMethod: checkOutStatus ? "MANUAL" : undefined,
      manualNotes: notes,
      recordedBy,
      recordedByName: claims.name,
      createdAt: now,
      updatedAt: now,
    });

    // Verify insertion
    const verification = await attendance.findOne({
      _id: insertResult.insertedId,
    });

    if (!verification) {
      throw new Error("Manual attendance record creation failed");
    }

    // Emit real-time update
    emitAttendanceUpdate(programId, {
      type: "checkin",
      userId,
      programId: programId.toString(),
      userName: user.name,
      programName: program.name,
      status: checkInStatus,
      timestamp: now.toISOString(),
    });

    // Emit to HR officer if assigned
    if (program.hrOfficer) {
      const hrOfficer = await users.findOne({ _id: program.hrOfficer });
      if (hrOfficer) {
        emitAttendanceUpdate(programId, {
          type: "checkin",
          userId,
          programId: programId.toString(),
          userName: user.name,
          programName: program.name,
          status: checkInStatus,
          timestamp: now.toISOString(),
        });
      }
    }

    console.log(
      `[MANUAL_ATTENDANCE] Recorded by ${claims.name}: ${user.name} - ${checkInStatus} on ${attendanceDate.toDateString()}`
    );

    return NextResponse.json(
      {
        ok: true,
        attendanceId: insertResult.insertedId,
        record: verification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MANUAL_ATTENDANCE] Error:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/manual?programId=X&from=DATE&to=DATE
 * Get manual attendance records (Staff/Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();

    if (!["staff", "admin"].includes(claims.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!programId) {
      return NextResponse.json(
        { error: "programId required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    const query: Record<string, unknown> = {
      programId: new ObjectId(programId),
      type: "manual",
    };

    if (from || to) {
      query.date = {};
      if (from) query.date = { ...(query.date as Record<string, unknown>), $gte: new Date(from) };
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date = { ...(query.date as Record<string, unknown>), $lte: toDate };
      }
    }

    const records = await attendance
      .find(query)
      .sort({ date: -1 })
      .toArray();

    console.log(
      `[MANUAL_ATTENDANCE] Retrieved ${records.length} records for program ${programId}`
    );

    return NextResponse.json({
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("[MANUAL_ATTENDANCE] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
