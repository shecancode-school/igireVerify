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
        <h2 className="text-xl font-semibold text-[#111111] mb-6">
          Attendance Overview of this month
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 rounded-3xl p-6 animate-pulse">
              <div className="h-14 bg-gray-300 rounded mb-2"></div>
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
    <div>
      <h2 className="text-xl font-semibold text-[#111111] mb-6">
        Attendance Overview of this month
      </h2>

      <div className="grid grid-cols-3 gap-5">

        {/* Days Attended */}
        <div className="bg-[#D1F4DD] rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-5xl font-black mb-1" style={{ color: "#16A34A" }}>
              {String(stats.daysAttended).padStart(2, '0')}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Days Attended</p>
          </div>
        </div>

        {/* Today's Status */}
        <div className="rounded-3xl p-6 flex items-center gap-5 shadow-sm" style={{ backgroundColor: stats.todaysStatus === 'checked-out' ? '#D1F4DD' : stats.todaysStatus === 'checked-in' ? '#FFF4D6' : '#FFE4E4' }}>
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={getStatusColor()} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {stats.todaysStatus === 'checked-out' ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </>
                ) : stats.todaysStatus === 'checked-in' ? (
                  <circle cx="12" cy="12" r="10"/>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </>
                )}
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black mb-1" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Today&apos;s Status</p>
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="bg-[#FFF4D6] rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-5xl font-black mb-1" style={{ color: "#EA580C" }}>
              {String(stats.pendingAlerts).padStart(2, '0')}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Pending Alerts</p>
          </div>
        </div>

      </div>
    </div>
  );
}