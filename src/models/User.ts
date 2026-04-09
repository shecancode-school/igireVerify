import type { ObjectId } from "mongodb";

export type UserRole = "participant" | "staff" | "admin";
export type StaffPosition = "HR" | "Facilitator" | "General Staff";

export type ProgramId = string | ObjectId;

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;

  programId?: ProgramId | null;
  enrollmentDate?: Date;
  
  position?: StaffPosition | null;
  assignedPrograms?: ObjectId[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  failedLoginAttempts?: number;
  lockUntil?: Date;

  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
}

