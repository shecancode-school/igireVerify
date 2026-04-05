// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getAuthClaimsFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

const PROGRAM_NAMES: Record<string, string> = {
  'web-fundamentals': 'Web Fundamentals',
  'advanced-frontend': 'Advanced Frontend',
  'advanced-backend': 'Advanced Backend'
};

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

    const programName = user.programId ? PROGRAM_NAMES[user.programId] || user.programId : 'Web Fundamentals';

    return NextResponse.json({
      userName: user.name,
      programName,
      programId: user.programId || 'web-fundamentals',
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      profilePhotoUrl: user.profilePhotoUrl || null
    });

  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
  }
}