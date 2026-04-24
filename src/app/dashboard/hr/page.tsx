"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function AttendanceManagementHub() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col-reverse md:flex-row">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-20 md:pb-0 min-w-0 flex flex-col">
        <TopBar />

        {/* Page Content */}
        <main className="px-4 sm:px-6 md:px-12 py-10 md:py-16 min-h-[calc(100vh-180px)] flex items-center justify-center">
          <div className="max-w-4xl w-full text-center">
            
            {/* Header */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6" style={{ color: "#16A34A" }}>
              Attendance Management
            </h1>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="h-1 w-32 rounded-full" style={{ background: "#16A34A" }}/>
              <div className="h-1 w-4 rounded-full" style={{ background: "#16A34A" }}/>
              <div className="h-1 w-4 rounded-full" style={{ background: "#16A34A" }}/>
              <div className="h-1 w-4 rounded-full" style={{ background: "#16A34A" }}/>
              <div className="h-1 w-32 rounded-full" style={{ background: "#16A34A" }}/>
            </div>

            {/* Description */}
            <p className="text-lg text-gray-700 mb-16 max-w-3xl mx-auto leading-relaxed">
              Attendance is the official record of presence and participation for both 
              staff and program participants. This system ensures accurate tracking 
              using verified credentials such as email identity, GPS location, camera 
              verification, and timestamps.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-8 max-w-md sm:max-w-none mx-auto">
              <button
                onClick={() => router.push("/dashboard/hr/attendance/program")}
                className="min-h-[48px] px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                style={{ background: "#16A34A" }}
              >
                Program Attendance
              </button>

              <button
                onClick={() => router.push("/dashboard/hr/attendance/staff")}
                className="min-h-[48px] px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-white text-lg sm:text-xl font-bold transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                style={{ background: "#16A34A" }}
              >
                Staff Attendance
              </button>
            </div>
          </div>
        </main>

        {/* Footer - Fixed at bottom */}
        <footer className="px-4 md:px-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200">
          © 2026 Igire Rwanda Organisation - All Actions are auditable
        </footer>
      </div>
    </div>
  );
}