const steps = [
  {
    num: 1, reverse: false,
    title: "GPS Location Verification",
    icon: "", visualLabel: "GPS Location Verification",
    badge: null,
    desc: <>The system will verify that the user by the time of check-in is at the <strong>IGIRE RWANDA ORGANISATION</strong>&apos;s premises. If not, the system will deny continuing to the next step.</>,
  },
  {
    num: 2, reverse: true,
    title: "Live Camera Capture",
    icon: "", visualLabel: "Live Camera Capture",
    badge: "Identity Confirmed",
    desc: <>Once the location is verified, <strong>Camera</strong> will be enabled for the user to take the live photo during the scheduled time.</>,
  },
  {
    num: 3, reverse: false,
    title: "AI Face Verification",
    icon: "", visualLabel: "AI Face Verification",
    badge: "Match Found",
    desc: <>After capturing your image, the integrated AI will scan your face to check if it&apos;s the right person and save it in the system.</>,
  },
  {
    num: 4, reverse: true,
    title: "Time Window Validation",
    icon: "", visualLabel: "Time Window Validation",
    badge: "Validated & Locked",
    desc: <>The system validates that check-in/out is done within the scheduled time window. This prevents early/late check-ins and ensures accurate attendance records.</>,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 px-6 lg:px-14">
      <h2 className="text-center font-black tracking-tight text-gray-900 mb-5"
          style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
        How &nbsp;<span style={{ color: "#C47D0E" }}>Igire</span><span style={{ color: "#2E7D32" }}>Verify</span>&nbsp; Works
      </h2>
      <p className="text-center text-gray-400 text-[16px] leading-[1.75] max-w-[660px] mx-auto mb-16">
        Attendance is verified using GPS, live camera capture, AI verification, and human review.
      </p>

      <div className="max-w-4xl mx-auto flex flex-col">
        {steps.map((step, idx) => (
          <div key={step.num}
               className={`grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16 py-14 relative
                           ${idx < steps.length - 1 ? "border-b border-gray-100" : ""}`}>

            <div className={`absolute top-10 w-11 h-11 rounded-full text-white flex items-center
                             justify-center font-black text-[18px] z-10
                             ${step.reverse ? "md:right-0 right-0" : "md:left-0 left-0"}`}
                 style={{ background: "#1E5E2A", boxShadow: "0 2px 12px rgba(30,94,42,0.35)" }}>
              {step.num}
            </div>

            <div className={`bg-gray-100 rounded-2xl border border-gray-200 aspect-[4/3]
                             flex flex-col items-center justify-center gap-4 p-8
                             ${step.reverse ? "md:order-2" : "md:order-1"}`}>
              <span className="text-[60px] leading-none">{step.icon}</span>
              <p className="font-semibold text-[14px] text-gray-600">{step.visualLabel}</p>
              {step.badge && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "#F0F7F0" }}>
                  <span></span>
                  <span className="text-[12px] font-semibold" style={{ color: "#2E7D32" }}>{step.badge}</span>
                </div>
              )}
            </div>

            <div className={`${step.reverse ? "md:order-1" : "md:order-2"} pt-2`}>
              <h3 className="font-bold text-[22px] text-gray-900 mb-4">{step.title}</h3>
              <p className="text-[15px] leading-[1.8] text-gray-500">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}