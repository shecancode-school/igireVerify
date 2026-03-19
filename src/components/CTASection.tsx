import Link from "next/link";

export default function CTASection() {
  return (
    <section id="register" className="py-24 px-6 lg:px-14 text-center"
      style={{ background: "  #0B733B" }}>
      <h2 className="font-black text-white tracking-tight mb-8"
        style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
        Get Started on IgireVerify
      </h2>
      <p className="text-[18px] lg:text-[22px] leading-[1.6] max-w-[960px] mx-auto mb-14"
        style={{ color: "rgba(255,255,255,0.95)" }}>
        IgireVerify makes attendance tracking simple, secure, and accurate through facial
        recognition technology. Get started by registering users, capturing their facial data, and
        setting up attendance sessions in just a few steps 
      </p>
      <Link href="/register"
        className="inline-block text-white font-black text-[16px] tracking-widest
                       uppercase px-20 py-5 rounded-lg transition-all duration-200
                       hover:-translate-y-1 active:scale-95"
        style={{ background: "#C47D0E", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
        GET STARTED
      </Link>
    </section>
  );
}