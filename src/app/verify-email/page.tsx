"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function verify() {
      const hash = window.location.hash || "";
      const raw = hash.startsWith("#") ? hash.slice(1) : hash;
      const params = new URLSearchParams(raw);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      // Immediately clear the token from the URL for security
      window.history.replaceState(null, "", window.location.pathname);
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          return;
        }
        setStatus("ok");
        setMessage(data.message || "Email verified.");
      } catch {
        setStatus("error");
        setMessage("Network error while verifying email.");
      }
    }

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-black mb-3">
          <span className="text-[#C47D0E]">Igire</span>
          <span className="text-[#2E7D32]">Verify</span>
        </h1>
        <p
          className={`mb-6 ${
            status === "ok" ? "text-green-700" : status === "error" ? "text-red-700" : "text-gray-600"
          }`}
        >
          {message}
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-3 rounded-lg bg-[#2E7D32] text-white font-semibold hover:bg-[#1B5E20]"
        >
          Go to Sign in
        </Link>
      </div>
    </div>
  );
}
