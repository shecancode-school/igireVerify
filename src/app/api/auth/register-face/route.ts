import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * POST /api/auth/register-face
 * Body: { descriptor: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();
    const body = await req.json();
    const { descriptor } = body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json({ error: "Invalid face descriptor" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(claims.userId) },
      { 
        $set: { 
          faceDescriptor: descriptor,
          isFaceRegistered: true,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Face registered successfully" });
  } catch (error) {
    console.error("[REGISTER-FACE] Error:", error);
    return NextResponse.json({ error: "Failed to register face" }, { status: 500 });
  }
}
