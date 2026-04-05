import { z } from "zod";

// ========== PASSWORD VALIDATION ==========
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// ========== AUTH VALIDATION ==========
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email").toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(["participant", "staff"]),
  programId: z.string().optional(),
  position: z.enum(["HR", "Facilitator"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(1, "Password required"),
});

// ========== ADMIN CREATION (INTERNAL ONLY) ==========
// Only for super admin use via secure endpoint
export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email").toLowerCase(),
  password: passwordSchema,
  confirmPassword: z.string(),
  adminSecret: z.string().min(32, "Invalid admin credentials"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ========== ATTENDANCE VALIDATION ==========
export const gpsLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, "Invalid latitude"),
  longitude: z.number().min(-180).max(180, "Invalid longitude"),
  accuracy: z.number().positive("Accuracy must be positive"),
});

export const checkInSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
  programId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid program ID"),
  userName: z.string().min(1),
  programName: z.string().min(1),
  checkInTime: z.coerce.date(),
  photoUrl: z.string().url("Invalid photo URL"),
  gpsLocation: gpsLocationSchema.optional(),
  role: z.enum(["participant", "staff"]).optional(),
});

export const checkOutSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
  programId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid program ID"),
  checkOutTime: z.coerce.date(),
  photoUrl: z.string().url("Invalid photo URL"),
  gpsLocation: gpsLocationSchema.optional(),
  role: z.enum(["participant", "staff"]).optional(),
});

export const manualAttendanceSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid user ID"),
  programId: z.string().regex(/^[0-9a-f]{24}$/, "Invalid program ID"),
  date: z.coerce.date(),
  checkInStatus: z.enum(["on-time", "late", "absent"]),
  checkOutStatus: z.enum(["on-time", "early"]).optional(),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

// ========== PROGRAM VALIDATION ==========
export const programScheduleSchema = z.object({
  checkInStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  checkInEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  classStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  checkOutStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  checkOutEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  lateAfter: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  days: z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]))
    .min(1, "At least one day required"),
});

export const createProgramSchema = z.object({
  name: z.string().min(2, "Program name required").trim(),
  code: z.string().min(2).toLowerCase().trim(),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  schedule: programScheduleSchema,
  facilitators: z.array(z.string().regex(/^[0-9a-f]{24}$/)).optional(),
  hrOfficer: z.string().regex(/^[0-9a-f]{24}$/).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// ========== USER MANAGEMENT VALIDATION ==========
export const createUserSchema = z.object({
  name: z.string().min(2, "Name required").trim(),
  email: z.string().email("Invalid email").toLowerCase(),
  password: passwordSchema,
  role: z.enum(["participant", "staff", "admin"]),
  programId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  position: z.enum(["HR", "Facilitator", "General Staff"]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).trim().optional(),
  email: z.string().email().toLowerCase().optional(),
  role: z.enum(["participant", "staff", "admin"]).optional(),
  position: z.enum(["HR", "Facilitator", "General Staff"]).optional(),
  isActive: z.boolean().optional(),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
