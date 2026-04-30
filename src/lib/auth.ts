import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { StaffPosition, UserRole } from "@/models/User";

export type AuthClaims = {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  position?: StaffPosition | null;
  assignedPrograms?: string[];
};

type JwtPayload = {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  position?: StaffPosition | null;
  assignedPrograms?: string[];
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function jwtSecret(): string {
  return requireEnv("JWT_SECRET");
}

export function getDashboardPath(claims: Pick<AuthClaims, "role" | "position">): string {
  if (claims.role === "super-admin" || claims.role === "admin") return "/dashboard/admin";
  if (claims.role === "participant") return "/dashboard/participant";
  
  // All other staff roles (manager, facilitator, academic, communication) 
  // share the Staff Dashboard, which renders contextual widgets based on role.
  return "/dashboard/staff";
}

export function getAuthClaimsFromToken(token: string): AuthClaims | null {
  try {
    const payload = jwt.verify(token, jwtSecret()) as JwtPayload;
    return {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      position: payload.position ?? null,
      assignedPrograms: payload.assignedPrograms ?? [],
    };
  } catch {
    return null;
  }
}

export async function getAuthClaimsFromCookies(): Promise<AuthClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return getAuthClaimsFromToken(token);
}

export async function requireAuthOrRedirect(expected?: AuthClaims["role"]): Promise<AuthClaims> {
  const claims = await getAuthClaimsFromCookies();
  if (!claims) redirect("/login");
  if (expected && claims.role !== expected) redirect(getDashboardPath(claims));
  return claims;
}

