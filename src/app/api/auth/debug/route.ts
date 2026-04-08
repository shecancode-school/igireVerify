import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const plainPassword = searchParams.get("password");

  if (!email || !plainPassword) {
    return NextResponse.json(
      { 
        error: "Missing email or password query params",
        example: "/api/auth/debug?email=test@example.com&password=TestPass1218!"
      },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const normalizedEmail = email.toLowerCase().trim();
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        {
          status: "NOT_FOUND",
          message: "User does not exist in database",
          searchedEmail: normalizedEmail,
          diagnosis: "User was never saved during registration. Check registration logs and MongoDB.",
          nextStep: "Try registering again and check server console for [REGISTER] logs"
        },
        { status: 404 }
      );
    }

    const isValidBcryptHash = 
      user.passwordHash && 
      (user.passwordHash.startsWith('$2a$') || 
       user.passwordHash.startsWith('$2b$') || 
       user.passwordHash.startsWith('$2y$'));


    let passwordMatches = false;
    let compareError = null;
    try {
      passwordMatches = await bcrypt.compare(plainPassword, user.passwordHash);
    } catch (e) {
      compareError = String(e);
    }

    const diagnosis = !isValidBcryptHash
      ? "CRITICAL: Stored hash is NOT a valid bcrypt hash. Password is likely stored as plain text or corrupted."
      : passwordMatches
      ? "Password is correct. Login should work."
      : "WARNING: Password does not match stored hash. Either wrong password or hash is corrupted.";

    const response = {
      status: "FOUND",
      userInDB: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        programId: user.programId || null,
        position: user.position || null,
        createdAt: user.createdAt,
        passwordHashStored: user.passwordHash,
        passwordHashValidBcrypt: isValidBcryptHash,
        passwordHashLength: user.passwordHash?.length || 0,
      },
      loginTest: {
        plainPasswordProvided: plainPassword,
        plainPasswordLength: plainPassword.length,
        passwordHashMatch: passwordMatches,
        bcryptCompareResult: passwordMatches ? "MATCH" : "NO MATCH",
        compareError: compareError,
      },
      diagnosis,
      recommendations: isValidBcryptHash && !passwordMatches
        ? [
            "1. You provided wrong password - try the password you used during registration",
            "2. Different password was used in registration - check your registration form submission",
            "3. Character encoding issue - special characters might be handled differently"
          ]
        : !isValidBcryptHash
        ? [
            "1. Re-register with a new email/password",
            "2. Check /api/auth/register logs during registration",
            "3. Verify bcryptjs is installed correctly: npm ls bcryptjs"
          ]
        : [
            "Login should work. Try clearing cookies and retrying login.",
            "Check that JWT_SECRET env var is set correctly."
          ]
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Debug check failed", 
        details: String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}
