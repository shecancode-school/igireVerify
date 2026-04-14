import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  buildVerifyUrl,
  createEmailVerificationToken,
  sendWelcomeVerificationEmail,
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

    // Avoid account enumeration by returning success shape for unknown emails.
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Please sign in." },
        { status: 400 }
      );
    }

    const verification = createEmailVerificationToken();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: verification.hashed,
          emailVerificationExpiresAt: verificationExpiry,
          updatedAt: new Date(),
        },
      }
    );

    const verifyUrl = buildVerifyUrl(verification.raw);
    await sendWelcomeVerificationEmail({
      to: email,
      name: user.name || "User",
      verifyUrl,
    });

    return NextResponse.json({
      ok: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("[RESEND_VERIFICATION] Error:", error);
    return NextResponse.json(
      { error: "Could not resend verification email right now. Please try again." },
      { status: 500 }
    );
  }
}
