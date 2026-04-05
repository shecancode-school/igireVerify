import { NextResponse, NextRequest } from "next/server";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * PUT /api/users/profile
 * Update user profile (name and profile photo)
 * Only authenticated users can update their own profile
 */
export async function PUT(req: NextRequest) {
  try {
    const claims = await getAuthClaimsFromCookies();

    if (!claims) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, profilePhotoUrl } = body;

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }

    if (profilePhotoUrl && (typeof profilePhotoUrl !== "string" || (!profilePhotoUrl.startsWith("http") && !profilePhotoUrl.startsWith("data:image/")))) {
      return NextResponse.json({ error: "Invalid profile photo URL" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    // Update user profile
    const updateData: {
      name: string;
      updatedAt: Date;
      profilePhotoUrl?: string;
    } = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    if (profilePhotoUrl) {
      updateData.profilePhotoUrl = profilePhotoUrl;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(claims.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch updated user data
    const updatedUser = await users.findOne({ _id: new ObjectId(claims.userId) });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      user: {
        name: updatedUser?.name,
        email: updatedUser?.email,
        profilePhotoUrl: updatedUser?.profilePhotoUrl,
        programId: updatedUser?.programId,
        role: updatedUser?.role,
      },
    });
  } catch (error) {
    console.error("[PROFILE_UPDATE] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}