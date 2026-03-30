"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      className="w-[120px] min-h-screen flex flex-col items-center py-6 fixed left-0 top-0"
      style={{ background: "#7FAF8C" }}
    >
      
      {/* Logo */}
      <div className="mb-12">
        <Link href="/home">
          <h1 className="font-black text-xl leading-tight text-center">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-200
                         ${isActive ? "bg-white/90 shadow-lg" : "hover:bg-white/20"}`}
              title={item.label}
            >
              <NavIcon name={item.icon} active={isActive} />
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}




function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = "#FFFFFF";
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