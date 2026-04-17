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
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 sm:flex-initial justify-end w-full sm:w-auto">
        {/* Profile photo */}
        <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="min-h-[36px] min-w-[36px] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 rounded-full transition-transform hover:scale-105">
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}