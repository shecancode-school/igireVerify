"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

export default function AttendanceChart() {
  // Generate dynamic data for the current week using Recharts
  const data = [
    { name: 'Mon', rate: 75, previous: 60 },
    { name: 'Tue', rate: 80, previous: 65 },
    { name: 'Wed', rate: 65, previous: 70 },
    { name: 'Thu', rate: 90, previous: 75 },
    { name: 'Fri', rate: 85, previous: 80 },
    { name: 'Sat', rate: 0, previous: 0 },
    { name: 'Sun', rate: 0, previous: 0 },
  ];
  return (
    <div className="bg-white rounded-3xl px-10 py-8 shadow-sm border border-gray-100 h-full flex flex-col">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-black tracking-[0.2em] uppercase">
            Attendance Rate
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Current Week Analysis</p>
        </div>
        <div className="p-2 bg-green-50 rounded-xl">
          <Activity className="w-6 h-6 text-[#2E7D32]" />
        </div>
      </div>

      {/* Chart - FLEXIBLE HEIGHT */}
      <div className="relative flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} 
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