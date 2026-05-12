export default function ProgramCard({
  programName = "Web fundamentals",
}: {
  programName?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#E6F4EA] rounded-[32px] px-8 py-7 flex items-center gap-6 shadow-sm border border-[#D1FAE5] h-full transition-all duration-300 hover:shadow-md">
      
      {/* Icon Section */}
      <div className="flex-shrink-0 relative">
        <div className="w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-[#D1FAE5]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col justify-center">
        <span className="text-[#16A34A]/70 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          Active Enrolled Program
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight tracking-tight">
          {programName}
        </h3>
        <p className="text-[11px] text-gray-500 font-medium mt-1">Full-time Immersive Path</p>
      </div>

    </div>
  );
}