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
    <div className="w-full bg-white shadow-sm border-b border-gray-200 px-2 sm:px-6 py-2 flex items-center justify-between gap-2">
      {/* Left Section: Date, Check-In Window, Current Time */}
      <div className="flex items-center gap-6 min-w-0">
        {/* Date */}
        <div className="flex flex-col min-w-[180px]">
          <span className="text-xs text-gray-500 font-medium">Today</span>
          <span className="text-base font-semibold text-gray-900 truncate">{liveDate}</span>
        </div>
        {/* Check-In Window */}
        <div className="flex flex-col min-w-[160px]">
          <span className="text-xs text-gray-500 font-medium">Check-In Window</span>
          <span className="text-base font-semibold text-gray-900">{checkInWindow}</span>
        </div>
        {/* Current Time */}
        <div className="flex flex-col min-w-[100px]">
          <span className="text-xs text-gray-500 font-medium">Current Time</span>
          <span className="text-base font-semibold text-gray-900">{liveTime}</span>
        </div>
      </div>

      {/* Right Section: Connection Status, Profile */}
      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <svg className={`w-5 h-5 ${networkStatus ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M2 12c5-5 13-5 18 0" />
            <path d="M6 16c2.5-2.5 7.5-2.5 10 0" />
            <circle cx="12" cy="20" r="1.5" fill={networkStatus ? '#22c55e' : '#ef4444'} />
          </svg>
          <span className={`text-sm font-semibold ${networkStatus ? 'text-green-600' : 'text-red-600'}`}>{networkStatus ? 'Online' : 'Offline'}</span>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 relative">
          <div className="flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-gray-900 leading-tight">{userName}</span>
            <span className="text-xs text-gray-500 font-medium leading-tight">{programName}</span>
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
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2 animate-fade-in">
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
  );
}