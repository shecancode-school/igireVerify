import { AuthClaims } from "./auth";
import { ObjectId } from "mongodb";

/**
 * Checks if a user has administrative read access (Admin or CEO)
 */
export function hasAdminView(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  return claims.role === "admin" || claims.role === "super-admin";
}


export function canModify(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  return claims.role === "admin";
}

export function isStaff(claims: AuthClaims | null): boolean {
  if (!claims) return false;
  const staffRoles = ["admin", "super-admin", "manager", "facilitator", "academic", "communication"];
  return staffRoles.includes(claims.role);
}

export function getScopedQuery(claims: AuthClaims, baseQuery: any = {}): any {
  if (claims.role === "admin" || claims.role === "super-admin") {
    return baseQuery;
  }

  return baseQuery;
}


export function isAssignedToProgram(claims: AuthClaims, assignedPrograms: string[] | ObjectId[], targetProgramId: string): boolean {
  if (claims.role === "admin" || claims.role === "super-admin") return true;
  
  const targetIdStr = targetProgramId.toString();
  return assignedPrograms.some(id => id.toString() === targetIdStr);
}
