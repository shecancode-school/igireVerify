import type { ObjectId } from "mongodb";

export type UserRole = "participant" | "staff";
export type StaffPosition = "HR" | "Facilitator" | "General Staff";

export type ProgramId = string;

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  // Participant fields
  programId?: ProgramId | null;
  // Staff fields
  position?: StaffPosition | null;
  createdAt: Date;
}

