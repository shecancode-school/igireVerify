"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import ProgramCard from "@/components/dashboard/ProgramCard";
import AttendanceStats from "@/components/dashboard/AttendanceStats";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import RequirementsBanner from "@/components/dashboard/RequirementsBanner"; 
import DashboardFooter from "@/components/dashboard/DashboardFooter";

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
    <div className="min-h-screen bg-white flex">
      

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

      
        <main className="px-12 py-8 space-y-10 bg-white min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <ProgramCard programName={userData.programName} />
            </div>
            <div className="lg:col-span-7">
              <AttendanceChart />
            </div>
          </div>

          <AttendanceStats
            daysAttended={userData.daysAttended}
            pendingAlerts={userData.pendingAlerts}
            missedDays={userData.missedDays}
          />

          <RequirementsBanner />

          <DashboardFooter />

        </main>
      </div>

    </div>
  );
}