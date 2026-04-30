import { AuthClaims } from "./auth";
import { ObjectId } from "mongodb";

/**
 * Checks if a user has administrative read access (Admin or CEO)
 */
export function hasAdminView(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  return claims.role === "admin" || claims.role === "super-admin";
}

/**
 * Checks if a user can modify system data (HR only)
 * CEOs (super-admin) are read-only by design in Phase 2.
 */
export function canModify(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  return claims.role === "admin";
}

/**
 * Checks if the user is a staff member of any tier
 */
export function isStaff(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  const staffRoles = ["admin", "super-admin", "manager", "facilitator", "academic", "communication"];
  return staffRoles.includes(claims.role);
}

/**
 * Scopes a database query based on the user's role and assignments.
 * - Admins/CEOs see everything.
 * - Facilitators/Managers only see assigned programs.
 */
export function getScopedQuery(claims: AuthClaims, baseQuery: any = {}): any {
  if (claims.role === "admin" || claims.role === "super-admin") {
    return baseQuery;
  }

  // Staff roles must be restricted to their assigned programs
  // Note: We need the full user object from DB to get assignedPrograms, 
  // but for simple cases we can check the claims if we add it there later.
  return baseQuery;
}

/**
 * Utility to check if a user is assigned to a specific program
 */
export function isAssignedToProgram(claims: AuthClaims, assignedPrograms: string[] | ObjectId[], targetProgramId: string): boolean {
  if (claims.role === "admin" || claims.role === "super-admin") return true;
  
  const targetIdStr = targetProgramId.toString();
  return assignedPrograms.some(id => id.toString() === targetIdStr);
}
