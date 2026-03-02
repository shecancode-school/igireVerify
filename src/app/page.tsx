"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has seen welcome screen before
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");

    if (!hasSeenWelcome) {
      // First visit - show welcome screen
      router.push("/welcome");
    } else {
      // Returning user - show homepage directly
      router.push("/home");
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}