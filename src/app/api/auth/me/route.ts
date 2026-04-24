import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";


export async function GET() {
  try {
    const claims = await getAuthClaimsFromCookies();

    if (!claims) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ email: claims.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let programName = "N/A";
    let programId = user.programId?.toString() || "";

    if (user.role === "staff") {
      if (user.programId) {
        const programs = db.collection("programs");
        const programObj = await programs.findOne({ _id: user.programId });
        programName = programObj?.name || "Assigned program";
        programId = user.programId.toString();
      } else {
        programName = "Staff — ask Admin to assign a program";
        programId = "staff-mon";
      }
    } else if (user.role === 'admin') {
      programName = 'System Administrator';
      programId = 'admin-sys';
    } else if (user.programId) {
      const programs = db.collection("programs");
      const programObj = await programs.findOne({ _id: user.programId });
      if (programObj) {
        programName = programObj.name;
      } else {
        programName = user.programId.toString();
      }
    }

    let checkInWindow = "N/A";
    if (user.programId && ObjectId.isValid(String(user.programId))) {
      const programDoc = await db
        .collection("programs")
        .findOne({ _id: user.programId as ObjectId });
      if (programDoc?.schedule) {
        checkInWindow = `${programDoc.schedule.checkInStart} - ${programDoc.schedule.checkInEnd} and Check-out ${programDoc.schedule.checkOutStart || "16:00"} - ${programDoc.schedule.checkOutEnd || "17:30"}`;
      }
    } else if (user.role === "staff" && programId === "staff-mon") {
      checkInWindow = "Staff default window";
    }

    return NextResponse.json({
      userName: user.name,
      programName,
      programId,
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl || null,
      checkInWindow,
    });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
  }
}