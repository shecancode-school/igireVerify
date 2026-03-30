import { getAuthClaimsFromCookies, getDashboardPath } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function HrDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const claims = await getAuthClaimsFromCookies();
  if (!claims) redirect("/login");

  // Staff members are only allowed on the HR dashboard if their position is HR.
  if (claims.role !== "staff" || claims.position !== "HR") {
    redirect(getDashboardPath(claims));
  }

  return children;
}

