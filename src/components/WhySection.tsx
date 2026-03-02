const features = [
  {
    icon: "map-pin",
    title: "Easy Participation Tracking",
    desc: "Simply submit photos with GPS and AI verification to record your participation.",
  },
  {
    icon: "camera",
    title: "Live Capture Camera",
    desc: "Live Camera Capture real-time photo captured is required for every check-in.",
  },
  {
    icon: "user-scan",
    title: "AI Facial Verification",
    desc: "AI face Verification with automated identity matching for secure, tamper‑proof attendance.",
  },
  {
    icon: "badge-check",
    title: "Digital Approvals",
    desc: "Records must not be flagged or must be manually approved before they are counted.",
  },
  {
    icon: "clock",
    title: "Duration Tracking",
    desc: "Time Window within designated session hours ensures accurate on-time presence.",
  },
  {
    icon: "trending-up",
    title: "Valid Statistics",
    desc: "After all steps you will be validated and recorded — accurate data guaranteed.",
  },
];

export default function WhySection() {
  return (
    <section id="why" className="py-16 px-6 lg:px-14 bg-gray-50">
      <h2
        className="text-center font-black tracking-tight text-gray-900 mb-14"
        style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
      >
        Why use &nbsp;IgireVerify ?
      </h2>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center
                       hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            {/* Icon circle with SVG */}
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center
                         mx-auto mb-6 transition-colors duration-300"
              style={{ background: "#E8F5E9" }}
            >
              <FeatureIcon name={f.icon} />
            </div>

            {/* Title */}
            <h3
              className="font-bold text-[17px] mb-3 leading-snug"
              style={{ color: "#C47D0E" }}
            >
              {f.title}
            </h3>

            {/* Description */}
            <p className="text-[14px] leading-[1.7] text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   ICON COMPONENT
═══════════════════════════════════════════════════════════ */

function FeatureIcon({ name }: { name: string }) {
  const iconColor = "#2E7D32";
  const size = 40;

  switch (name) {
    case "map-pin":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      );
    
    case "camera":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      );
    
    case "user-scan":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3"/>
          <path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
          <path d="M2 2h4v4M2 22h4v-4M22 2h-4v4M22 22h-4v-4"/>
        </svg>
      );
    
    case "badge-check":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          <polyline points="9 11 12 14 15 11"/>
        </svg>
      );
    
    case "clock":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    
    case "trending-up":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      );
    
    default:
      return null;
  }
}