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
    <div className="w-64 min-h-screen p-4 flex flex-col" style={{ background: "#7FAF8C" }}>
      <div className="mb-8 pl-4">
        <Link href="/dashboard/admin">
          <h1 className="font-black text-2xl leading-tight">
            <span style={{ color: "#F97316" }}>Igire</span>
            <span style={{ color: "#14532D" }}>Verify</span>
          </h1>
          <p className="text-[#14532D] font-medium text-sm mt-1">Admin Panel</p>
        </Link>
      </div>

      <nav className="space-y-2 flex-1">
        {navigation.map((item) => {
          const itemTab = item.href.includes('?tab=') ? item.href.split('?tab=')[1] : 'overview';
          const isActive = currentTab === itemTab && pathname === '/dashboard/admin';
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                ? 'bg-white shadow-lg text-[#14532D]'
                : 'text-white hover:bg-white/20 hover:text-white'
                }`}
            >
              <Icon className={`mr-3 w-5 h-5`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}