import Image from "next/image";
export default function Hero() {
  return (
    <section className="min-h-[calc(100vh-72px)] flex flex-col lg:flex-row items-center
                        px-6 lg:px-14 py-16 gap-12 lg:gap-20 bg-white relative overflow-hidden">

      <div className="absolute top-[-80px] right-[-80px] w-[440px] h-[440px] rounded-full
                      pointer-events-none blur-3xl opacity-40"
           style={{ background: "radial-gradient(circle,, transparent)" }} />

      {/* LEFT */}
      <div className="flex-1 max-w-[480px] w-full animate-fade-up">
        <h1 className="font-black leading-[1.1] tracking-tighter mb-8"
            style={{ fontSize: "clamp(56px, 8vw, 82px)", letterSpacing: "-0.02em" }}>
          <span style={{ color: "#C47D0E" }}>Igire</span>
          <span style={{ color: "#2E7D32" }}>Verify</span>
        </h1>
        <p className="text-[16px] leading-[1.8] text-gray-700">
          <strong className="font-black text-gray-900">IgireVerify</strong> is a verification and trust 
          framework that ensures identities, information, and digital interactions are 
          authentic, secure, and reliable across real‑world and digital environments.
        </p>
      </div>

      {/* RIGHT - Hero Image */}
      <div className="flex-[1.2] flex justify-center w-full animate-fade-up-delay">
        <div className="w-full max-w-[580px] relative overflow-hidden rounded-2xl shadow-lg">
          <Image
            src="/image (1).jpg"
            alt="IgireVerify Demo"
            width={580}
            height={500}
            className="w-full h-auto object-cover"
            priority
          
          />
        </div>



        
      </div>
    </section>
  );
}