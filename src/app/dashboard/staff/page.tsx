import { Suspense } from "react";
import StaffDashboardClient from "./StaffDashboardClient";

export default function StaffDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center text-gray-600">
          Loading dashboard…
        </div>
      }
    >
      <StaffDashboardClient />
    </Suspense>
  );
}
