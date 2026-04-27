"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {

    sessionStorage.setItem("hasSeenWelcome", "true");

    const timer = setTimeout(() => {
      router.push("/home");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">


      <div className="absolute inset-0 bg-[#2E7D32]" />

      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">

        {/* Welcome Text - Fade In */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-black mb-2 drop-shadow-md">
            WELCOME TO
          </h1>
        </div>

        {/* Logo Container - Zoom In + Rotate */}
        <div className="mb-12 flex justify-center animate-zoom-rotate">
          <div className="relative">
            {/* White circle background */}
            <div className="w-80 h-80 md:w-96 md:h-96 bg-white rounded-full shadow-2xl flex items-center justify-center p-8">
              <Image
                src="/Real.png"
                alt="Igire Rwanda Organisation"
                width={384}
                height={384}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl -z-10 animate-pulse-glow" />
          </div>
        </div>


        {/* Loading Bar - Fade In Delayed */}
        <div className="mt-16 animate-fade-in-slow">
          <div className="max-w-xs mx-auto">
            {/* Loading bar container */}
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full animate-loading-bar"
                style={{
                  background: "linear-gradient(90deg, #C47D0E, #FFA726)"
                }}
              />
            </div>
            <p className="text-white/90 text-sm mt-3 font-medium">
              Loading your experience...
            </p>
          </div>
        </div>

      </div>

      {/* Floating particles (optional decoration) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-3 h-3 bg-white/40 rounded-full animate-float-1" />
        <div className="absolute top-40 right-32 w-2 h-2 bg-white/30 rounded-full animate-float-2" />
        <div className="absolute bottom-32 left-40 w-4 h-4 bg-white/20 rounded-full animate-float-3" />
        <div className="absolute bottom-20 right-20 w-3 h-3 bg-white/25 rounded-full animate-float-1" />
      </div>

    </div>
  );
}