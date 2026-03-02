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
      
  
      <div 
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              #2E7D32 0px,
              #2E7D32 60px,
              #4CAF50 60px,
              #4CAF50 120px,
              #66BB6A 120px,
              #66BB6A 180px,
              #81C784 180px,
              #81C784 240px
            )
          `
        }}
      />

      {/* Overlay for depth */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Main Content */}
      <div className="relative z-10 text-center px-6">
        
        {/* Welcome Text - Fade In */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-800 mb-2">
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
            <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl -z-10 animate-pulse-glow" />
          </div>
        </div>

        {/* IRO Text - Slide Up */}
        <div className="animate-slide-up-delayed">
          <h2 className="text-6xl md:text-8xl font-black tracking-wider mb-4"
              style={{ 
                color: "#5D4037",
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
              }}>
            IRO
          </h2>
          <p className="text-xl md:text-2xl font-semibold text-gray-700">
            Igire Rwanda Organisation
          </p>
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