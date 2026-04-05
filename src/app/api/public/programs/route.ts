import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/public/programs
 * Fetch active programs for public registration dropdowns
 */
export async function GET() {
  try {
    const db = await getDb();
    const programs = db.collection("programs");

    const programList = await programs
      .find({ isActive: true })
      .project({ _id: 1, name: 1, code: 1 }) // Only return safe, necessary fields
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(programList);
  } catch (error) {
    console.error("[PUBLIC PROGRAMS] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}
