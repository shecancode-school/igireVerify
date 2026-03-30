// src/app/api/auth/login/route.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env.local");
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || "");

    if (!isMatch) {
      console.log(`Password mismatch for ${email}`);
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT payload
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      position: user.position || null,
    };

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    const redirectTo = user.role === "staff" 
      ? (user.position === "HR" ? "/dashboard/hr" : "/dashboard/staff")
      : "/dashboard/participant";

    console.log(`Login successful for ${email} -> ${redirectTo}`);

    const response = NextResponse.json({
      ok: true,
      redirectTo,
    });

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
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}