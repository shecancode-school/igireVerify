import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
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
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      programId: user.programId,
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

/**
 * PUT /api/admin/users/[id]
 * Update user program assignment
 * Admin only
 */
export async function PUT(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { programId } = body;

    const db = await getDb();
    const users = db.collection("users");

    // Validate program exists if provided
    if (programId) {
      const programs = db.collection("programs");
      const program = await programs.findOne({
        _id: new ObjectId(programId),
        isActive: true
      });
      if (!program) {
        return NextResponse.json({ error: "Program not found" }, { status: 400 });
      }
    }

    const updateData: {
      programId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (programId === null) {
      updateData.programId = null;
    } else if (programId) {
      updateData.programId = programId;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[ADMIN/USERS] Updated user ${userId} program assignment`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN/USERS] PUT error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 * Admin only
 */
export async function DELETE(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const userId = url.pathname.split('/').pop();

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === claims.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    const result = await users.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[ADMIN/USERS] Deleted user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN/USERS] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}