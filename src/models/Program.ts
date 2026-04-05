import type { ObjectId } from "mongodb";

export interface ProgramSchedule {
  checkInStart: string;
  checkInEnd: string;
  classStart: string;
  checkOutStart: string;
  checkOutEnd: string;
  lateAfter: string;
  days: string[];          
}

export interface ProgramDocument {
  _id: ObjectId;
  name: string;
  code: string;            
  description?: string;

  startDate: Date;
  endDate: Date;

  schedule: ProgramSchedule;

  facilitators: ObjectId[];  
  hrOfficer?: ObjectId | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
