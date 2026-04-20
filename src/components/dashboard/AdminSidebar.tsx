'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  UserCheck,
  BookOpen,
  Users,
  LineChart,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: BarChart3 },
  { name: 'Attendance', href: '/dashboard/admin?tab=attendance', icon: UserCheck },
  { name: 'Programs', href: '/dashboard/admin?tab=programs', icon: BookOpen },
  { name: 'Users', href: '/dashboard/admin?tab=users', icon: Users },
  { name: 'Reports', href: '/dashboard/admin?tab=reports', icon: LineChart },
  { name: 'Settings', href: '/dashboard/admin?tab=settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'overview';

  return (
    <div
      className="w-full sm:w-20 lg:w-72 flex-shrink-0 h-20 sm:h-screen sm:min-h-screen p-2 sm:p-3 lg:p-4 flex flex-row sm:flex-col fixed sm:static bottom-0 left-0 z-50 overflow-x-auto sm:overflow-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] sm:shadow-none"
      style={{ background: "#7FAF8C" }}
    >
      <div className="hidden sm:block lg:block mb-4 sm:mb-6 lg:mb-8 px-2 lg:pl-4 w-full">
        <Link href="/dashboard/admin">
          <h1 className="font-black text-sm sm:text-lg lg:text-2xl leading-tight text-center sm:text-left">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
          <p className="text-[#14532D] font-medium text-xs sm:text-[10px] lg:text-sm mt-1 text-center sm:text-left hidden lg:block">Admin Panel</p>
        </Link>
      </div>

      <nav className="flex-1 flex flex-row sm:flex-col gap-1 sm:gap-1 lg:gap-2 items-center sm:items-stretch justify-start h-full sm:h-auto px-1 sm:px-2 lg:px-0 w-full">
        {navigation.map((item) => {
          const itemTab = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : 'overview';
          const isActive = currentTab === itemTab && pathname === '/dashboard/admin';
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start px-2 sm:px-3 lg:px-4 py-2 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium min-w-[60px] sm:min-w-[50px] lg:min-w-0 min-h-[60px] sm:min-h-[44px] lg:min-h-0 ${isActive
                ? 'bg-white shadow-lg text-[#14532D]'
                : 'text-white hover:bg-white/20 hover:text-white'
                }`}
              title={item.name}
            >
              <Icon className={`sm:mr-2 lg:mr-3 w-4 sm:w-4 lg:w-5 h-4 sm:h-4 lg:h-5 mb-1 sm:mb-0 lg:mb-0`} />
              <span className="text-[9px] sm:text-[10px] lg:text-base leading-tight sm:leading-tight lg:leading-normal whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}