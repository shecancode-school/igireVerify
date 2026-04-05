import Image from "next/image";
export default function Hero() {
  return (
    <section className="bg-white relative overflow-hidden pt-12 lg:pt-20 pb-16 px-6 lg:px-14">
      <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        <div className="absolute top-[-80px] right-[-80px] w-[440px] h-[440px] rounded-full
                        pointer-events-none blur-3xl opacity-40 z-0"
          style={{ background: "radial-gradient(circle,, transparent)" }} />

        {/* Text Section */}
        <div className="w-full animate-fade-up relative z-10 lg:pr-8">
          <h1 className="font-black leading-[1.1] tracking-tighter mb-10"
            style={{ fontSize: "clamp(50px, 6vw, 76px)", letterSpacing: "-0.02em" }}>
            <span style={{ color: "#C47D0E" }}>Igire</span>
            <span style={{ color: "#2E7D32" }}>Verify</span>
          </h1>
          <p className="text-[20px] leading-[1.8] text-gray-700">
            <strong className="font-black text-gray-900">IgireVerify</strong> is a verification and trust
            framework that ensures identities, information, and digital interactions are
            authentic, secure, and reliable across real‑world and digital environments.
          </p>
        </div>

        {/* Image Section */}
        <div className="w-full flex justify-center lg:justify-end animate-fade-up-delay relative z-10">
          <div className="w-full max-w-[580px] relative overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/image.jpg"
              alt="IgireVerify Demo"
              width={580}
              height={500}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}