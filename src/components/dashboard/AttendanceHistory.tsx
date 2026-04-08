"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket";

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
            const res = await fetch(`/api/attendance/user-history?userId=${userId}&programId=${programId}`);
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
        if (userId && programId) fetchHistory();
    }, [userId, programId]);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => fetchHistory();
        socket.on('attendance-update', handleUpdate);
        return () => { socket.off('attendance-update', handleUpdate); };
    }, [socket]);

    if (loading) return <div className="bg-[#E5E5E5] rounded-3xl p-7 animate-pulse text-center">Loading History...</div>;

    const currentData = activeTab === "week" ? data?.week : data?.month;

    const aiVerifiedCount = currentData?.uniqueDays || 0;
    const aiPercentage = currentData?.checkedIn > 0 ? Math.round((aiVerifiedCount / currentData.checkedIn) * 100) : 0;
    const overallPercentage = currentData?.uniqueDays > 0 ? 100 : 0; // Simplified


    return (
        <div className="bg-[#E5E5E5] rounded-3xl p-7 shadow-sm">

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#16A34A] rounded-full flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-[#111111]">Attendance History</h4>
                </div>

                {/* Three dots */}
                <button className="p-2 hover:bg-gray-300 rounded-lg transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="5" r="2" fill="#666" />
                        <circle cx="12" cy="12" r="2" fill="#666" />
                        <circle cx="12" cy="19" r="2" fill="#666" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2">
                <button
                    onClick={() => setActiveTab("week")}
                    className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                     ${activeTab === "week"
                            ? "bg-[#111111] text-white"
                            : "bg-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    This Week
                </button>
                <button
                    onClick={() => setActiveTab("month")}
                    className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                     ${activeTab === "month"
                            ? "bg-[#111111] text-white"
                            : "bg-transparent text-gray-500 hover:text-gray-700"}`}
                >
                    This Month
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-6 text-sm">

                    <div className="space-y-2">
                        <p className="font-semibold text-[#111111]">
                            {currentData?.checkedIn || 0} Checked-In
                        </p>
                        <p className="font-semibold text-[#111111]">
                            {currentData?.checkedOut || 0} Checked-Out
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="font-semibold text-[#111111]">{overallPercentage} %</p>
                        <p className="text-[#111111]">AI Verified</p>
                    </div>

                    <div className="space-y-2 flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <p className="font-semibold text-[#111111]">{currentData?.onTimeStatus || "N/A"}</p>
                        </div>
                        <p className="font-semibold text-[#111111]">{aiPercentage} %</p>
                    </div>

                </div>
            </div>

        </div>
    );
}