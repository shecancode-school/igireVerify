const features = [
  { icon: "", title: "Easy Participation Tracking", desc: "Simply submit photos with GPS and AI verification to record your participation." },
  { icon: "", title: "Live Capture Camera", desc: "Live Camera Capture real‑time photo captured is required for every check-in." },
  { icon: "", title: "AI Facial Verification", desc: "AI face Verification with automated identity matching for secure, tamper‑proof attendance." },
  { icon: "", title: "Digital Approvals", desc: "Records must not be flagged or must be manually approved before they are counted." },
  { icon: "", title: "Duration Tracking", desc: "Time Window within designated session hours ensures accurate on-time presence." },
  { icon: "", title: "Valid Statistics", desc: "After all steps you will be validated and recorded accurate data guaranteed." },
];

export default function WhySection() {
  return (
    <section id="why" className="py-20 px-6 lg:px-14 bg-gray-50">
      <h2 className="text-center font-black tracking-tight text-gray-900 mb-14"
          style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
        Why use &nbsp;IgireVerify ?
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title}
               className="bg-white border border-gray-200 rounded-2xl p-8 text-center
                          hover:-translate-y-1.5 transition-all duration-300"
               style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center

                            text-[32px] mx-auto mb-5" style={{ background: "#F0F7F0" }}>
              {f.icon}
            </div>
            <h3 className="font-bold text-[16px] mb-3" style={{ color: "#C47D0E" }}>{f.title}</h3>
            <p className="text-[14px] leading-[1.7] text-black-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}