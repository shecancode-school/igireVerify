import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createAdminSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
    if (!ADMIN_SECRET_KEY) {
      console.error("[SECURITY] ADMIN_SECRET_KEY not configured in .env.local");
      return NextResponse.json(
        { error: "Admin creation not configured on this server" },
        { status: 500 }
      );
    }

    if (body.adminSecret !== ADMIN_SECRET_KEY) {
      console.warn(`[SECURITY] Invalid admin secret attempt from unknown source`);
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 403 }
      );
    }
    const validated = createAdminSchema.safeParse(body);
    if (!validated.success) {
      console.warn(
        `[VALIDATION] Admin creation failed: ${JSON.stringify(validated.error.issues)}`
      );
      return NextResponse.json(
        {
          
          error: "Validation failed",
          issues: validated.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    const db = await getDb();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.warn(`[SECURITY] Admin creation blocked: email already exists (${email})`);
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    if (!passwordHash.startsWith("$2a$") && !passwordHash.startsWith("$2b$")) {
      console.error("[SECURITY] Hash format validation failed during admin creation");
      return NextResponse.json(
        { error: "Password hashing failed" },
        { status: 500 }
      );
    }

    console.log(
      `[OPERATION] Creating admin account: Email: ${email}, Hash: ${passwordHash.substring(0, 10)}...`
    );

    const result = await users.insertOne({
      name,
      email,
      passwordHash,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    });
    const verification = await users.findOne({ _id: result.insertedId });
    if (!verification) {
      console.error(
        "[SECURITY] Admin document insertion failed - data not persisted"
      );
      return NextResponse.json(
        { error: "Failed to create admin account - database error" },
        { status: 500 }
      );
    }

    console.info(`[OPERATION] Admin account created successfully: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: {
          _id: result.insertedId.toString(),
          name,
          email,
          role: "admin",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERROR] Admin creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


