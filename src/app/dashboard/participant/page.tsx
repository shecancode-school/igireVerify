"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import AttendanceStats from "@/components/dashboard/AttendanceStats";
import AttendanceHistory from "@/components/dashboard/AttendanceHistory";
import AttendanceChart from "@/components/dashboard/AttendanceChart";

export default function ParticipantDashboard() {
  const userData = {
    userName: "Alice Uwera",
    programName: "Web fundamentals",
    isOnline: true,
    sessionDate: "Today: Friday, 6 Feb 2026",
    checkInWindow: "08:00 - 08:30",
    currentTime: "08:52",
    daysAttended: 15,
    pendingAlerts: 2,
    missedDays: 1,
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      
      <Sidebar />

      <div className="flex-1 ml-[120px]">
        
        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          isOnline={userData.isOnline}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        {/* CENTERED CONTENT WITH FREE SPACE ON SIDES */}
        <main className="px-16 py-8 max-w-[1400px]">
          
          {/* Row 1: Program Card (LEFT) + Attendance Chart (RIGHT) */}
          <div className="grid grid-cols-12 gap-6 mb-8">
            {/* Program Card - Takes 5 columns */}
            <div className="col-span-5">
              <ProgramCard programName={userData.programName} />
            </div>
            
            {/* Attendance Chart - Takes 7 columns */}
            <div className="col-span-7">
              <AttendanceChart />
            </div>
          </div>

          {/* Row 2: Attendance Stats - 3 cards */}
          <div className="mb-8">
            <AttendanceStats
              daysAttended={userData.daysAttended}
              pendingAlerts={userData.pendingAlerts}
              missedDays={userData.missedDays}
            />
          </div>

          {/* Row 3: Attendance History - Takes only LEFT half */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <AttendanceHistory />
            </div>
            {/* Right side is FREE SPACE */}
          </div>

        </main>
      </div>

    </div>
  );
}