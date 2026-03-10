"use client";

import { useState } from "react";

export default function AttendanceHistory() {
  const [activeTab, setActiveTab] = useState<"week" | "month">("week");

  const weekData = {
    checkedIn: 4,
    percentage: 96,
    checkedOut: 4,
    aiVerified: "AI Verified",
    aiPercentage: 100,
    onTime: "On-Time"
  };

  const monthData = {
    checkedIn: 15,
    percentage: 94,
    checkedOut: 15,
    aiVerified: "AI Verified",
    aiPercentage: 98,
    onTime: "On-Time"
  };

  const currentData = activeTab === "week" ? weekData : monthData;

  return (
    <div className="bg-[#E5E5E5] rounded-
    2xl p-6 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
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
      <div className="flex gap-2 mb-5 bg-white rounded-xl p-1.5">
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
      <div className="bg-white rounded-xl p-5">
        <div className="grid grid-cols-3 gap-4 text-xs">
          
          <div className="space-y-1">
            <p className="font-semibold text-[#111111]">
              {currentData.checkedIn} Checked-In
            </p>
            <p className="font-semibold text-[#111111]">
              {currentData.checkedOut} Checked-Out
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-[#111111]">{currentData.percentage} %</p>
            <p className="text-[#111111]">{currentData.aiVerified}</p>
          </div>

          <div className="space-y-1 flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="font-semibold text-[#111111]">{currentData.onTime}</p>
            </div>
            <p className="font-semibold text-[#111111]">{currentData.aiPercentage} %</p>
          </div>

        </div>
      </div>

    </div>
  );
}