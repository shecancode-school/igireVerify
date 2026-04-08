import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/staff/program-roster?programId=&date=YYYY-MM-DD
 * Read-only roster: participants and that day's check-in / check-out status.
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const programIdStr = searchParams.get("programId");
    const dateStr = searchParams.get("date");

    if (!programIdStr || !ObjectId.isValid(programIdStr)) {
      return NextResponse.json({ error: "Valid programId is required" }, { status: 400 });
    }

    const day = dateStr ? new Date(dateStr) : new Date();
    if (Number.isNaN(day.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const db = await getDb();
    const programsCol = db.collection("programs");
    const usersCol = db.collection("users");
    const attendanceCol = db.collection("attendance");

    const program = await programsCol.findOne({
      _id: new ObjectId(programIdStr),
      isActive: true,
    });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const participants = await usersCol
      .find({
        role: "participant",
        programId: new ObjectId(programIdStr),
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      })
      .sort({ name: 1 })
      .toArray();

    const records = await attendanceCol
      .find({
        programId: new ObjectId(programIdStr),
        date: { $gte: day, $lt: next },
      })
      .toArray();

    const sameUser = (r: unknown, userId: ObjectId) => {
      const row = r as { userId?: unknown };
      const uid = userId.toString();
      const rid = row.userId;
      if (rid == null) return false;
      if (typeof rid === "string") return rid === uid;
      if (typeof rid === "object" && rid !== null && "toString" in rid) {
        return (rid as ObjectId).toString() === uid;
      }
      return false;
    };

    const roster = participants.map((u) => {
      const rec = records.find((r) => sameUser(r, u._id));
      let status: "not-checked-in" | "checked-in" | "checked-out" = "not-checked-in";
      let checkIn = "—";
      let checkOut = "—";

      if (rec) {
        if (rec.checkInTime) {
          checkIn = new Date(rec.checkInTime as string).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
        if (rec.checkOutTime) {
          checkOut = new Date(rec.checkOutTime as string).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          status = "checked-out";
        } else {
          status = "checked-in";
        }
      }

      return {
        userId: u._id.toString(),
        name: u.name as string,
        email: u.email as string,
        checkIn,
        checkOut,
        status,
        attendanceStatus:
          (rec?.checkInStatus as string) || (rec?.status as string) || "—",
      };
    });

    return NextResponse.json({
      program: { _id: program._id.toString(), name: program.name as string },
      date: day.toISOString().slice(0, 10),
      roster,
    });
  } catch (error) {
    console.error("[STAFF/ROSTER] Error:", error);
    return NextResponse.json(
      { error: "Failed to load roster" },
      { status: 500 }
    );
  }
}
