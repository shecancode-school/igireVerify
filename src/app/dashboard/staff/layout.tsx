import { getAuthClaimsFromCookies, getDashboardPath } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const claims = await getAuthClaimsFromCookies();
  if (!claims) redirect("/login");

  // Participant users are not allowed into staff dashboards.
  if (claims.role !== "staff") redirect(getDashboardPath(claims));

  // HR has its own dashboard; Facilitator + General Staff share staff dashboards.
  if (claims.position === "HR") redirect(getDashboardPath(claims));

  return children;
}

