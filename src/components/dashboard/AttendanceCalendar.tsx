"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSocket, joinProgramRoom } from "@/lib/socket";

interface CalendarProps {
  programId: string;
  userId: string;
}

interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "scheduled" | "none";
  checkInTime?: string;
  checkOutTime?: string;
  createdAt?: string;
}

export default function AttendanceCalendar({ programId, userId }: CalendarProps) {
  // Use a stable initial value to prevent hydration mismatch (server date vs client date)
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<AttendanceDay | null>(null);
  const socket = useSocket();

  // Set initial date on client only to avoid hydration errors
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (programId) {
      joinProgramRoom(programId);
    }
  }, [programId]);

  const fetchAttendanceData = async () => {
    if (!currentDate) return;
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await fetch(
        `/api/attendance/user-history?userId=${userId}&programId=${programId}&year=${year}&month=${month}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && programId) {
      fetchAttendanceData();
    }
  }, [userId, programId, currentDate]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchAttendanceData();
    };
    socket.on("attendance-update", handleUpdate);
    return () => {
      socket.off("attendance-update", handleUpdate);
    };
  }, [socket, userId, programId, currentDate]);

  const getDaysInMonth = () => {
    if (!currentDate) return 0;
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    if (!currentDate) return 0;
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    if (!currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getAttendanceStatus = (day: number): any => {
    if (!currentDate) return null;
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    targetDate.setHours(0, 0, 0, 0);

    return attendanceData.find((r: any) => {
      const recordDate = new Date(r.date || r.checkInTime || r.createdAt);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === targetDate.getTime();
    }) || null;
  };

  const deriveStatusFromRecord = (record: any): string => {
    if (!record) return "none";
    if (record.type === "absent" || record.checkInStatus === "absent") return "absent";
    if (record.type === "checkin" || record.type === "completed" || record.type === "manual") return "present";
    return "none";
  };

  const getStatusColor = (derivedStatus: string) => {
    switch (derivedStatus) {
      case "present":
        return "bg-green-50 text-green-600 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
      case "absent":
        return "bg-red-50 text-red-600 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
      default:
        return "bg-white text-gray-300 border-gray-100 hover:border-gray-200";
    }
  };

  const monthName = currentDate ? currentDate.toLocaleString("en-US", { month: "long", year: "numeric" }) : "Loading...";
  const daysInMonth = getDaysInMonth();
  const firstDayOfMonth = getFirstDayOfMonth();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-24">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="w-full bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">Attendance Calendar</h3>
            <p className="text-sm text-gray-500 font-medium">View your daily attendance records for {monthName}</p>
          </div>
        </div>
        <div className="text-gray-400 group-hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[17px] font-extrabold text-slate-800 tracking-tight">Attendance Calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={previousMonth} className="p-1.5 hover:bg-gray-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-black text-slate-900 min-w-[100px] text-center uppercase tracking-tight">
              {monthName}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Body (Centered & Compact) */}
      <div className="max-w-[340px] mx-auto w-full">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div key={day} className="text-center text-[10px] font-black text-slate-900 tracking-[0.1em] opacity-100">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {/* Empty days before month starts */}
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center aspect-square">
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            </div>
          ))}

          {/* Days of the month */}
          {daysArray.map((day) => {
            const record = getAttendanceStatus(day);
            const status = deriveStatusFromRecord(record);

            return (
              <button
                key={day}
                onClick={() => record && setSelectedDate(record)}
                className={`w-9 h-9 flex items-center justify-center rounded-full font-black text-[13px] transition-all border-2 ${
                  status === "present" ? "bg-white text-green-600 border-green-500 shadow-[0_2px_8px_rgba(34,197,94,0.2)]" :
                  status === "absent" ? "bg-white text-red-500 border-red-500 shadow-[0_2px_8px_rgba(239,68,68,0.2)]" :
                  "bg-white text-slate-900 border-slate-50"
                } ${status === "none" ? "cursor-default border-transparent" : "cursor-pointer hover:border-slate-300 active:scale-90"}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="pt-8 border-t border-gray-50">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Status Legend</p>
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-white"></div>
            <span className="text-[12px] font-black text-slate-500 tracking-tight">Present</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-white"></div>
            <span className="text-[12px] font-black text-slate-500 tracking-tight">Absent</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-slate-50 bg-white"></div>
            <span className="text-[12px] font-black text-slate-500 tracking-tight">No Record / Scheduled</span>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDate && (
        <div className="mt-8 p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm relative group animate-in fade-in zoom-in-95 duration-400">
          <div className="flex items-center justify-between mb-5 border-b border-black/5 pb-4">
            <h3 className="font-black text-slate-900 text-[14px] tracking-tight uppercase">
              {(() => {
                const dateVal = selectedDate.date || selectedDate.checkInTime || selectedDate.createdAt;
                return dateVal ? new Date(dateVal).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                }) : "N/A";
              })()}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-slate-300 hover:text-slate-900 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Status</p>
              <p className="text-[14px] font-black text-slate-900 capitalize">{deriveStatusFromRecord(selectedDate)}</p>
            </div>
            {selectedDate.checkInTime && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Check-in</p>
                <p className="text-[14px] font-black text-slate-900">
                  {new Date(selectedDate.checkInTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {selectedDate.checkOutTime && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Check-out</p>
                <p className="text-[14px] font-black text-slate-900">
                  {new Date(selectedDate.checkOutTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

