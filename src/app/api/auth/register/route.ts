// src/app/api/auth/register/route.ts
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword, role, programId } = body;

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    if (password.length < 12) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await users.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || "participant",
      programId: role === "participant" ? programId : null,
      createdAt: new Date(),
    });

    console.log(`Registration successful for ${email}`);
    return NextResponse.json({ ok: true, message: "Account created" }, { status: 201 });

  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}