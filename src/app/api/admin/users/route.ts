import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/admin/users
 * List all users with their program assignments
 * Admin only
 */
export async function GET() {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const programs = db.collection("programs");

    // Get all users
    const userList = await users.find({}).toArray();

    // Get all programs for reference
    const programList = await programs.find({ isActive: true }).toArray();
    const programMap = new Map(programList.map(p => [p._id.toString(), p]));

    // Enrich user data with program info
    const enrichedUsers = userList.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      programId: user.programId ? user.programId.toString() : null,
      programName: user.programId ? programMap.get(user.programId.toString())?.name : null,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }));

    console.log(`[ADMIN/USERS] Listed ${enrichedUsers.length} users`);

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("[ADMIN/USERS] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}