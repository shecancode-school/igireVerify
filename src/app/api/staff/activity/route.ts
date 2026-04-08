import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/staff/activity
 * Recent attendance activity for staff monitors (all programs or one program).
 */
export async function GET(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const programIdParam = searchParams.get("programId");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100
    );

    const db = await getDb();
    const programsCol = db.collection("programs");
    const attendanceCol = db.collection("attendance");

    let programIds: ObjectId[];
    if (programIdParam && ObjectId.isValid(programIdParam)) {
      const p = await programsCol.findOne({
        _id: new ObjectId(programIdParam),
        isActive: true,
      });
      programIds = p ? [p._id] : [];
    } else {
      const active = await programsCol
        .find({ isActive: true })
        .project({ _id: 1 })
        .toArray();
      programIds = active.map((x) => x._id);
    }

    if (programIds.length === 0) {
      return NextResponse.json({ ok: true, activity: [] });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const records = await attendanceCol
      .find({
        programId: { $in: programIds },
        updatedAt: { $gte: startOfDay },
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    const activity = records.map((r) => {
      const isCheckout = r.type === "completed" && r.checkOutTime;
      return {
        userName: r.userName || "Unknown",
        programName: r.programName || "Program",
        type: isCheckout ? "checkout" : r.type === "checkin" ? "checkin" : r.type,
        status:
          isCheckout
            ? r.checkOutStatus || "on-time"
            : r.checkInStatus || r.status || "on-time",
        time: (r.updatedAt || r.createdAt) instanceof Date
          ? (r.updatedAt || r.createdAt).toISOString()
          : new Date().toISOString(),
      };
    });

    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    console.error("[STAFF/ACTIVITY] Error:", error);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 }
    );
  }
}
