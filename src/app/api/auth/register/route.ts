// src/app/api/auth/register/route.ts
import bcrypt from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { registerSchema } from "@/lib/validation";
import {
  buildVerifyUrl,
  createEmailVerificationToken,
  sendWelcomeVerificationEmail,
} from "@/lib/email";

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
      const first = result.error.flatten().fieldErrors;
      const msg =
        first.email?.[0] ||
        first.programId?.[0] ||
        first.password?.[0] ||
        first.confirmPassword?.[0] ||
        first.name?.[0] ||
        "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, email, password, programId, position } = result.data;
    const role = "participant"; // STRICT RULE: All new public registrations are participants


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
        
        // Final check: Does this program exist?
        const programs = db.collection("programs");
        const programExists = await programs.findOne({ _id: resolvedProgramId, isActive: true });
        
        if (!programExists) {
          return NextResponse.json(
            { error: "Selected program no longer exists or is inactive" },
            { status: 400 }
          );
        }
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
          // STRICT RULE: No fallback to string. Must exist in DB.
          return NextResponse.json(
            { error: "Selected program is invalid" },
            { status: 400 }
          );
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

    const verification = createEmailVerificationToken();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create user document with all required fields
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
      emailVerified: false,
      emailVerificationToken: verification.hashed,
      emailVerificationExpiresAt: verificationExpiry,
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
    const inserted = await users.findOne({ _id: insertResult.insertedId });
    if (!inserted) {
      console.error("[REGISTER] Data not persisted after insertion");
      throw new Error("User creation failed - data not persisted");
    }

    // Send verification email; rollback created account when delivery fails.
    try {
      const verifyUrl = buildVerifyUrl(verification.raw);
      await sendWelcomeVerificationEmail({
        to: normalizedEmail,
        name: name.trim(),
        verifyUrl,
      });
    } catch (emailError) {
      await users.deleteOne({ _id: insertResult.insertedId });
      console.error("[REGISTER] Verification email failed:", emailError);
      return NextResponse.json(
        {
          error:
            "Could not send verification email. Please confirm SMTP settings and try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "Account created successfully. Please check your email to verify your account before login.",
        userId: insertResult.insertedId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REGISTER] Error:", err);
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}