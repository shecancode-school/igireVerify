import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";
import { createProgramSchema } from "@/lib/validation";

/**
 * GET /api/programs
 * List all active programs
 * Accessible by: Admin, Staff, HR, Participants
 */
export async function GET() {
  try {
    const claims = await requireAuthOrRedirect();

    const db = await getDb();
    const programs = db.collection("programs");

    const programList = await programs
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`[PROGRAMS] Listed ${programList.length} programs for ${claims.role}`);

    return NextResponse.json(programList);
  } catch (error) {
    console.error("[PROGRAMS] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

/**
 * POST /api/programs
 * Create a new program (Admin only)
 * Required fields: name, code, schedule, startDate, endDate
 */
export async function POST(req: NextRequest) {
  try {
    const claims = await requireAuthOrRedirect();

    // Only admin can create programs
    if (claims.role !== "admin") {
      console.warn(`[PROGRAMS] Unauthorized program creation attempt by ${claims.role} user ${claims.userId}`);
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const result = createProgramSchema.safeParse(body);
    if (!result.success) {
      console.warn(`[PROGRAMS] Validation failed:`, result.error.issues);
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const { name, code, description, startDate, endDate, schedule, facilitators, hrOfficer } =
      result.data;

    const db = await getDb();
    const programs = db.collection("programs");

    // Check unique code
    const existing = await programs.findOne({ code: code.toLowerCase() });
    if (existing) {
      console.warn(`[PROGRAMS] Duplicate program code: ${code}`);
      return NextResponse.json({ error: "Program code already exists" }, { status: 409 });
    }

    const insertResult = await programs.insertOne({
      name,
      code: code.toLowerCase(),
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      schedule,
      facilitators: facilitators?.map((id: string) => new ObjectId(id)) || [],
      hrOfficer: hrOfficer ? new ObjectId(hrOfficer) : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify insertion
    const verification = await programs.findOne({ _id: insertResult.insertedId });
    if (!verification) {
      throw new Error("Program creation failed - data not persisted");
    }

    console.log(`[PROGRAMS] Created new program: ${name} (ID: ${insertResult.insertedId})`);

    return NextResponse.json(
      {
        ok: true,
        programId: insertResult.insertedId,
        program: verification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PROGRAMS] POST error:", error);
    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
