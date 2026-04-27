'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Users,
  LineChart,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',  href: '/dashboard/admin?tab=overview',    icon: LayoutDashboard },
  { name: 'Attendance', href: '/dashboard/admin?tab=attendance',  icon: UserCheck },
  { name: 'Programs',   href: '/dashboard/admin?tab=programs',    icon: BookOpen },
  { name: 'Users',      href: '/dashboard/admin?tab=users',       icon: Users },
  { name: 'Reports',    href: '/dashboard/admin?tab=reports',     icon: LineChart },
  { name: 'Settings',   href: '/dashboard/admin?tab=settings',   icon: Settings },
];

export default function AdminSidebar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const currentTab   = searchParams?.get('tab') || 'overview';

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden sm:flex flex-col items-center flex-shrink-0 w-24 h-screen sticky top-0 z-50 py-6 gap-2"
        style={{ background: '#7FAF8C' }}
      >
        {/* Logo */}
        <Link href="/dashboard/admin?tab=overview" className="mb-4 text-center leading-none px-2">
          <span className="font-black text-sm" style={{ color: '#F97316' }}>Igire</span>
          <span className="font-black text-sm" style={{ color: '#14532D' }}>Verify</span>
        </Link>

        {/* Nav icons */}
        <nav className="flex flex-col items-center gap-2 w-full px-3 flex-1">
          {navigation.map((item) => {
            const itemTab = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : 'overview';
            const isActive = currentTab === itemTab && pathname === '/dashboard/admin';
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white shadow-md'
                    : 'hover:bg-white/20'
                }`}
              >
                <Icon
                  className="w-6 h-6 transition-colors duration-200"
                  style={{ color: isActive ? '#16A34A' : 'white' }}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {/* Tooltip */}
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.12)]"
        style={{ background: '#7FAF8C' }}
      >
        {navigation.map((item) => {
          const itemTab  = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : 'overview';
          const isActive = currentTab === itemTab && pathname === '/dashboard/admin';
          const Icon     = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] rounded-xl transition-all ${
                isActive ? 'bg-white/20' : ''
              }`}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: 'white' }}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[9px] font-semibold text-white leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}