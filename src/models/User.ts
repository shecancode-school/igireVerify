import type { ObjectId } from "mongodb";

export type UserRole = 
  | "super-admin"    // CEO (Read-only Global Oversight)
  | "admin"          // HR (System Controller)
  | "manager"        // Program Manager (Program-wide Oversight)
  | "facilitator"    // Staff (Classroom-scoped)
  | "participant"    // Student
  | "academic"       // Head of Academics
  | "communication"  // Communication & Outreach
;

export type StaffPosition = 
  | "CEO" 
  | "HR" 
  | "Program Manager" 
  | "Facilitator" 
  | "Head of Academics" 
  | "Communication & Outreach";

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
  assignedPrograms?: ObjectId[]; // For managers and facilitators

  // Phase 2: AI Identity
  faceDescriptor?: number[]; // Mathematical map of the face (128-float vector)
  isFaceRegistered?: boolean;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  
  failedLoginAttempts?: number;
  lockUntil?: Date;

  emailVerified?: boolean;
}

