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
      className="w-[120px] min-h-screen flex flex-col items-center py-6 fixed left-0 top-0 z-30"
      style={{ background: '#7FAF8C' }}
    >
      <div className="mb-10 px-2">
        <Link href="/home">
          <h1 className="font-black text-lg leading-tight text-center">
            <span style={{ color: '#F97316' }}>Igire</span>
            <span style={{ color: '#14532D' }}>Verify</span>
          </h1>
        </Link>
        <p className="text-[10px] font-semibold text-[#14532D] text-center mt-1 uppercase tracking-wide">
          Staff
        </p>
      </div>

      <nav className="flex-1 flex flex-col gap-5 w-full px-2">
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
              className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all ${
                active ? 'bg-white shadow-md scale-105' : 'hover:bg-white/25'
              }`}
            >
              <Icon
                size={22}
                className={active ? 'text-[#14532D]' : 'text-white'}
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </nav>

      <p className="text-[9px] text-white/80 text-center px-2 leading-tight mt-4">
        Programs managed in Admin
      </p>
    </aside>
  );
}
