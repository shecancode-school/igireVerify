"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AttendanceManagementHub() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/home";
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[160px] bg-[#7FAF8C] fixed left-0 top-0 h-screen flex flex-col items-center py-8">
        <div className="mb-12">
          <h1 className="font-black text-2xl text-white">
            Igire<span className="text-[#C47D0E]">Verify</span>
          </h1>
        </div>

        <nav className="flex-1 flex flex-col gap-8">
          <button
            onClick={() => router.push("/dashboard/hr")}
            className="w-14 h-14 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </button>
          
          <button className="w-14 h-14 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <polyline points="17 11 19 13 23 9"/>
            </svg>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-[160px]">
        {/* Top Bar */}
        <header className="bg-[#F5F5F5] border-b border-gray-200 px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            <span className="font-medium text-gray-700">Online</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="font-bold text-gray-900">Juliette NYIRASAFARI</p>
                <p className="text-sm text-gray-600">HR& Finance</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">
                  View Profile
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700">
                  Settings
                </button>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left font-semibold text-white rounded-lg mx-2"
                  style={{ background: "#C47D0E", width: "calc(100% - 16px)" }}
                >
                  Log Out →
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="px-12 py-16 min-h-[calc(100vh-180px)] flex items-center justify-center">
          <div className="max-w-4xl w-full text-center">
            
            {/* Header */}
            <h1 className="text-6xl font-black mb-6" style={{ color: "#16A34A" }}>
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
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => router.push("/dashboard/hr/attendance/program")}
                className="px-12 py-5 rounded-2xl text-white text-xl font-bold transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                style={{ background: "#16A34A" }}
              >
                Program Attendance
              </button>

              <button
                onClick={() => router.push("/dashboard/hr/attendance/staff")}
                className="px-12 py-5 rounded-2xl text-white text-xl font-bold transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                style={{ background: "#16A34A" }}
              >
                Staff Attendance
              </button>
            </div>
          </div>
        </main>

        {/* Footer - Fixed at bottom */}
        <footer className="px-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200">
          © 2026 Igire Rwanda Organisation - All Actions are auditable
        </footer>
      </div>
    </div>
  );
}