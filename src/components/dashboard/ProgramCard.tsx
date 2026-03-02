export default function ProgramCard({ programName = "Web fundamentals" }: { programName?: string }) {
  return (
    <div className="bg-[#DCEFE3] rounded-2xl px-10 py-8 flex items-center gap-8 shadow-sm">
      <div className="flex-shrink-0">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="10" width="14" height="24" rx="2" />
          <rect x="26" y="10" width="14" height="24" rx="2" />
          <path d="M22 14c-2 .5-4 1-6 1s-4-.5-6-1" />
          <path d="M26 14c2 .5 4 1 6 1s4-.5 6-1" />
        </svg>
      </div>

      <div>
        <p className="text-gray-700 text-sm font-semibold tracking-[0.15em] mb-1">
          Your&nbsp;&nbsp;Program
        </p>
        <h3 className="text-2xl md:text-3xl font-black text-black">
          {programName}
        </h3>
      </div>

    </div>
  );
}