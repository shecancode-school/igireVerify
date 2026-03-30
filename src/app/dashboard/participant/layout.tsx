import { getAuthClaimsFromCookies, getDashboardPath } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ParticipantDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const claims = await getAuthClaimsFromCookies();
  if (!claims) redirect("/login");
  if (claims.role !== "participant") redirect(getDashboardPath(claims));
  return children;
}

