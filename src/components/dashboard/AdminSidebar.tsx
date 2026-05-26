'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Users,
  LineChart,
  Settings,
  Bell,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard',  href: '/dashboard/admin?tab=overview',    icon: LayoutDashboard },
  { name: 'Attendance', href: '/dashboard/admin?tab=attendance',  icon: UserCheck },
  { name: 'Programs',   href: '/dashboard/admin?tab=programs',    icon: BookOpen },
  { name: 'Users',      href: '/dashboard/admin?tab=users',       icon: Users },
  { name: 'Reports',    href: '/dashboard/admin?tab=reports',     icon: LineChart },
  { name: 'Communications', href: '/dashboard/admin?tab=communications', icon: Bell },
  { name: 'Settings',   href: '/dashboard/admin?tab=settings',   icon: Settings },
];

export default function AdminSidebar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const currentTab   = searchParams?.get('tab') || 'overview';
  const [userInitial, setUserInitial] = useState('A');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.name) setUserInitial(data.name.charAt(0).toUpperCase());
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden sm:flex flex-col items-center flex-shrink-0 w-32 h-screen sticky top-0 z-50 py-8 gap-4 shadow-lg transition-all duration-300"
        style={{ background: '#88A77B' }}
      >
        {/* Logo Pill */}
        <div className="flex items-center justify-center w-full mb-8">
          <Link href="/dashboard/admin?tab=overview" className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm transition-transform hover:scale-105 whitespace-nowrap">
            <span className="font-black text-lg" style={{ color: '#F97316' }}>Igire</span>
            <span className="font-black text-lg" style={{ color: '#14532D' }}>Verify</span>
          </Link>
        </div>

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
                className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white shadow-xl scale-110'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon
                  className="w-6 h-6 transition-colors duration-300"
                  style={{ color: isActive ? '#14532D' : 'white' }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* Tooltip */}
                <span className="pointer-events-none absolute left-full ml-4 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-10px] group-hover:translate-x-0 shadow-2xl z-50">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 h-16 shadow-[0_-2px_15px_rgba(0,0,0,0.15)]"
        style={{ background: '#88A77B' }}
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