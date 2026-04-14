"use client";

import { useEffect, useState } from "react";
import { useSocket, joinProgramRoom } from "@/lib/socket";

interface HistoryProps {
  programId: string;
  userId: string;
}

export default function AttendanceHistory({ programId, userId }: HistoryProps) {
    const [activeTab, setActiveTab] = useState<"week" | "month">("week");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const socket = useSocket();

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/attendance/user-history?userId=${userId}&programId=${programId}&t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("History fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && programId) {
            joinProgramRoom(programId);
            fetchHistory();
        }
    }, [userId, programId]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (updateData: any) => {
            if (updateData.userId === userId || updateData.programId === programId) {
                fetchHistory();
            }
        };
        socket.on('attendance-update', handleUpdate);
        return () => { socket.off('attendance-update', handleUpdate); };
    }, [socket, userId, programId]);

    if (loading) return <div className="bg-[#E5E5E5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 animate-pulse text-center h-64 sm:h-80">Loading History...</div>;

    const currentData = activeTab === "week" ? data?.week : data?.month;
    const records = currentData?.records || [];

    const getStatusColor = (status: string) => {
        if (status === 'on-time') return 'text-green-600 bg-green-100';
        if (status === 'late') return 'text-orange-600 bg-orange-100';
        if (status === 'absent') return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="bg-[#E5E5E5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 shadow-sm flex flex-col h-96 sm:h-[500px]">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 flex-shrink-0 gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-9 h-8 sm:h-9 bg-[#16A34A] rounded-full flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-[#111111]">Attendance Logs</h4>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 sm:gap-2 bg-white rounded-lg sm:rounded-xl p-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab("week")}
                        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200
                         ${activeTab === "week"
                                ? "bg-[#111111] text-white"
                                : "bg-transparent text-gray-500 hover:text-gray-800"}`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setActiveTab("month")}
                        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200
                         ${activeTab === "month"
                                ? "bg-[#111111] text-white"
                                : "bg-transparent text-gray-500 hover:text-gray-800"}`}
                    >
                        This Month
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-5 flex-shrink-0">
                 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between border border-gray-100">
                     <span className="text-gray-500 font-semibold text-xs sm:text-sm">Checked In</span>
                     <span className="text-lg sm:text-xl font-black text-gray-800">{currentData?.checkedIn || 0}</span>
                 </div>
                 <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between border border-gray-100">
                     <span className="text-gray-500 font-semibold text-xs sm:text-sm">Checked Out</span>
                     <span className="text-lg sm:text-xl font-black text-gray-800">{currentData?.checkedOut || 0}</span>
                 </div>
            </div>

            {/* Scrollable Records List */}
            <div className="bg-white rounded-xl sm:rounded-2xl flex-1 overflow-hidden flex flex-col border border-gray-100">
                <div className="overflow-y-auto flex-1 p-2 sm:p-3">
                    {records.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <p className="font-medium text-xs sm:text-sm">No logs found for this period</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {records.map((record: any, idx: number) => {
                                const recordDate = new Date(record.createdAt || record.date || record.checkInTime);
                                const isOut = record.type === 'completed' || !!record.checkOutTime;
                                const timeFormat = recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                
                                return (
                                    <div key={record._id || idx} className="p-2 sm:p-3 hover:bg-gray-50 flex items-center justify-between transition-colors rounded-lg">
                                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                            <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-orange-100' : 'bg-green-100'}`}>
                                                {isOut ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <path d="M16 12l-4-4-4 4M12 8v8"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                                                    {recordDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate">
                                                    {isOut ? 'Check-Out' : 'Check-In'} at {timeFormat}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className={`text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md uppercase tracking-wider ${getStatusColor(record.checkInStatus)}`}>
                                                {record.checkInStatus || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}