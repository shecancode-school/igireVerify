"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import { useSocket } from '@/lib/socket';

interface ChartProps {
  programId: string;
  userId: string;
}

export default function AttendanceChart({ programId, userId }: ChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/attendance/user-chart?userId=${userId}&programId=${programId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Chart fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && programId) fetchData();
  }, [userId, programId]);

  // Handle real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchData();
    socket.on('attendance-update', handleUpdate);
    return () => { socket.off('attendance-update', handleUpdate); };
  }, [socket]);

  if (loading) return <div className="h-64 sm:h-80 md:h-96 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 animate-pulse flex items-center justify-center">Loading Chart...</div>;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl px-4 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 shadow-sm border border-gray-100 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-black text-black tracking-[0.2em] uppercase">
            Attendance Rate
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Current Week Analysis</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg sm:rounded-xl">
          <Activity className="w-5 sm:w-6 h-5 sm:h-6 text-[#2E7D32]" />
        </div>
      </div>

      {/* Chart - FLEXIBLE HEIGHT */}
      <div className="relative flex-1 min-h-[200px] sm:min-h-[220px] md:min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
              dy={8}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ stroke: '#2E7D32', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            {/* Previous month / period baseline */}
            <Line 
              type="monotone" 
              dataKey="previous" 
              name="Previous Avg" 
              stroke="#9E9E9E" 
              strokeWidth={2} 
              dot={false}
              activeDot={false}
            />
            {/* Current period data */}
            <Line 
              type="monotone" 
              dataKey="rate" 
              name="Current Rate" 
              stroke="#2E7D32" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#2E7D32', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#2E7D32', stroke: 'white', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}