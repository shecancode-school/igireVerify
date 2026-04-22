"use client";

import { useEffect, useState } from "react";
import { useSocket, joinProgramRoom } from "@/lib/socket";

interface MissedDaysProps {
  programId: string;
  userId: string;
}

interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "scheduled";
}

export default function AttendanceMissedDays({ programId, userId }: MissedDaysProps) {
  const [loading, setLoading] = useState(true);
  const [missedDays, setMissedDays] = useState(0);
  const [scheduledDays, setScheduledDays] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [showMonthView, setShowMonthView] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (programId) {
      joinProgramRoom(programId);
    }
  }, [programId]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(
        `/api/attendance/user-stats?userId=${userId}&programId=${programId}&t=${Date.now()}`
      );
      if (response.ok) {
        const data = await response.json();
        setMissedDays(data.stats.missedDays || 0);
        setScheduledDays(data.stats.scheduledDays || 0);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendance = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await fetch(
        `/api/attendance/user-history?userId=${userId}&programId=${programId}&year=${year}&month=${month}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch monthly attendance:", error);
    }
  };

  useEffect(() => {
    if (userId && programId) {
      fetchAttendanceData();
    }
  }, [userId, programId]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchAttendanceData();
    };
    socket.on("attendance-update", handleUpdate);
    return () => {
      socket.off("attendance-update", handleUpdate);
    };
  }, [socket, userId, programId]);

  const handleMonthClick = (date: Date) => {
    setSelectedMonth(date);
    fetchMonthlyAttendance(date);
    setShowMonthView(true);
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = selectedMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (showMonthView) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: getFirstDayOfMonth(selectedMonth) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          {Array.from({ length: getDaysInMonth(selectedMonth) }).map((_, i) => {
            const day = i + 1;
            const dateStr = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day)
              .toISOString()
              .split("T")[0];
            const record = attendanceData.find((r) => r.date === dateStr);
            const status = record?.status || "scheduled";

            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold ${
                  status === "present"
                    ? "bg-[#D1F4DD] text-[#16A34A] border border-[#16A34A]"
                    : status === "absent"
                    ? "bg-[#FFE4E4] text-red-600 border border-red-300"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowMonthView(false)}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Overview</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Missed Days Card */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Missed Days</p>
            <p className="text-3xl font-bold text-red-600">{missedDays}</p>
          </div>
        </div>

        {/* Scheduled Days Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Scheduled Days</p>
            <p className="text-3xl font-bold text-blue-600">{scheduledDays}</p>
          </div>
        </div>
      </div>

      {/* Month Buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">View Monthly Details</p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const date = new Date(new Date().getFullYear(), i, 1);
            const monthShort = date.toLocaleString("en-US", { month: "short" });
            return (
              <button
                key={i}
                onClick={() => handleMonthClick(date)}
                className="py-2 px-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-[#D1F4DD] hover:text-[#16A34A] rounded-lg transition-colors border border-gray-200 hover:border-[#16A34A]"
              >
                {monthShort}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

