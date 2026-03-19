"use client";

import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function AttendanceLandingPage() {
  const router = useRouter();

  const userData = {
    userName: "Alice Uwera",
    programName: "Web fundamentals",
    isOnline: true,
    sessionDate: "Today: Friday, 6 Feb 2026",
    checkInWindow: "08:00 - 08:30",
    currentTime: "08:52",
  };

  const handleCheckIn = () => {
    router.push("/dashboard/participant/attendance/checkin");
  };

  const handleCheckOut = () => {
    router.push("/dashboard/participant/attendance/checkout");
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

        <main className="px-12 py-10 bg-white min-h-screen">
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

                {/* Requirement 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    You are connected to a working Wi-Fi or internet
                  </p>
                </div>

                {/* Requirement 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    Your face is clearly visible, glasses removed if needed
                  </p>
                </div>

                {/* Requirement 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-gray-800 text-base pt-1">
                    The camera is enabled and working on your device
                  </p>
                </div>

                {/* Requirement 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                onClick={handleCheckIn}
                className="h-20 rounded-2xl font-bold text-xl text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "#7FAF8C" }}
              >
                Check-In
              </button>

              {/* Check-Out Button */}
              <button
                onClick={handleCheckOut}
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
            <p className="text-center text-gray-600 text-sm mb-8 text-[20px]">
              All Check-In and Check-Out are logged and auditable.
            </p>



          </div>
        </main>
      </div>
    </div>
  );
}