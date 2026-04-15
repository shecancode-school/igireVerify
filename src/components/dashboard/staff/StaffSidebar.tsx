'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  LineChart,
  Settings,
  LayoutDashboard,
  UserCheck,
  LogIn,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/staff', tabMatch: null as string | null },
  { name: 'Live', href: '/dashboard/staff?tab=live', tabMatch: 'live' },
  { name: 'Programs', href: '/dashboard/staff?tab=programs', tabMatch: 'programs' },
  { name: 'Reports', href: '/dashboard/staff?tab=reports', tabMatch: 'reports' },
  { name: 'My attendance', href: '/dashboard/staff?tab=attendance', tabMatch: 'attendance' },
  { name: 'Settings', href: '/dashboard/staff?tab=settings', tabMatch: 'settings' },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') ?? null;

  const isActive = (tabMatch: string | null) => {
    if (pathname !== '/dashboard/staff') return false;
    if (tabMatch === null) return !currentTab || currentTab === 'overview';
    return currentTab === tabMatch;
  };

  return (
    <aside
      className="w-full sm:w-20 lg:w-[120px] h-20 sm:h-screen sm:min-h-screen flex flex-row sm:flex-col items-center justify-around sm:justify-start px-1 sm:px-2 lg:px-2 py-2 sm:py-4 lg:py-6 fixed bottom-0 sm:top-0 sm:left-0 z-30 overflow-x-auto sm:overflow-y-auto sm:overflow-x-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] sm:shadow-none"
      style={{ background: '#7FAF8C' }}
    >
      <div className="hidden sm:block mb-6 sm:mb-8 lg:mb-10 px-2 shrink-0">
        <Link href="/home">
          <h1 className="font-black text-sm sm:text-base lg:text-lg leading-tight text-center">
            <span style={{ color: '#F97316' }}>Igire</span>
            <span style={{ color: '#14532D' }}>Verify</span>
          </h1>
        </Link>
        <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-semibold text-[#14532D] text-center mt-1 uppercase tracking-wide hidden lg:block">
          Staff
        </p>
      </div>

      <nav className="flex-1 flex flex-row sm:flex-col gap-1 sm:gap-2 lg:gap-4 w-full sm:w-auto items-center sm:items-center lg:justify-start px-1 sm:px-2 lg:px-2 min-w-0">
        {navigation.map((item) => {
          const active = isActive(item.tabMatch);
          const Icon =
            item.tabMatch === 'live'
              ? UserCheck
              : item.name === 'Programs'
                ? BookOpen
                : item.name === 'Reports'
                  ? LineChart
                  : item.name === 'Settings'
                    ? Settings
                    : item.name === 'My attendance'
                      ? LogIn
                      : LayoutDashboard;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`w-12 sm:w-11 lg:w-12 h-12 sm:h-11 lg:h-12 shrink-0 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all ${
                active ? 'bg-white shadow-md scale-105' : 'hover:bg-white/25'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={2}
                className={`${active ? 'text-[#14532D]' : 'text-white'} sm:w-5 sm:h-5 lg:w-6 lg:h-6`}
              />
            </Link>
          );
        })}
      </nav>

      <p className="hidden lg:block text-[9px] text-white/80 text-center px-2 leading-tight mt-4">
        Programs managed in Admin
      </p>
    </aside>
  );
}
