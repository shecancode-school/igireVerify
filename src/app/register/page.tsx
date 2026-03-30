"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black mb-2">
              <span className="text-[#C47D0E]">Igire</span>
              <span className="text-[#2E7D32]">Verify</span>
            </h1>
            <p className="text-gray-600">Choose your account to get started</p>
          </div>

          <div className="space-y-5">
            <button
              onClick={() => router.push("/register/participant")}
              className="w-full bg-[#2E7D32] text-white font-bold py-5 rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-3"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              I am a Participant
            </button>

            <button
              onClick={() => router.push("/register/staff")}
              className="w-full bg-[#C47D0E] text-white font-bold py-5 rounded-xl hover:bg-[#A5670B] transition-colors flex items-center justify-center gap-3"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <path d="M7 8h10" />
                <path d="M7 12h6" />
                <path d="M7 16h10" />
              </svg>
              I am Staff
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2E7D32] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}