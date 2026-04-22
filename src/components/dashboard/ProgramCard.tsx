export default function ProgramCard({
  programName = "Web fundamentals",
}: {
  programName?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-[#E6F4EA] rounded-[32px] px-6 py-6 sm:px-8 sm:py-7 flex items-center gap-5 sm:gap-8 shadow-sm border border-[#D1FAE5] h-full transition-all hover:shadow-md">
      
      {/* Icon Section */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-white rounded-2xl shadow-sm">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col justify-center">
        <span className="text-gray-400 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-widest mb-1">
          Your Program
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
          {programName}
        </h3>
      </div>


    </div>
  );
}