import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { loginSchema } from "@/lib/validation";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env.local");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    
    const normalizedEmail = email.toLowerCase().trim();

    const db = await getDb();
    const users = db.collection("users");


    const user = await users.findOne({
      email: normalizedEmail,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerified && user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Please check your email and click the verification link to activate your account.",
          needsEmailVerification: true,
        },
        { status: 403 }
      );
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil.getTime() - new Date().getTime()) / 60000);
      return NextResponse.json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes.` 
      }, { status: 429 });
    }


    const isMatch = await bcrypt.compare(password, user.passwordHash || "");

    if (!isMatch) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      let updateDoc: any = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updateDoc.lockUntil = new Date(Date.now() + 15 * 60 * 1000); 
      }

      await users.updateOne({ _id: user._id }, { $set: updateDoc });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

  
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { lastLogin: new Date() },
        $unset: { failedLoginAttempts: "", lockUntil: "" }
      }
    );

    
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      position: user.position || null,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });

  
    const isIgireEmail = normalizedEmail.endsWith("@igirerwanda.org");
    
    const redirectTo =
      user.role === "admin"
        ? "/dashboard/admin"
        : (user.role === "staff" || isIgireEmail)
          ? "/dashboard/staff"
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


    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, 
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}