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

    if (loading) return <div className="h-40 animate-pulse rounded-xl bg-gray-200/80 p-4 text-center text-sm text-gray-500 sm:h-44">Loading history…</div>;

    const currentData = activeTab === "week" ? data?.week : data?.month;
    const records = currentData?.records || [];

    const getStatusColor = (status: string) => {
        if (status === 'on-time') return 'text-green-600 bg-green-100';
        if (status === 'late') return 'text-orange-600 bg-orange-100';
        if (status === 'absent') return 'text-red-600 bg-red-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="flex max-h-[min(20rem,42vh)] flex-col rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm sm:max-h-[min(22rem,38vh)] sm:rounded-2xl sm:p-4">

            <div className="mb-3 flex flex-shrink-0 flex-col gap-2 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <h4 className="text-base font-semibold tracking-tight text-gray-900">Attendance logs</h4>
                </div>

                <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 sm:rounded-xl">
                    <button
                        type="button"
                        onClick={() => setActiveTab("week")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-sm
                         ${activeTab === "week"
                                ? "bg-[#111111] text-white shadow-sm"
                                : "text-gray-600 hover:text-gray-900"}`}
                    >
                        This week
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("month")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-sm
                         ${activeTab === "month"
                                ? "bg-[#111111] text-white shadow-sm"
                                : "text-gray-600 hover:text-gray-900"}`}
                    >
                        {new Date().toLocaleString('en-US', { month: 'long' })}
                    </button>
                </div>
            </div>

            <div className="mb-2 grid grid-cols-2 gap-2 sm:mb-3 flex-shrink-0">
                 <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2 sm:px-3">
                     <span className="text-[11px] font-medium text-gray-500 sm:text-xs">Checked in</span>
                     <span className="text-base font-bold tabular-nums text-gray-900 sm:text-lg">{currentData?.checkedIn || 0}</span>
                 </div>
                 <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2 sm:px-3">
                     <span className="text-[11px] font-medium text-gray-500 sm:text-xs">Checked out</span>
                     <span className="text-base font-bold tabular-nums text-gray-900 sm:text-lg">{currentData?.checkedOut || 0}</span>
                 </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="max-h-[min(11rem,28vh)] overflow-y-auto overflow-x-hidden p-2 sm:max-h-[min(12rem,26vh)] sm:p-2.5">
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
                                    <div key={record._id || idx} className="flex items-center justify-between gap-2 rounded-md border border-transparent px-1.5 py-1.5 transition-colors hover:border-gray-100 hover:bg-white sm:px-2 sm:py-2">
                                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8 ${isOut ? 'bg-orange-100' : 'bg-green-100'}`}>
                                                {isOut ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"/>
                                                        <path d="M16 12l-4-4-4 4M12 8v8"/>
                                                    </svg>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-gray-900 sm:text-[13px]">
                                                    {recordDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500 sm:text-xs">
                                                    {isOut ? 'Check-out' : 'Check-in'} · {timeFormat}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px] sm:px-2 ${getStatusColor(record.checkInStatus)}`}>
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