"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

export default function AttendanceLandingPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleCheckIn = () => {
    router.push("/dashboard/participant/attendance/checkin");
  };

  const handleCheckOut = () => {
    router.push("/dashboard/participant/attendance/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col-reverse md:flex-row">
        <Sidebar />
        <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 md:pb-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col-reverse md:flex-row">
      <Sidebar />

      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 md:pb-0">
        <TopBar {...userData} />

        <main className="px-4 md:px-12 py-10 bg-white min-h-[calc(100vh-90px)] flex flex-col items-center">
          <div className="max-w-4xl w-full flex-1">
            
            <div className="mb-12">
              <h2 className="text-[34px] font-black text-gray-700 mb-6 tracking-tight">Take Attendance</h2>
              <p className="text-[17px] text-gray-800 font-medium leading-relaxed max-w-2xl">
                You are required to complete all of the steps in order to take the attendance . Please make sure:
              </p>
            </div>

            {/* Requirements Checklist Card - FIGMA MATCH */}
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-10 mb-12">
              <div className="grid gap-8">
                {[
                  "You are connected to a working Wi-Fi or internet",
                  "Your face is clearly visible ,glasses removed if needed",
                  "the camera is enabled and working on your device",
                  `You Check-in before class session starts at ${userData?.checkInWindow || "8:00 - 8:30"}`
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-gray-950 text-[17px] font-medium leading-tight">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - FIGMA MATCH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
              <button
                onClick={handleCheckIn}
                className="h-24 rounded-[16px] bg-[#91B08E] hover:bg-[#7ea07a] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center"
              >
                <span className="font-black text-[22px] text-white tracking-wide">Check-In</span>
              </button>

              <button
                onClick={handleCheckOut}
                className="h-24 rounded-[16px] border-2 border-[#D99026] bg-white hover:bg-orange-50 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center"
              >
                <span className="font-black text-[22px] text-[#D99026] tracking-wide">Check-Out</span>
              </button>
            </div>

            {/* Auditable Notice */}
            <div className="text-center py-8">
              <p className="text-gray-400 text-[15px] font-medium">
                All Check-In and Check-Out are logged and auditable.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>

  );
}