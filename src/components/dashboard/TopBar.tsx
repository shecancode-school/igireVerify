"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function TopBar({ 
  userName: initialUserName,
  programName: initialProgramName,
  sessionDate = "Today: Friday, 6 Feb 2026",
  checkInWindow = "08:00 - 08:30",
  currentTime = "08:52"
}: {
  userName?: string;
  programName?: string;
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
  const [networkStatus, setNetworkStatus] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    // Network status listeners
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
    <header className="relative z-[60] w-full shrink-0 border-b border-gray-200 bg-white px-3 py-2.5 sm:px-5 sm:py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-w-0">
      {/* Left: Date | Check-in | Time (Figma-style, with dividers on md+) */}
      <div className="flex flex-wrap items-stretch gap-x-2 sm:gap-x-4 min-w-0 flex-1">
        <div className="flex min-w-0 flex-col justify-center border-r border-gray-200 pr-3 sm:pr-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Today</span>
          <span className="text-sm font-semibold text-gray-900 truncate sm:text-[15px]">{liveDate.replace(/^Today:\s*/i, "")}</span>
        </div>
        <div className="hidden min-w-0 flex-col justify-center border-r border-gray-200 pr-3 sm:flex sm:pr-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Check-In Window</span>
          <span className="text-sm font-semibold text-gray-900 sm:text-[15px]">{checkInWindow}</span>
        </div>
        <div className="flex min-w-0 flex-col justify-center sm:border-r sm:border-gray-200 sm:pr-4">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Current Time</span>
          <span className="text-sm font-semibold tabular-nums text-gray-900 sm:text-[15px]">{liveTime}</span>
        </div>
        <div className="flex min-w-0 flex-col justify-center sm:hidden">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Window</span>
          <span className="truncate text-sm font-semibold text-gray-900">{checkInWindow}</span>
        </div>
      </div>

      {/* Right: Wi‑Fi status + profile */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 border-r border-gray-200 pr-3 sm:pr-4">
          {networkStatus ? (
            <Wifi className="h-5 w-5 shrink-0 text-[#22c55e]" strokeWidth={2} aria-hidden />
          ) : (
            <WifiOff className="h-5 w-5 shrink-0 text-red-500" strokeWidth={2} aria-hidden />
          )}
          <span className={`text-sm font-semibold ${networkStatus ? "text-gray-900" : "text-red-600"}`}>
            {networkStatus ? "Online" : "Offline"}
          </span>
        </div>

        <div className="relative flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-gray-900 leading-tight max-w-[14rem] truncate">{userName}</span>
            <span className="text-xs text-gray-500 font-medium leading-tight max-w-[14rem] truncate">{programName}</span>
          </div>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="min-h-[40px] min-w-[40px] focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded-full transition-transform hover:scale-105">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover border-2 border-green-600 shadow-sm" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full z-[70] mt-2 w-52 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white py-2 shadow-lg animate-fade-in">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{programName}</p>
              </div>
              <a href="/dashboard/participant/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                View Profile
              </a>
              <a href="/dashboard/participant/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.38 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c0 .66.38 1.26 1 1.51a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.26.38-1.51 1z" /></svg>
                Settings
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 17l-1.41-1.41M12 7v6m0 0l-4-4m4 4l4-4" /></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}