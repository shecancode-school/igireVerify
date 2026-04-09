import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashEmailVerificationToken } from "@/lib/email";

async function verifyByToken(token: string) {
  const db = await getDb();
  const users = db.collection("users");
  const hashed = hashEmailVerificationToken(token);

  const user = await users.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpiresAt: { $gt: new Date() },
    emailVerified: false,
  });

  if (!user) {
    return NextResponse.json(
      { error: "Verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerified: true,
        updatedAt: new Date(),
      },
      $unset: {
        emailVerificationToken: "",
        emailVerificationExpiresAt: "",
      },
    }
  );

  return NextResponse.json({
    ok: true,
    message: "Email verified successfully. You can now sign in.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token" },
        { status: 400 }
      );
    }
    return verifyByToken(token);
  } catch (error) {
    console.error("[VERIFY_EMAIL] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}

// Backward compatibility for old verification links with query tokens.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing verification token" },
        { status: 400 }
      );
    }
    return verifyByToken(token);
  } catch (error) {
    console.error("[VERIFY_EMAIL] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
