'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  UserCheck,
  BookOpen,
  Users,
  LineChart,
  Calendar,
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
    <div className="w-full lg:w-64 h-20 lg:min-h-screen p-2 lg:p-4 flex flex-row lg:flex-col fixed lg:static bottom-0 left-0 z-50 overflow-x-auto lg:overflow-visible shadow-[0_-4px_10px_rgba(0,0,0,0.1)] lg:shadow-none" style={{ background: "#7FAF8C" }}>
      <div className="hidden lg:block mb-8 pl-4">
        <Link href="/dashboard/admin">
          <h1 className="font-black text-2xl leading-tight">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
          <p className="text-[#14532D] font-medium text-sm mt-1">Admin Panel</p>
        </Link>
      </div>

      <nav className="flex-1 flex flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-2 items-center lg:items-stretch h-full lg:h-auto px-2 lg:px-0">
        {navigation.map((item) => {
          const itemTab = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : 'overview';
          const isActive = currentTab === itemTab && pathname === '/dashboard/admin';
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-200 font-medium min-w-[72px] min-h-[64px] lg:min-w-0 lg:min-h-0 ${isActive
                ? 'bg-white shadow-lg text-[#14532D]'
                : 'text-white hover:bg-white/20 hover:text-white'
                }`}
            >
              <Icon className={`lg:mr-3 w-5 h-5 mb-1 lg:mb-0`} />
              <span className="text-[10px] lg:text-base leading-tight lg:leading-normal whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}