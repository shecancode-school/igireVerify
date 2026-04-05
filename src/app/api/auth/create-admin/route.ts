import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createAdminSchema } from "@/lib/validation";

/**
 * POST /api/auth/create-admin
 * 
 * ⚠️ SUPER ADMIN ONLY - Creates an admin user
 * This endpoint REQUIRES the ADMIN_SECRET_KEY from environment variables
 * 
 * Only use this for initial admin creation or adding trusted administrators.
 * 
 * Request body:
 * {
 *   "name": "Admin Name",
 *   "email": "admin@example.com",
 *   "password": "SecurePass123!@",
 *   "confirmPassword": "SecurePass123!@",
 *   "adminSecret": "your-admin-secret-key-from-.env.local"
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Check 1: Verify admin secret
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

    // ✅ Check 2: Validate input format
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

    // ✅ Check 3: Connect to database
    const db = await getDb();
    const users = db.collection("users");

    // ✅ Check 4: Verify email is not already in use
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.warn(`[SECURITY] Admin creation blocked: email already exists (${email})`);
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // ✅ Check 5: Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Validate hash format before storing
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

    // ✅ Check 6: Create admin user document
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

    // ✅ Check 7: Verify admin was actually stored in database
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

    // Return success response (without sensitive data)
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

/**
 * Security Notes:
 * 
 * 1. ADMIN_SECRET_KEY must be:
 *    - At least 32 characters long
 *    - Random and strong (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
 *    - Stored ONLY in .env.local (never commit to Git)
 *    - Different per environment (dev, staging, production)
 * 
 * 2. Only developers should know ADMIN_SECRET_KEY
 * 
 * 3. Use curl to create admin:
 *    curl -X POST http://localhost:3000/api/auth/create-admin \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "name": "Your Name",
 *        "email": "your@example.com",
 *        "password": "SecurePass123!@",
 *        "confirmPassword": "SecurePass123!@",
 *        "adminSecret": "your-secret-key-from-.env.local"
 *      }'
 * 
 * 4. After creating, login normally at /login
 * 
 * 5. Delete this endpoint after creating the first admin (optional but recommended)
 */
