export default function ProgramCard({
  programName = "Web fundamentals",
}: {
  programName?: string;
}) {
  return (
    <div className="bg-[#DCEFE3] rounded-3xl px-8 py-8 flex items-center gap-6 shadow-sm h-full">

      {/* Icon */}
      <div className="flex-shrink-0">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8" y="10" width="14" height="24" rx="2" />
          <rect x="26" y="10" width="14" height="24" rx="2" />
          <path d="M22 14c-2 .5-4 1-6 1s-4-.5-6-1" />
          <path d="M26 14c2 .5 4 1 6 1s4-.5 6-1" />
        </svg>
      </div>

      {/* Text */}
      <div>
        <p className="text-gray-500 text-[11px] font-medium tracking-[0.25em] uppercase mb-2">
          Your Program
        </p>
        <h3 className="text-2xl font-bold text-black">
          {programName}
        </h3>
      </div>

    </div>
  );
}