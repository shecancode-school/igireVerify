export default function RequirementsBanner() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-[#111111]">Attendance History</h4>
        <span className="text-xs font-medium text-gray-500">Last 7 days</span>
      </div>

      <div className="flex gap-4 mb-4 text-sm font-medium">
        <button className="px-4 py-2 rounded-full bg-[#111111] text-white">
          This Week
        </button>
        <button className="px-4 py-2 rounded-full bg-white text-[#111111] border border-gray-200">
          This Month
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm text-[#111111]">
        <div className="space-y-1">
          <p className="font-semibold">4 Checked-In</p>
          <p className="font-semibold">4 Checked-Out</p>
        </div>
        <div className="space-y-1">
          <p>96%</p>
          <p>AI Verified</p>
        </div>
        <div className="space-y-1">
          <p>On-Time</p>
          <p>100%</p>
        </div>
      </div>
    </div>
  );
}