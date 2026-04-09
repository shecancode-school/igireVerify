import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

export async function GET() {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    // Get last 7 days attendance data
    const now = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [present, late] = await Promise.all([
        attendance.countDocuments({
          type: { $in: ["checkin", "completed"] },
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          checkInStatus: "on-time",
        }),
        attendance.countDocuments({
          type: { $in: ["checkin", "completed"] },
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          checkInStatus: "late",
        }),
      ]);

      data.push({
        date: date.toLocaleDateString(),
        present,
        late,
        total: present + late,
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[ADMIN/CHART] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}