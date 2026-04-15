export default function ProgramCard({
  programName = "Web fundamentals",
}: {
  programName?: string;
}) {
  return (
    <div className="bg-[#DCEFE3] rounded-2xl sm:rounded-3xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm h-full">

      {/* Icon */}
      <div className="flex-shrink-0">
        <svg
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sm:w-12 sm:h-12"
        >
          <rect x="8" y="10" width="14" height="24" rx="2" />
          <rect x="26" y="10" width="14" height="24" rx="2" />
          <path d="M22 14c-2 .5-4 1-6 1s-4-.5-6-1" />
          <path d="M26 14c2 .5 4 1 6 1s4-.5 6-1" />
        </svg>
      </div>

      {/* Text */}
      <div className="text-center sm:text-left">
        <p className="text-gray-500 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-1 sm:mb-2">
          Your Program
        </p>
        <h3 className="text-xl sm:text-2xl font-bold text-black break-words">
          {programName}
        </h3>
      </div>

    </div>
  );
}