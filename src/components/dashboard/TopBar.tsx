

export default function TopBar({ 
  userName = "Alice Uwera",
  programName = "Web fundamentals",
  isOnline = true,
  sessionDate = "Today: Friday, 6 Feb 2026",
  checkInWindow = "08:00 - 08:30",
  currentTime = "08:52"
}: {
  userName?: string;
  programName?: string;
  isOnline?: boolean;
  sessionDate?: string;
  checkInWindow?: string;
  currentTime?: string;
}) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-12 py-3 gap-6">
        {/* Left: date / window / time */}
        <div className="flex items-center gap-4 text-xs md:text-sm whitespace-nowrap">
          <span className="font-medium text-gray-700 whitespace-nowrap">
            {sessionDate}
          </span>

          <span className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-600">Check-In Window:</span>
            <span className="font-semibold text-gray-900">
              {checkInWindow}
            </span>
          </div>

          <span className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-600">Current Time:</span>
            <span className="font-semibold text-[#2E7D32]">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Right: online + profile */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2E7D32"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" fill="#2E7D32" />
            </svg>
            <span className="text-sm font-semibold text-[#111111]">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-[#111111] text-sm">
                {userName}
              </p>
              <p className="text-xs text-gray-700">
                {programName}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center border border-gray-400">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}