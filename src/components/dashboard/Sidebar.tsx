"use client";
import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function Sidebar() {
  const pathname = usePathname();
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const name = data.name || data.userName || data.full_name || "User";
          setUserInitial(name.charAt(0).toUpperCase());
        }
      } catch (error) {
        console.error("Sidebar fetch error:", error);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { icon: "home", label: "Dashboard", href: "/dashboard/participant" },
    { icon: "user", label: "Attendance", href: "/dashboard/participant/attendance" },
    { icon: "history", label: "History", href: "/dashboard/participant/history" },
    { icon: "bell", label: "Notifications", href: "/dashboard/participant/notifications" },
    { icon: "help", label: "Help", href: "/dashboard/participant/help" },
  ];

  return (
    <aside
      className="w-full sm:w-20 lg:w-32 flex flex-row sm:flex-col items-center justify-around sm:justify-start px-2 py-4 sm:py-8 fixed bottom-0 sm:top-0 sm:left-0 z-50 bg-[#88A77B] shadow-xl sm:h-screen transition-all duration-300"
    >
      
      {/* Logo Pill */}
      <div className="hidden sm:flex items-center justify-center w-full mb-10 px-2">
        <Link href="/home" className="bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm transition-transform hover:scale-105 flex items-center justify-center whitespace-nowrap">
          <span className="font-black text-xs lg:text-sm" style={{ color: '#F97316' }}>Igire</span>
          <span className="font-black text-xs lg:text-sm" style={{ color: '#14532D' }}>Verify</span>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-row sm:flex-col gap-2 sm:gap-6 w-full sm:w-auto items-center justify-center sm:justify-start px-2">
        {navItems.map((item) => {
          const safePathname = pathname || "";
          const isActive = safePathname === item.href || (item.href !== "/dashboard/participant" && safePathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300
                         ${isActive ? "bg-white shadow-lg scale-110" : "hover:bg-white/10"}`}
              title={item.label}
            >
              <NavIcon name={item.icon} active={isActive} customColor={isActive ? "#14532D" : "#FFFFFF"} />
              <span className="sm:hidden text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">{item.label.substring(0, 4)}</span>
            </Link>
          );

        })}
      </nav>
    </aside>

  );
}




function NavIcon({ name, active, customColor }: { name: string; active: boolean; customColor?: string }) {
  const color = customColor || "#FFFFFF";
  const strokeWidth = active ? "2.5" : "2";

  switch (name) {
    case "home":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <path d="M9 22V12h6v10"/>
        </svg>
      );
    
    case "user":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <polyline points="16 11 18 13 22 9"/>
        </svg>
      );
    
    case "history":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        </svg>
      );
    
    case "bell":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    
    case "help":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-10-9-13a9 9 0 0 1 18 0z" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    
    default:
      return null;
  }
}