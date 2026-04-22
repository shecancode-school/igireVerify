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
      className="w-full sm:w-20 md:w-24 lg:w-[120px] flex-shrink-0 h-20 sm:h-screen sm:min-h-screen flex flex-row sm:flex-col items-center justify-around sm:justify-start px-2 sm:px-0 fixed bottom-0 sm:top-0 left-0 z-50 overflow-x-auto sm:overflow-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] sm:shadow-none transition-all duration-300"
      style={{ background: "#88A77B" }}
    >
      
      {/* Logo Area */}
      <div className="hidden sm:flex items-center justify-center w-full py-8 mb-4 border-b border-white/10 overflow-hidden">
        <Link href="/home">
          <h1 className="font-black text-[18px] leading-none tracking-tighter whitespace-nowrap px-4 py-2 bg-white/10 rounded-full">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-row sm:flex-col gap-4 sm:gap-8 w-full sm:w-auto items-center sm:items-stretch justify-center sm:justify-start px-1 sm:px-2">
        {navItems.map((item) => {
          const safePathname = pathname || "";
          const isActive = safePathname === item.href || (item.href !== "/dashboard/participant" && safePathname.startsWith(item.href));
          
          if (["History", "Notifications", "Help"].includes(item.label)) {
            return (
              <button
                key={item.href}
                onClick={() => toast.custom(() => (
                  <div className="bg-white border border-[#7FAF8C]/30 rounded-xl shadow-xl p-4 flex gap-4 w-[min(360px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] items-start relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F97316]"></div>
                    <div className="bg-[#7FAF8C]/20 p-2 rounded-full shrink-0 mt-0.5">
                      <NavIcon name={item.icon} active={true} customColor="#14532D" />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      <h3 className="font-extrabold text-[#14532D] text-[15px] tracking-tight">{item.label} Feature Coming Soon</h3>
                      <p className="text-slate-600 text-[13px] font-medium leading-relaxed">We are currently building an amazing experience for this section. Please check back soon!</p>
                    </div>
                  </div>
                ))}
                className={`flex flex-col items-center justify-center p-2 rounded-xl sm:rounded-2xl transition-all duration-200 min-w-[56px] sm:min-w-fit md:min-w-fit min-h-[56px] sm:min-h-fit
                         ${isActive ? "bg-white shadow-md text-[#14532D]" : "hover:bg-white/10 text-white"}`}
                title={item.label}
              >
                <div className="">
                  <NavIcon name={item.icon} active={isActive} />
                </div>
                <span className="sm:hidden text-[9px] font-medium leading-none whitespace-nowrap mt-1 opacity-80">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl sm:rounded-2xl transition-all duration-200 min-w-[56px] sm:min-w-fit md:min-w-fit min-h-[56px] sm:min-h-fit
                         ${isActive ? "bg-white shadow-md" : "hover:bg-white/10"}`}
              title={item.label}
            >
              <div className="">
                <NavIcon name={item.icon} active={isActive} />
              </div>
              <span className="sm:hidden text-[9px] text-white font-medium leading-none whitespace-nowrap mt-1 opacity-80">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Spacer */}
      <div className="hidden sm:flex items-center justify-center w-full pb-10 mt-auto">
      </div>

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