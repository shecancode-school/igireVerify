"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StaffAttendancePage() {
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
            </svg>
            <span className="font-medium text-gray-700">Online</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-4"
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50">View Profile</button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50">Settings</button>
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
        <main className="px-12 py-10 min-h-[calc(100vh-180px)]">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <h1 className="text-5xl font-black text-[#111111] mb-4">
              Take Attendance
            </h1>

            <p className="text-gray-600 text-lg mb-12">
              You are required to complete all of the steps in order to take the attendance. Please make sure:
            </p>

            {/* Requirements Checklist */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-8 mb-10">
              <div className="space-y-5">
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    You are connected to a working Wi-Fi or internet
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    Your face is clearly visible, glasses removed if needed
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    The camera is enabled and working on your device
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    You Check-in before class session starts at 8:00 - 8:30 and Check-out 16:00 - 17:30
                  </p>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              {/* Check-In Button */}
              <button
                onClick={() => router.push("/dashboard/hr/attendance/staff/checkin")}
                className="h-20 rounded-2xl font-bold text-xl text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#7FAF8C" }}
              >
                Check-In
              </button>

              {/* Check-Out Button */}
              <button
                onClick={() => router.push("/dashboard/hr/attendance/staff/checkout")}
                className="h-20 rounded-2xl font-bold text-xl border-4 transition-all hover:bg-orange-50 active:scale-[0.98]"
                style={{ 
                  borderColor: "#C47D0E",
                  color: "#C47D0E"
                }}
              >
                Check-Out
              </button>

            </div>

            {/* Footer Notice */}
            <p className="text-center text-gray-600 text-sm">
              All Check-In and Check-Out are logged and auditable.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200">
          © 2026 Igire Rwanda Organisation - All Actions are auditable
        </footer>
      </div>
    </div>
  );
}