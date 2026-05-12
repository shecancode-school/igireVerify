import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { STAFF_RULES, isWindowOpenNow } from "@/lib/attendance-rules";


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

    const isStaffRole = ["admin", "super-admin", "manager", "facilitator", "academic", "communication"].includes(user.role);

    if (isStaffRole && user.role !== "admin" && user.role !== "super-admin") {
      if (user.assignedPrograms && user.assignedPrograms.length > 0) {
        const programs = db.collection("programs");
        const prog = await programs.findOne({ _id: user.assignedPrograms[0] });
        programName = prog ? `${prog.name}${user.assignedPrograms.length > 1 ? " (+)" : ""}` : "Assigned programs";
        programId = user.assignedPrograms[0].toString();
      } else {
        programName = "Staff — No programs assigned";
        programId = "staff-unassigned";
      }
    } else if (user.role === 'admin' || user.role === 'super-admin') {
      programName = user.role === 'super-admin' ? 'Chief Executive Officer' : 'System Administrator';
      programId = user.role === 'super-admin' ? 'ceo-global' : 'admin-sys';
    } else if (user.programId) {
      const programs = db.collection("programs");
      const programObj = await programs.findOne({ _id: user.programId });
      programName = programObj?.name || user.programId.toString();
    }

    let checkInWindow = "N/A";
    const programIdStr = user.programId?.toString() || programId;
    
    if (programIdStr && ObjectId.isValid(programIdStr) && !["staff-unassigned", "ceo-global", "admin-sys"].includes(programIdStr)) {
      const programDoc = await db
        .collection("programs")
        .findOne({ _id: new ObjectId(programIdStr) });
        
      if (programDoc?.schedule) {
        const s = programDoc.schedule;
        checkInWindow = `${s.checkInStart} - ${s.checkInEnd} (Late after ${s.lateAfter || s.checkInEnd})`;
        if (s.checkOutStart) {
          checkInWindow += ` | Check-out: ${s.checkOutStart} - ${s.checkOutEnd || "17:30"}`;
        }
      }
    } else if (isStaffRole) {
      checkInWindow = `${STAFF_RULES.checkInStart} - ${STAFF_RULES.checkInEnd} (Staff Default)`;
    }

    // Calculate window open/closed status
    let programRules = isStaffRole ? STAFF_RULES : null;
    let tz = 'Africa/Kigali';

    if (programIdStr && ObjectId.isValid(programIdStr) && !["staff-unassigned", "ceo-global", "admin-sys"].includes(programIdStr)) {
      const programDoc = await db.collection("programs").findOne({ _id: new ObjectId(programIdStr) });
      if (programDoc) {
        programRules = programDoc.schedule;
        if (programDoc.timeZone) tz = programDoc.timeZone;
      }
    }

    const checkInStatus = isWindowOpenNow('checkin', programRules, tz);
    const checkOutStatus = isWindowOpenNow('checkout', programRules, tz);

    return NextResponse.json({
      userName: user.name,
      programName,
      programId,
      userId: user._id.toString(),
      role: user.role,
      position: user.position,
      assignedPrograms: (user.assignedPrograms || []).map((id: any) => id.toString()),
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl || null,
      checkInWindow,
      isCheckInOpen: checkInStatus.isOpen,
      checkInMessage: checkInStatus.message,
      isCheckOutOpen: checkOutStatus.isOpen,
      checkOutMessage: checkOutStatus.message,
      isFaceRegistered: user.isFaceRegistered || false,
      faceDescriptor: user.faceDescriptor || null,
    });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
  }
}