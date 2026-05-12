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
    <div className="bg-[#E5E5E5] rounded-[32px] p-6 shadow-sm transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <h4 className="text-lg font-black text-slate-800 tracking-tight">Attendance History</h4>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setActiveTab("week")}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300
                       ${activeTab === "week" 
                         ? "bg-slate-900 text-white shadow-md" 
                         : "text-slate-400 hover:text-slate-600"}`}
          >
            Week
          </button>
          <button
            onClick={() => setActiveTab("month")}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300
                       ${activeTab === "month" 
                         ? "bg-slate-900 text-white shadow-md" 
                         : "text-slate-400 hover:text-slate-600"}`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full h-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Check-Ins</span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-900 leading-none">
                  {currentData?.checkedIn || 0}
                </p>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Verified</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((currentData?.checkedIn || 0) / (activeTab === 'week' ? 7 : 30)) * 100, 100)}%` }} 
                />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1 transition-colors hover:bg-slate-50">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Check-Outs</span>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-900 leading-none">
                  {currentData?.checkedOut || 0}
                </p>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Closed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-slate-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((currentData?.checkedOut || 0) / (activeTab === 'week' ? 7 : 30)) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}