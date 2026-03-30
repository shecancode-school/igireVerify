// src/app/api/attendance/checkin/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, programName, checkInTime, gpsInfo, photoUrl } = body;

    if (!userName || !programName || !photoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getDb();
    const attendance = db.collection("attendance");

    const record = {
      userName,
      programName,
      type: "checkin",
      checkInTime: checkInTime || new Date().toISOString(),
      gpsInfo: gpsInfo || "GPS recorded",
      photoUrl,
      createdAt: new Date(),
    };

    const result = await attendance.insertOne(record);

    console.log(`Check-in saved to MongoDB. ID: ${result.insertedId}`);

    return NextResponse.json({
      ok: true,
      message: "Check-in recorded successfully",
    });

  } catch (error) {
    console.error("Check-in save error:", error);
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 });
  }
}