import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  createEmailVerificationToken,
  sendPasswordResetEmail,
  buildResetUrl,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ email });

    // For security, don't reveal if account exists
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    // Reuse the verification token logic for generating a secure token
    const tokenData = createEmailVerificationToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: tokenData.hashed,
          resetPasswordExpiresAt: expiry,
          updatedAt: new Date(),
        },
      }
    );

    const resetUrl = buildResetUrl(tokenData.raw);
    await sendPasswordResetEmail({
      to: email,
      name: user.name || "User",
      resetUrl,
    });

    return NextResponse.json({
      ok: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD] Error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
