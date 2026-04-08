"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  bgColor,
  borderColor,
  iconColor
}: StatsCardProps) {
  return (
    <div 
      className="rounded-2xl p-6 border-2 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-sm"
      style={{ 
        backgroundColor: bgColor,
        borderColor: borderColor
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"
          style={{ color: iconColor }}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-4xl md:text-5xl font-black text-[#111111] leading-none">
            {value}
          </p>
        </div>
      </div>
      <p className="text-sm font-bold text-gray-700 tracking-wide uppercase">
        {title}
      </p>
    </div>
  );
}
