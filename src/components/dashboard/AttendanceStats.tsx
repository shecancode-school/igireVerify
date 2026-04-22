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
      <h2 className="text-xl font-black text-[#111111] mb-6">
        Attendance Overview of this month
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Days Attended */}
        <div className="bg-[#E6F4EA] rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all border border-[#D1FAE5]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-5xl font-black text-[#16A34A]">
              {String(stats.daysAttended).padStart(2, '0')}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-700 ml-1">Days Attended</p>
        </div>

        {/* Pending Alerts */}
        <div className="bg-[#FEF3C7] rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all border border-[#FDE68A]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C47D0E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="17" cy="12" r="1.5"></circle>
                <circle cx="7" cy="12" r="1.5"></circle>
              </svg>
            </div>
            <span className="text-5xl font-black text-[#C47D0E]">
              {String(stats.pendingAlerts || 0).padStart(2, '0')}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-700 ml-1">Pending Alerts</p>
        </div>

        {/* Missed Days */}
        <div className="bg-[#FEE2E2] rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all border border-[#FECACA]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <span className="text-5xl font-black text-[#DC2626]">
              {String(stats.missedDays).padStart(2, '0')}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-700 ml-1">Missed days</p>
        </div>

      </div>
    </div>
  );
}