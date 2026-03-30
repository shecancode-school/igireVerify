// src/app/api/attendance/checkout/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, programName, checkOutTime, gpsInfo, photoUrl } = body;

    if (!userName || !programName || !photoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    const record = {
      userName,
      programName,
      type: "checkout",
      checkOutTime: checkOutTime || new Date().toISOString(),
      gpsInfo: gpsInfo || "GPS recorded",
      photoUrl,
      createdAt: new Date(),
    };

    const result = await attendance.insertOne(record);

    console.log(` Check-out saved to MongoDB. ID: ${result.insertedId}`);

    return NextResponse.json({
      ok: true,
      message: "Check-out recorded successfully",
    });

  } catch (error) {
    console.error("Check-out save error:", error);
    return NextResponse.json({ error: "Failed to save check-out" }, { status: 500 });
  }
}