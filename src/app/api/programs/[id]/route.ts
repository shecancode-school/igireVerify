import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/programs/[id]
 * Get program details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();
    const { id } = await params;
    console.log(`[PROGRAMS/:id] ${claims.role} ${claims.userId} is viewing program ${id}`);
    const programId = id;

    // Validate ObjectId format
    if (!ObjectId.isValid(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    const db = await getDb();
    const programs = db.collection("programs");

    const program = await programs.findOne({
      _id: new ObjectId(programId),
      isActive: true,
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("[PROGRAMS] GET/:id error:", error);
    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}

/**
 * PUT /api/programs/[id]
 * Update program (Admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();

    if (claims.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: programId } = await params;
    if (!ObjectId.isValid(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, code, description, startDate, endDate, schedule, facilitators, hrOfficer, isActive } = body;

    const db = await getDb();
    const programs = db.collection("programs");

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (code) updateData.code = code.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (schedule) updateData.schedule = schedule;
    if (facilitators)
      updateData.facilitators = facilitators.map((id: string) => new ObjectId(id));
    if (hrOfficer !== undefined) updateData.hrOfficer = hrOfficer ? new ObjectId(hrOfficer) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await programs.updateOne(
      { _id: new ObjectId(programId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    console.log(`[PROGRAMS] Updated program ${programId}`);

    const updated = await programs.findOne({ _id: new ObjectId(programId) });
    return NextResponse.json({ ok: true, program: updated });
  } catch (error) {
    console.error("[PROGRAMS] PUT error:", error);
    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}

/**
 * DELETE /api/programs/[id]
 * Permanent delete program (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();

    // Only admin can delete programs
    if (claims.role !== "admin") {
      console.warn(`[PROGRAMS] Unauthorized program deletion attempt by ${claims.role} user ${claims.userId}`);
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const { id: programId } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    const db = await getDb();
    const programs = db.collection("programs");

    // Permanent delete
    const result = await programs.deleteOne({
      _id: new ObjectId(programId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    console.log(`[PROGRAMS] Permanently deleted program ${programId} by admin ${claims.userId}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PROGRAMS] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete program" }, { status: 500 });
  }
}
