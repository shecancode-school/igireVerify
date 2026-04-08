import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * PUT /api/admin/users/[id]
 * Update user program assignment
 * Admin only
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;

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

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (programId === null || programId === "") {
      updateData.programId = null;
    } else if (programId) {
      updateData.programId = new ObjectId(programId);
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[ADMIN/USERS/ID] Updated user ${userId} program assignment`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN/USERS/ID] PUT error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user
 * Admin only
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();
    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;

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

    console.log(`[ADMIN/USERS/ID] Deleted user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN/USERS/ID] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
