'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  LineChart,
  Settings,
  LayoutDashboard,
  UserCheck,
  LogIn,
  Bell,
  HelpCircle,
  History,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/staff', tabMatch: null as string | null },
  { name: 'Live', href: '/dashboard/staff?tab=live', tabMatch: 'live' },
  { name: 'Programs', href: '/dashboard/staff?tab=programs', tabMatch: 'programs' },
  { name: 'Manual', href: '/dashboard/staff?tab=manual', tabMatch: 'manual' },
  { name: 'Reports', href: '/dashboard/staff?tab=reports', tabMatch: 'reports' },
  { name: 'My attendance', href: '/dashboard/staff?tab=attendance', tabMatch: 'attendance' },
  { name: 'Notifications', href: '/dashboard/staff?tab=notifications', tabMatch: 'notifications' },
  { name: 'History', href: '/dashboard/staff?tab=history', tabMatch: 'history' },
  { name: 'Help', href: '/dashboard/staff?tab=help', tabMatch: 'help' },
  { name: 'Settings', href: '/dashboard/staff?tab=settings', tabMatch: 'settings' },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') ?? null;
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  const isAdmin = ['admin', 'super-admin'].includes(userRole);

  const isActive = (tabMatch: string | null) => {
    if (pathname !== '/dashboard/staff') return false;
    if (tabMatch === null) return !currentTab || currentTab === 'overview';
    return currentTab === tabMatch;
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.name === 'Reports' && !isAdmin) return false;
    return true;
  });

  return (
    <aside
      className="w-full sm:w-20 lg:w-32 flex flex-row sm:flex-col items-center justify-around sm:justify-start px-2 py-4 sm:py-8 fixed bottom-0 sm:top-0 sm:left-0 z-50 bg-[#88A77B] shadow-xl sm:h-screen"
    >
      {/* Logo Pill */}
      <div className="hidden sm:flex items-center justify-center w-full mb-10 px-2">
        <Link href="/home" className="bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm transition-transform hover:scale-105 flex items-center justify-center whitespace-nowrap">
          <span className="font-black text-xs lg:text-sm" style={{ color: '#F97316' }}>Igire</span>
          <span className="font-black text-xs lg:text-sm" style={{ color: '#14532D' }}>Verify</span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-row sm:flex-col gap-2 sm:gap-4 w-full sm:w-auto items-center justify-center sm:justify-start px-1 min-w-0">
        {filteredNavigation.map((item) => {
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
                      : item.name === 'Notifications'
                        ? Bell
                        : item.name === 'History'
                          ? History
                          : item.name === 'Help'
                            ? HelpCircle
                            : LayoutDashboard;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                active ? 'bg-white shadow-lg scale-110' : 'hover:bg-white/10'
              }`}
            >
              <Icon
                className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300 ${active ? 'text-[#14532D]' : 'text-white'}`}
                strokeWidth={active ? 2.5 : 1.5}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
