export default function AttendanceStats({
  daysAttended = 15,
  pendingAlerts = 2,
  missedDays = 1
}: {
  daysAttended?: number;
  pendingAlerts?: number;
  missedDays?: number;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-[#111111] mb-6">
        Attendance Overview of this month
      </h2>

      <div className="grid grid-cols-3 gap-5">
        
        {/* Days Attended */}
        <div className="bg-[#D1F4DD] rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-5xl font-black mb-1" style={{ color: "#16A34A" }}>
              {String(daysAttended).padStart(2, '0')}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Days Attended</p>
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="bg-[#FFF4D6] rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-5xl font-black mb-1" style={{ color: "#EA580C" }}>
              {String(pendingAlerts).padStart(2, '0')}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Pending Alerts</p>
          </div>
        </div>

        {/* Missed Days */}
        <div className="bg-[#FFE4E4] rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-5xl font-black mb-1" style={{ color: "#DC2626" }}>
              {String(missedDays).padStart(2, '0')}
            </p>
            <p className="text-sm font-semibold text-[#111111]">Missed days</p>
          </div>
        </div>

      </div>
    </div>
  );
}