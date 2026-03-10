"use client";

import { useState } from "react";
import Link from "next/link";

export default function HRDashboard() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/home";
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="w-[160px] bg-[#7FAF8C] fixed left-0 top-0 h-screen flex flex-col items-center py-8">
        {/* Logo */}
        <div className="mb-12">
          <h1 className="font-black text-2xl text-white">
            Igire<span className="text-[#C47D0E]">Verify</span>
          </h1>
        </div>

        {/* Nav Icons */}
        <nav className="flex-1 flex flex-col gap-8">
          <Link href="/dashboard/hr" className="w-14 h-14 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </Link>
          
          <Link href="/dashboard/hr/attendance" className="w-14 h-14 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <polyline points="17 11 19 13 23 9"/>
            </svg>
          </Link>
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

        {/* Dashboard Content */}
        <main className="px-12 py-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-[#F0F0F0] rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">Attendance Today</p>
              <p className="text-5xl font-black text-[#16A34A] mb-2">92%</p>
              <p className="text-xs text-gray-500">Verified Check-ins</p>
            </div>

            <div className="bg-[#F0F0F0] rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">Expected Today</p>
              <p className="text-5xl font-black text-gray-900 mb-2">128 <span className="text-2xl">people</span></p>
              <p className="text-xs text-gray-500">Verified Check-ins</p>
            </div>

            <div className="bg-[#F0F0F0] rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">Pending Reviews</p>
              <p className="text-5xl font-black text-[#C47D0E] mb-2">6</p>
              <p className="text-xs text-gray-500">Offline / AI Flagged</p>
            </div>

            <div className="bg-[#F0F0F0] rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-2">System status</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]"/>
                  <span className="text-xs">GPS Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]"/>
                  <span className="text-xs">AI Activated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]"/>
                  <span className="text-xs">Camera Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and Summary */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="col-span-2 bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-black mb-6">Today's Attendance Timeline</h3>
              {/* Timeline visualization would go here */}
              <div className="space-y-3">
                {["Mon", "Tue", "Wed", "Thur", "Fri"].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-16 text-sm font-medium">{day}</span>
                    <div className="flex-1 flex gap-2">
                      <div className="h-8 bg-[#16A34A] rounded flex-1"/>
                      <div className="h-8 bg-[#C47D0E] rounded w-20"/>
                      <div className="h-8 bg-gray-300 rounded w-32"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F5F5F5] rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-black mb-6">Quick Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">✓ Verified : 110</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">⏳ Pending : 12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">✗ Absent : 6</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-3 bg-[#14532D] text-white rounded-lg font-semibold">
                  Check-In
                </button>
                <button className="w-full py-3 bg-gray-400 text-white rounded-lg font-semibold">
                  Check-Out
                </button>
                <button className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold text-sm">
                  AI-Verification in process
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="flex items-center gap-2 font-bold mb-4">
                <span>⚠️</span> Needed Actions
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5"/>
                  Session start at 08:30 AM
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"/>
                  Attendance audit today at 04:30 PM
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5"/>
                  Attendance audit today at 04:30 PM
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="flex items-center gap-2 font-bold mb-4">
                <span>📢</span> Announcements
              </h3>
              <div className="space-y-3 text-sm">
                <p>Session start at 08:30 AM</p>
                <p>Attendance audit today at 04:30 PM</p>
              </div>
            </div>
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