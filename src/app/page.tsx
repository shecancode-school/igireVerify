"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      router.push("/welcome");
    } else {
      router.push("/home");
    }
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}