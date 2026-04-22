"use client";

import { useState, useEffect } from "react";

export default function AttendanceHistory({ programId, userId }: { programId: string; userId: string }) {
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/attendance/user-history?userId=${userId}&programId=${programId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("History fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId && programId) fetchStats();
  }, [userId, programId]);

  const currentData = activeTab === "week" ? stats?.week : stats?.month;

  return (
    <div className="bg-[#E5E5E5] rounded-
    2xl p-4 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <h4 className="text-base font-semibold text-[#111111]">Attendance History</h4>
        </div>
        
        {/* Three dots */}
        <button className="p-1.5 hover:bg-gray-300 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="#666"/>
            <circle cx="12" cy="12" r="1.5" fill="#666"/>
            <circle cx="12" cy="19" r="1.5" fill="#666"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3 bg-white rounded-xl p-1.5">
        <button
          onClick={() => setActiveTab("week")}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                     ${activeTab === "week" 
                       ? "bg-[#111111] text-white" 
                       : "bg-transparent text-gray-500 hover:text-gray-700"}`}
        >
          This Week
        </button>
        <button
          onClick={() => setActiveTab("month")}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                     ${activeTab === "month" 
                       ? "bg-[#111111] text-white" 
                       : "bg-transparent text-gray-500 hover:text-gray-700"}`}
        >
          This Month
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-3">
        {loading ? (
          <div className="h-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-xs">
            
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Check-Ins</span>
                <p className="text-base font-black text-gray-900 leading-none">
                  {currentData?.checkedIn || 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Check-Outs</span>
                <p className="text-base font-black text-gray-900 leading-none">
                  {currentData?.checkedOut || 0}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}