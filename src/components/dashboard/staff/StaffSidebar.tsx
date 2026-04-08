'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  UserCheck,
  BookOpen,
  LineChart,
  Settings,
  LayoutDashboard
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
  { name: 'Live Attendance', href: '/dashboard/staff?tab=live', icon: UserCheck },
  { name: 'Programs', href: '/dashboard/staff?tab=programs', icon: BookOpen },
  { name: 'Reports', href: '/dashboard/staff?tab=reports', icon: LineChart },
  { name: 'Settings', href: '/dashboard/staff?tab=settings', icon: Settings },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  
  return (
    <div className="w-[160px] md:w-[240px] bg-[#7FAF8C] fixed left-0 top-0 h-screen flex flex-col items-center py-8 z-30 shadow-xl transition-all duration-300">
      <div className="mb-12 px-4 text-center">
        <h1 className="font-black text-xl md:text-2xl text-white leading-tight">
          Igire<span className="text-[#C47D0E]">Verify</span>
        </h1>
        <p className="text-[#14532D] font-bold text-xs mt-1 bg-white/30 rounded-full px-2 py-0.5">Staff Panel</p>
      </div>

      <nav className="flex-1 flex flex-col gap-6 md:gap-8 w-full px-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative w-full h-12 md:h-14 rounded-2xl flex items-center justify-center md:justify-start md:px-6 transition-all duration-300 ${
                isActive 
                ? 'bg-white shadow-lg scale-105' 
                : 'hover:bg-white/20'
              }`}
            >
              <Icon 
                size={28} 
                className={`transition-colors duration-300 ${isActive ? 'text-[#14532D]' : 'text-white'}`} 
              />
              <span className={`hidden md:block ml-4 font-bold text-sm transition-colors duration-300 ${isActive ? 'text-[#14532D]' : 'text-white'}`}>
                {item.name}
              </span>
              
              {!isActive && (
                <span className="md:hidden absolute left-20 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 w-full">
        <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Version</p>
          <p className="text-white text-xs font-black">v2.4.0-Premium</p>
        </div>
      </div>
    </div>
  );
}
