'use client';

import { useEffect, useState } from 'react';
import { useSocket, joinProgramRoom } from '@/lib/socket';
import { AttendanceUpdatePayload } from '@/lib/socket-server';

interface AttendanceStatsData {
  daysAttended: number;
  pendingAlerts: number;
  missedDays: number;
  todaysStatus?: 'not-checked-in' | 'checked-in' | 'checked-out';
}

interface AttendanceStatsProps {
  programId: string;
  userId: string;
}

export default function AttendanceStats({ programId, userId }: AttendanceStatsProps) {
  const [stats, setStats] = useState<AttendanceStatsData>({
    daysAttended: 0,
    pendingAlerts: 0,
    missedDays: 0,
    todaysStatus: 'not-checked-in'
  });
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  useEffect(() => {
    if (programId) {
      joinProgramRoom(programId);
    }
  }, [programId]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/attendance/user-stats?userId=${userId}&programId=${programId}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch attendance stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && programId) {
      fetchStats();
    }
  }, [userId, programId]);

  useEffect(() => {
    if (!socket) return;

    const handleAttendanceUpdate = (data: AttendanceUpdatePayload) => {
      // Refresh stats when there's an attendance update
      if (data.userId === userId || data.programId === programId) {
        fetch(`/api/attendance/user-stats?userId=${userId}&programId=${programId}&t=${Date.now()}`)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data) setStats(data.stats);
          })
          .catch(error => console.error('Failed to refresh stats:', error));
      }
    };

    socket.on('attendance-update', handleAttendanceUpdate);

    return () => {
      socket.off('attendance-update', handleAttendanceUpdate);
    };
  }, [socket, userId, programId]);

  if (loading) {
    return (
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[#111111] mb-4 sm:mb-6">
          Attendance Overview of this month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-2xl sm:rounded-3xl p-3 sm:p-4 animate-pulse">
              <div className="h-10 sm:h-12 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (stats.todaysStatus) {
      case 'checked-out': return '#16A34A'; // green
      case 'checked-in': return '#EA580C'; // orange
      default: return '#DC2626'; // red
    }
  };

  const getStatusText = () => {
    switch (stats.todaysStatus) {
      case 'checked-out': return 'Checked Out Today';
      case 'checked-in': return 'Checked In Today';
      default: return 'Not Checked In';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
          Attendance Overview
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 mt-1">Current Month Progress</span>
        </h2>
        <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Live Metrics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Days Attended */}
        <div className="bg-[#E6F4EA] rounded-3xl p-5 border border-[#D1FAE5] shadow-sm group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#16A34A] block leading-none">
                {String(stats.daysAttended).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black uppercase text-[#16A34A]/60 tracking-widest">Days</span>
            </div>
          </div>
          <p className="text-sm font-black text-slate-700">Days Attended</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Successful check-ins recorded</p>
        </div>

        {/* Pending Alerts */}
        <div className="bg-[#FEF3C7] rounded-3xl p-5 border border-[#FDE68A] shadow-sm group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C47D0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="17" cy="12" r="1.5"></circle>
                <circle cx="7" cy="12" r="1.5"></circle>
              </svg>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#C47D0E] block leading-none">
                {String(stats.pendingAlerts || 0).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black uppercase text-[#C47D0E]/60 tracking-widest">Alerts</span>
            </div>
          </div>
          <p className="text-sm font-black text-slate-700">Pending Alerts</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Actions requiring your attention</p>
        </div>

        {/* Missed Days */}
        <div className="bg-[#FEE2E2] rounded-3xl p-5 border border-[#FECACA] shadow-sm group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-[#DC2626] block leading-none">
                {String(stats.missedDays).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black uppercase text-[#DC2626]/60 tracking-widest">Sessions</span>
            </div>
          </div>
          <p className="text-sm font-black text-slate-700">Missed Sessions</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Absent or unverified sessions</p>
        </div>

      </div>
    </div>
  );
}