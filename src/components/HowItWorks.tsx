import Image from "next/image";

type Step = {
  num: number;
  reverse: boolean;
  imageSrc: string;
  desc: React.ReactNode;
};

const steps: Step[] = [
  {
    num: 1, reverse: false,
    imageSrc: "/gps.png",
    desc: <>The system verifies that, at check-in time, the user is at <strong>IGIRE RWANDA ORGANISATION</strong>&apos;s premises. If not, the system denies continuing to the next step.</>,
  },
  {
    num: 2, reverse: true,
    imageSrc: "/live.png",
    desc: <>Once the location is verified, <strong>Camera</strong> will be enabled for the user to take the live photo during the scheduled time.</>,
  },
  {
    num: 3, reverse: false,
    imageSrc: "/AI.png",
    desc: <>After capturing your image, the integrated AI will scan your face to check if it&apos;s the right person and save it in the system.</>,
  },
  {
    num: 4, reverse: true,
    imageSrc: "/Time%20window.png",
    desc: <>The system validates that check-in/out is done within the scheduled time window. This prevents early/late check-ins and ensures accurate attendance records.</>,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 px-6 lg:px-14">
      <h2 className="text-center font-black tracking-tight text-gray-900 mb-5"
        style={{ fontSize: "clamp(40px, 4vw, 50px)" }}>
        How &nbsp;<span style={{ color: "#C47D0E" }}>Igire</span><span style={{ color: "#2E7D32" }}>Verify</span>&nbsp; Works
      </h2>
      <p className="text-center text-gray-400 text-[20px] leading-[1.75] max-w-[660px] mx-auto mb-20">
        Attendance is verified using GPS, live camera capture, AI verification, and human review. Here is
        step by step process of how it works:
      </p>

      <div className="max-w-5xl mx-auto flex flex-col gap-24">
        {steps.map((step) => (
          <div key={step.num}
            className={`grid grid-cols-1 md:grid-cols-2 items-center gap-12 md:gap-20 lg:gap-28 py-14 relative
                           `}>

            <div className={`relative overflow-visible ${step.reverse ? "md:order-2" : "md:order-1"}`}>
              <div
                className={`absolute bottom-full mb-4 w-12 h-12 rounded-full text-white flex items-center
                            justify-center font-black text-[18px] z-10
                            ${step.reverse ? "right-0 translate-x-3" : "left-0 -translate-x-3"}`}
                style={{ background: "#1E5E2A", boxShadow: "0 2px 12px rgba(30,94,42,0.35)" }}
              >
                {step.num}
              </div>

              <div className="bg-gray-100 rounded-2xl border border-gray-200 aspect-[4/3] overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={step.imageSrc}
                    alt={`Step ${step.num}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 420px"
                    priority={step.num === 1}
                  />
                </div>
              </div>
            </div>

            <div className={`${step.reverse ? "md:order-1" : "md:order-2"} flex items-center`}>
              <p className="text-[20px] leading-[1.8] text-gray-500 font-medium">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}