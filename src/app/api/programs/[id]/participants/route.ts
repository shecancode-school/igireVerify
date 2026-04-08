import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireAuthOrRedirect } from "@/lib/auth";

/**
 * GET /api/programs/[id]/participants
 * Get all participants in a program
 * Accessible by: Admin, HR, Program Facilitators
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const claims = await requireAuthOrRedirect();
    const { id: programId } = await params;

    if (!ObjectId.isValid(programId)) {
      return NextResponse.json({ error: "Invalid program ID" }, { status: 400 });
    }

    const db = await getDb();
    const [users, programs] = await Promise.all([
      db.collection("users"),
      db.collection("programs"),
    ]);

    // Verify program exists and user has access
    const program = await programs.findOne({ _id: new ObjectId(programId) });
    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Check access: admin, hr officer, or facilitator
    const isFacilitator =
      program.facilitators?.some(
        (fac: ObjectId) => fac.toString() === claims.userId
      ) || false;
    const isHrOfficer = program.hrOfficer?.toString() === claims.userId;

    if (
      claims.role !== "admin" &&
      !isFacilitator &&
      !isHrOfficer
    ) {
      console.warn(
        `[PARTICIPANTS] Access denied for ${claims.role} user ${claims.userId}`
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const participants = await users
      .find({
        programId: new ObjectId(programId),
        role: "participant",
        isActive: true,
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(
      `[PARTICIPANTS] Listed ${participants.length} participants for program ${programId}`
    );

    return NextResponse.json({
      programId,
      programName: program.name,
      totalParticipants: participants.length,
      participants,
    });
  } catch (error) {
    console.error("[PARTICIPANTS] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
