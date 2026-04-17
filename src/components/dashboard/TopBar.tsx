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
    <div className="w-full bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 md:px-6 py-2 sm:py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
      <div className="flex items-center w-full sm:w-auto">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome, {userName}</h1>
        <span className={`ml-3 px-2 py-1 rounded text-xs font-bold ${networkStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{networkStatus ? 'WiFi Connected' : 'Offline'}</span>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 sm:flex-initial justify-end w-full sm:w-auto relative">
        {/* WiFi Icon Display */}
        <div className="hidden sm:flex items-center gap-1 text-sm font-medium">
          {networkStatus ? (
            <>
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
              </svg>
              <span className="text-green-600">Connected</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
              </svg>
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>

        {/* Profile photo with dropdown */}
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="min-h-[36px] min-w-[36px] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 rounded-full transition-transform hover:scale-105">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="h-9 w-9 rounded-full object-cover border-2 border-[#2E7D32] shadow-sm" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{programName}</p>
              </div>
              <a href="/dashboard/participant/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                📋 My Profile
              </a>
              <a href="/dashboard/participant/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                ⚙️ Settings
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}