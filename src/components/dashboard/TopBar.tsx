"use client";

import { useState, useEffect } from "react";

export default function TopBar({ 
  userName: initialUserName,
  programName: initialProgramName,
  isOnline = true,
  sessionDate = "Today: Friday, 6 Feb 2026",
  checkInWindow = "08:00 - 08:30",
  currentTime = "08:52"
}: {
  userName?: string;
  programName?: string;
  isOnline?: boolean;
  sessionDate?: string;
  checkInWindow?: string;
  currentTime?: string;
}) {
  const [userName, setUserName] = useState(initialUserName || "Loading...");
  const [programName, setProgramName] = useState(initialProgramName || "Loading...");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [liveDate, setLiveDate] = useState(sessionDate);
  const [liveTime, setLiveTime] = useState(currentTime);
  const [networkStatus, setNetworkStatus] = useState(true);

  useEffect(() => {
    // Network status listeners
    setNetworkStatus(navigator.onLine);
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const updateTime = () => {
      const now = new Date();
      setLiveDate(`Today: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
      setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // updates every minute

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserName(data.name || data.userName || "Unknown User");
          if (data.programName) setProgramName(data.programName);
          if (data.profilePhotoUrl) setProfilePhotoUrl(data.profilePhotoUrl);
        }
      } catch (error) {
        console.error("Failed to fetch user in TopBar:", error);
      }
    };
    fetchUser();
    
    window.addEventListener("profileUpdated", fetchUser);
    return () => {
      window.removeEventListener("profileUpdated", fetchUser);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.href = "/home";
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-12 py-3 gap-3 sm:gap-4 md:gap-6">
        {/* Left: date / window / time */}
        <div className="hidden md:flex items-center gap-4 text-xs md:text-sm whitespace-nowrap">
          <span className="font-medium text-gray-700 whitespace-nowrap">
            {liveDate}
          </span>

          <span className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-600">Check-In Window:</span>
            <span className="font-semibold text-gray-900">
              {checkInWindow}
            </span>
          </div>

          <span className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-600">Current Time:</span>
            <span className="font-semibold text-[#2E7D32]">
              {liveTime}
            </span>
          </div>
        </div>

        {/* Right: online + profile */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
          <div className="md:hidden text-xs text-gray-600 font-medium truncate max-w-[55vw]">
            {liveTime} · {checkInWindow}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={networkStatus ? "#2E7D32" : "#9E9E9E"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-colors duration-300 ${!networkStatus && 'opacity-70'}`}
            >
              {networkStatus ? (
                <>
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" fill="#2E7D32" />
                </>
              ) : (
                <>
                  <line x1="2" y1="2" x2="22" y2="22" />
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" fill="#9E9E9E" />
                </>
              )}
            </svg>
            <span className={`text-sm font-semibold transition-colors duration-300 ${networkStatus ? 'text-[#111111]' : 'text-gray-500'}`}>
              {networkStatus ? "Online" : "Offline"}
            </span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 min-h-[44px]"
            >
              <div className="text-right hidden sm:block">
                <p className="font-bold text-[#111111] text-sm">
                  {userName}
                </p>
                <p className="text-xs text-gray-700">
                  {programName}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center border border-gray-400 overflow-hidden">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                <button
                  onClick={() => window.location.href = "/dashboard/profile"}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium text-gray-700"
                >
                  View Profile
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm font-medium text-gray-700">Settings</button>
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
        </div>
      </div>
    </div>
  );
}