import React from "react";

export default function AttendanceChart() {
  return (
    <div className="h-full bg-white rounded-2xl px-10 py-8 shadow-sm border border-gray-100">
      
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-xl font-black text-black tracking-[0.18em] uppercase">
          Attendance rate
        </h3>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00A651" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 17 9 11 13 14 21 6" />
          <polyline points="3 21 3 17 7 17" />
        </svg>
      </div>

    
      <div className="relative h-64 mt-2">
        
  
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm font-medium text-gray-600">
          <span>Apr</span>
          <span>Mar</span>
          <span>Feb</span>
          <span>Jan</span>
        </div>

  
        <div className="ml-12 h-full relative">
          
    
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-px bg-gray-300" />
            ))}
          </div>

  
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            
          
            <path
              d="M 0 150 Q 50 120, 100 130 T 200 110 T 300 80 T 400 40"
              fill="none"
              stroke="#2E7D32"
              strokeWidth="3"
              strokeLinecap="round"
            />

          
            <path
              d="M 0 160 Q 50 150, 100 155 T 200 145 T 300 140 T 400 135"
              fill="none"
              stroke="#9E9E9E"
              strokeWidth="2"
              strokeLinecap="round"
            />

        
            <circle cx="100" cy="130" r="5" fill="#2E7D32" />
            <circle cx="200" cy="110" r="5" fill="#2E7D32" />
            <circle cx="300" cy="80" r="5" fill="#2E7D32" />
            <circle cx="400" cy="40" r="7" fill="#2E7D32" stroke="white" strokeWidth="2" />

          </svg>

      
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs font-medium text-gray-600">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

        </div>
      </div>

    </div>
  );
}