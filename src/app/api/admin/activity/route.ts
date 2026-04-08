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
    const users = db.collection("users");

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const records = await attendance
      .find({ createdAt: { $gte: startOfDay } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const userIds = records.map(r => r.userId);
    const userDocs = await users.find({ _id: { $in: userIds } }).toArray();
    const userMap = new Map(userDocs.map(u => [u._id.toString(), u.name]));

    const activity = records.map(record => ({
      id: record._id,
      userName: userMap.get(record.userId.toString()) || "Unknown",
      type: record.type,
      status: record.status,
      programName: record.programName,
      time: record.createdAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    console.error("[ADMIN/ACTIVITY] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}