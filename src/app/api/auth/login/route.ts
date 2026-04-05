// src/app/api/auth/login/route.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validation";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env.local");
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Normalize email for lookup
    const normalizedEmail = email.toLowerCase().trim();

    const db = await getDb();
    const users = db.collection("users");

    // Find user by normalized email; treat missing isActive as active (backward compatibility)
    const user = await users.findOne({
      email: normalizedEmail,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check for lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil.getTime() - new Date().getTime()) / 60000);
      return NextResponse.json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes.` 
      }, { status: 429 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash || "");

    if (!isMatch) {
      // Increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let updateDoc: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updateDoc.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }

      await users.updateOne({ _id: user._id }, { $set: updateDoc });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Reset lockout and update last login
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { lastLogin: new Date() },
        $unset: { failedLoginAttempts: "", lockUntil: "" }
      }
    );

    // Create JWT payload
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      position: user.position || null,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });

    // Determine redirect URL based on role
    const redirectTo =
      user.role === "admin"
        ? "/dashboard/admin"
        : user.role === "staff"
          ? user.position === "HR"
            ? "/dashboard/hr"
            : "/dashboard/staff"
          : "/dashboard/participant";

    const response = NextResponse.json(
      {
        ok: true,
        redirectTo,
        user: {
          userId: user._id.toString(),
          role: user.role,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Set JWT cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}