"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
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

  if (loading) return <div className="h-64 sm:h-80 md:h-96 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 animate-pulse flex items-center justify-center">Loading Chart...</div>;

  return (
    <div className="bg-white rounded-[32px] px-6 py-6 sm:px-8 sm:py-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col h-[280px] sm:h-[300px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[14px] sm:text-[16px] font-black text-gray-900 tracking-[0.2em] uppercase">
            Attendance Rate
          </h3>
          <p className="text-[12px] text-gray-500 font-medium mt-1">Current Week Analysis</p>
        </div>
        <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center border border-[#DCFCE7]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
      </div>

      {/* Chart - FLEXIBLE HEIGHT */}
      <div className="relative flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#166534" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              ticks={[0, 25, 50, 75, 100]}
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="rate" 
              name="Current Rate" 
              stroke="#166534" 
              strokeWidth={8} 
              fillOpacity={1} 
              fill="url(#colorRate)" 
              dot={{ r: 6, fill: '#166534', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}