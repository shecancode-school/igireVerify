"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProgramOverviewPage() {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col-reverse md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-[160px] h-16 md:h-screen md:min-h-screen bg-[#7FAF8C] fixed bottom-0 md:bottom-auto left-0 md:top-0 z-40 flex flex-row md:flex-col items-center justify-center md:justify-start gap-4 md:gap-8 py-2 md:py-8 px-2 md:px-0 overflow-x-auto md:overflow-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="hidden md:block mb-12 shrink-0">
          <h1 className="font-black text-xl md:text-2xl text-white text-center px-1">
            Igire<span className="text-[#C47D0E]">Verify</span>
          </h1>
        </div>

        <nav className="flex-1 flex flex-row md:flex-col gap-4 md:gap-8 items-center justify-center md:justify-start">
          <button
            onClick={() => router.push("/dashboard/hr")}
            className="w-14 h-14 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </button>

          <button className="w-14 h-14 rounded-xl bg-white/90 shadow-lg flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14532D" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 w-full md:ml-[160px] pb-20 md:pb-0 min-w-0">
        {/* Top Bar */}
        <header className="bg-[#F5F5F5] border-b border-gray-200 px-4 sm:px-6 md:px-12 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            </svg>
            <span className="font-medium text-gray-700">Online</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-4 min-w-0"
            >
              <div className="text-right hidden sm:block min-w-0">
                <p className="font-bold text-gray-900 truncate max-w-[140px] md:max-w-none">Juliette NYIRASAFARI</p>
                <p className="text-sm text-gray-600">HR  & Finance</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
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
        <main className="px-4 sm:px-6 md:px-12 py-6 md:py-10 min-h-[calc(100vh-120px)]">

          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] mb-6 md:mb-10">
            Program Overview
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            <div className="bg-[#D6E9F5] rounded-xl p-6 border-2 border-[#7BAFD4]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <p className="text-5xl font-black text-[#111111]">03</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Total Programs</p>
            </div>

            <div className="bg-[#D4F4DD] rounded-xl p-6 border-2 border-[#81C995]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-5xl font-black text-[#111111]">180</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Total Participants</p>
            </div>

            <div className="bg-[#F5E6D3] rounded-xl p-6 border-2 border-[#D4A574]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C47D0E" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-5xl font-black text-[#111111]">85%</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Attendance Rate</p>
            </div>

            <div className="bg-[#FFE4E4] rounded-xl p-6 border-2 border-[#FFB4B4]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-5xl font-black text-[#111111]">30</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">Pending Verification</p>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">

            {/* Table Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-black text-[#111111]">
                Attendance Data for Each Program
              </h2>
              <button className="px-6 py-2 bg-[#16A34A] text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Program</option>
                <option>Web Fundamentals</option>
                <option>Advanced Frontend</option>
                <option>Advanced Backend</option>
              </select>

              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Calendar</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>

              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Today</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#16A34A] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Program Name</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Total Participants</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Present</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Checked In</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Checked-Out</th>
                    <th className="px-6 py-4 text-center text-sm font-bold">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">Web Fundamentals</td>
                    <td className="px-6 py-4 text-center text-sm">60</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span className="text-sm font-semibold">59</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">Advanced Backend</td>
                    <td className="px-6 py-4 text-center text-sm">60</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span className="text-sm font-semibold">59</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">Advanced Frontend</td>
                    <td className="px-6 py-4 text-center text-sm">60</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span className="text-sm font-semibold">59</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                    <td className="px-6 py-4 text-center text-sm">59</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">Showing 1 of 4 entries</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                  &lt;
                </button>
                <button className="px-3 py-1 bg-[#16A34A] text-white rounded text-sm font-semibold">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                  3
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100">
                  Next &gt;
                </button>
              </div>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="px-4 md:px-12 py-6 text-center text-sm text-gray-500 border-t border-gray-200 mt-auto">
          © 2026 Igire Rwanda Organisation - All Actions are auditable
        </footer>
      </div>
    </div>
  );
}