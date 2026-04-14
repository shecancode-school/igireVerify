"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: "home", label: "Dashboard", href: "/dashboard/participant" },
    { icon: "user", label: "Attendance", href: "/dashboard/participant/attendance" },
    { icon: "history", label: "History", href: "/dashboard/participant/history" },
    { icon: "bell", label: "Notifications", href: "/dashboard/participant/notifications" },
    { icon: "help", label: "Help", href: "/dashboard/participant/help" },
  ];

  return (
    <aside
      className="w-full sm:w-20 md:w-24 lg:w-[120px] h-20 sm:h-screen sm:min-h-screen flex flex-row sm:flex-col items-center justify-around sm:justify-start px-2 sm:px-0 sm:py-4 md:py-6 fixed bottom-0 sm:top-0 left-0 z-50 overflow-x-auto sm:overflow-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] sm:shadow-none"
      style={{ background: "#7FAF8C" }}
    >
      
      {/* Logo */}
      <div className="hidden sm:block mb-6 md:mb-8 lg:mb-12">
        <Link href="/home">
          <h1 className="font-black text-sm md:text-base lg:text-xl leading-tight text-center">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-row sm:flex-col gap-1 sm:gap-3 md:gap-4 lg:gap-6 w-full sm:w-auto items-center sm:items-stretch justify-center sm:justify-start px-1 sm:px-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (["History", "Notifications", "Help"].includes(item.label)) {
            return (
              <button
                key={item.href}
                onClick={() => toast.custom((t) => (
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
                className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-2 md:p-3 lg:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 min-w-[56px] sm:min-w-[52px] md:min-w-[60px] lg:min-w-[64px] min-h-[56px] sm:min-h-[52px] md:min-h-[60px] lg:min-h-[64px]
                         ${isActive ? "bg-white/90 shadow-lg text-[#14532D]" : "hover:bg-white/20 text-white"}`}
                title={item.label}
              >
                <NavIcon name={item.icon} active={isActive} />
                <span className="sm:hidden text-[9px] font-medium leading-none whitespace-nowrap mt-1 opacity-80">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-2 md:p-3 lg:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 min-w-[56px] sm:min-w-[52px] md:min-w-[60px] lg:min-w-[64px] min-h-[56px] sm:min-h-[52px] md:min-h-[60px] lg:min-h-[64px]
                         ${isActive ? "bg-white/90 shadow-lg" : "hover:bg-white/20"}`}
              title={item.label}
            >
              <NavIcon name={item.icon} active={isActive} />
              <span className="sm:hidden text-[9px] text-white font-medium leading-none whitespace-nowrap mt-1 opacity-80">{item.label}</span>
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
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      );
    
    case "user":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <path d="M16 11l2 2 4-4"/>
        </svg>
      );
    
    case "history":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    
    case "bell":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      );
    
    case "help":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v4"/>
          <circle cx="12" cy="16" r="0.5" fill={color}/>
        </svg>
      );
    
    default:
      return null;
  }
}