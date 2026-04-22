"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function TopBar({ 
  userName: initialUserName,
  name: initialName,
  programName: initialProgramName,
  sessionDate = "Wednesday, April 22, 2026",
  checkInWindow = "08:00 - 08:30",
  currentTime = "08:52 AM"
}: {
  userName?: string;
  name?: string;
  programName?: string;
  sessionDate?: string;
  checkInWindow?: string;
  currentTime?: string;
}) {
  const [userName, setUserName] = useState(initialUserName || initialName || "");
  const [programName, setProgramName] = useState(initialProgramName || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [liveDate, setLiveDate] = useState(sessionDate);
  const [liveTime, setLiveTime] = useState(currentTime);
  const [networkStatus, setNetworkStatus] = useState<boolean>(true);

  useEffect(() => {
    const nameToUse = initialUserName || initialName;
    if (nameToUse) setUserName(nameToUse);
    if (initialProgramName) setProgramName(initialProgramName);
  }, [initialUserName, initialName, initialProgramName]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNetworkStatus(navigator.onLine);
      const handleOnline = () => setNetworkStatus(true);
      const handleOffline = () => setNetworkStatus(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      const updateTime = () => {
        const now = new Date();
        setLiveDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        setLiveTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);

      const fetchUser = async () => {
        try {
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const data = await response.json();
            const foundName = data.name || data.userName || data.full_name || initialUserName || initialName || "User";
            setUserName(foundName);
            if (data.programName) setProgramName(data.programName);
            if (data.profilePhotoUrl) setProfilePhotoUrl(data.profilePhotoUrl);
          }
        } catch (error) {
          console.error("TopBar fetch error:", error);
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
    }
  }, [initialUserName, initialName, initialProgramName]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    window.location.href = "/home";
  };

  return (
    <header className="relative z-[60] w-full shrink-0 border-b border-gray-100 bg-white px-4 sm:px-12 py-5 shadow-sm min-h-[90px] flex items-center">
      <div className="flex items-center justify-between gap-6 w-full">
        
        {/* Left Section: Information Labels */}
        <div className="flex items-center gap-x-6 min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm text-gray-900">{liveDate}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="h-6 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sm font-medium text-gray-900">Check-In Window:</span>
              <span className="text-sm text-gray-900">{checkInWindow}</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="h-6 w-[1px] bg-gray-300" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sm font-medium text-gray-900">Current Time:</span>
              <span className="text-sm text-gray-900">{liveTime}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Status & Profile */}
        <div className="flex items-center gap-8 shrink-0">
          
          {/* WiFi Indicator */}
          <div className="flex items-center gap-2">
            <Wifi className={`h-5 w-5 ${networkStatus ? "text-[#22c55e]" : "text-red-500"}`} strokeWidth={2.5} />
            <span className="text-sm font-bold text-gray-900">Online</span>
          </div>

          {/* Identity & Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-4 text-left group"
            >
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 leading-tight group-hover:text-[#22c55e] transition-colors">
                  {userName || "User"}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  {programName || "Program"}
                </span>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative transition-all group-hover:border-[#22c55e]">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
            </button>


            {/* Premium Dropdown with Profile Management */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-[65]" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full z-[70] mt-5 w-64 rounded-[32px] border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="px-6 py-5 border-b border-gray-50">
                    <p className="text-[15px] font-black text-gray-900 leading-none mb-1.5">{userName}</p>
                    <p className="text-[11px] text-[#22c55e] font-black uppercase tracking-widest">{programName || "Participant"}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <a href="/dashboard/participant/profile" className="flex items-center gap-4 px-5 py-4 text-[14px] font-bold text-gray-600 hover:bg-gray-50 rounded-[20px] transition-colors">
                      <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                      Profile Management
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-5 py-4 text-[14px] font-black text-red-600 hover:bg-red-50 rounded-[20px] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}