// src/app/api/auth/register/route.ts
import bcrypt from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { registerSchema } from "@/lib/validation";

/**
 * POST /api/auth/register
 * Register a new user (participant or staff)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input using Zod schema
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed"},
        { status: 400 }
      );
    }

    const { name, email, password, role, programId, position } = result.data;

    // Normalize email for consistent storage and comparison
    const normalizedEmail = email.toLowerCase().trim();

    const db = await getDb();
    const users = db.collection("users");

    // Check if email already exists (case-insensitive)
    const existing = await users.findOne({
      email: normalizedEmail,
    });

    let resolvedProgramId = null;
    if (role === "participant" && programId) {
      const programLookupValue = programId.toString().trim();

      if (/^[0-9a-fA-F]{24}$/.test(programLookupValue)) {
        // Valid ObjectId format
        resolvedProgramId = new ObjectId(programLookupValue);
      } else {
        // Try to find program by code or name in database
        const programs = db.collection("programs");
        const program = await programs.findOne({
          isActive: true,
          $or: [
            { code: programLookupValue.toLowerCase() },
            { name: { $regex: `^${programLookupValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
          ],
        });

        if (program) {
          resolvedProgramId = program._id;
        } else {
          // If program not found in DB, store code as-is
          // This allows registration to proceed even if programs aren't seeded
          console.warn(`[REGISTER] Program "${programId}" not found in DB, storing as string`);
          resolvedProgramId = programLookupValue;
        }
      }
    }

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Validate hash format before storing
    if (!passwordHash.startsWith("$2") && !passwordHash.startsWith("$2a$") && !passwordHash.startsWith("$2b$")) {
      console.error("[REGISTER] Invalid bcrypt hash format generated");
      throw new Error("Password hashing failed");
    }

    const now = new Date();

    // Create user document with all required fields
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLogin: undefined,

      // Participant fields
      ...(role === "participant" && {
        programId: resolvedProgramId,
        enrollmentDate: now,
      }),

      // Staff fields
      ...(role === "staff" && {
        position,
        assignedPrograms: [],
      }),
    };

    const insertResult = await users.insertOne(userData);

    // Verify insertion
    const verification = await users.findOne({ _id: insertResult.insertedId });
    if (!verification) {
      console.error("[REGISTER] Data not persisted after insertion");
      throw new Error("User creation failed - data not persisted");
    }

    return NextResponse.json(
      { ok: true, message: "Account created successfully", userId: insertResult.insertedId },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER] Error:", err);
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}