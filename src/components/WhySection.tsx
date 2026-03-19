"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  ChartNoAxesCombined,
  Clock3,
  MapPin,
  ScanFace,
  BadgeCheck,
} from "lucide-react";

type WhyCard = {
  key: string;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export default function WhySection() {
  const cards: WhyCard[] = useMemo(
    () => [
      {
        key: "tracking",
        title: "Easy Participation Tracking",
        desc: "Simply submit photos with GPS and AI verification to record your participation.",
        Icon: MapPin,
      },
      {
        key: "camera",
        title: "Live Capture Camera",
        desc: "Live Camera Capture real time photo captured required",
        Icon: Camera,
      },
      {
        key: "ai",
        title: "AI Facial Verification",
        desc: "AI face Verfication automated identity matching",
        Icon: ScanFace,
      },
      {
        key: "approvals",
        title: "Digital Approvals",
        desc: "records must be not flagged or manually approved",
        Icon: BadgeCheck,
      },
      {
        key: "duration",
        title: "Duration Tracking",
        desc: "Time Window within designated session hours",
        Icon: Clock3,
      },
      {
        key: "stats",
        title: "Valid Statistics",
        desc: "after all steps  you will be validated  and recorded",
        Icon: ChartNoAxesCombined,
      },
    ],
    []
  );

  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <section id="why" className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <h2
            className="text-center font-black tracking-tight text-gray-900 mb-10"
            style={{ fontSize: "clamp(28px, 4vw, 38px)" }}
          >
            Why use IgireVerify?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map(({ key, title, desc, Icon }) => {
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey((prev) => (prev === key ? null : key))}
                  className={[
                    "group w-full max-w-[380px] mx-auto text-left rounded-2xl border transition-colors duration-150",
                    "px-10 py-14 min-h-[340px]",
                    "shadow-[0_2px_0_rgba(0,0,0,0.06)]",
                    isActive
                      ? "bg-[#E0E0E0] border-[#CFCFCF]"
                      : "bg-white border-[#E1E1E1] hover:bg-[#F4F4F4]",
                  ].join(" ")}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon
                      className={[
                        "h-20 w-20 transition-colors duration-150",
                        isActive ? "text-gray-600" : "text-[#2E7D32]",
                      ].join(" ")}
                    />
                    <h3
                      className={[
                        "mt-6 font-black text-[18px] leading-tight transition-colors duration-150",
                        isActive ? "text-gray-700" : "text-[#B87412]",
                      ].join(" ")}
                    >
                      {title}
                    </h3>
                    <p
                      className={[
                        "mt-4 text-[14px] leading-[1.6] max-w-[320px] transition-colors duration-150",
                        isActive ? "text-gray-600" : "text-gray-700",
                      ].join(" ")}
                    >
                      {desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}