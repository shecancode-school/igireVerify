"use client";

import { useState } from "react";
import Link from "react-router-dom"; // Wait, this is Next.js, should use next/link
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import LinkNext from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="font-black text-5xl tracking-tighter">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Forgot Password</h2>
          <p className="text-gray-600 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {message ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-700 font-medium mb-6">{message}</p>
              <LinkNext
                href="/login"
                className="inline-block px-6 py-3 bg-[#2E7D32] text-white font-bold rounded-xl"
              >
                Back to Login
              </LinkNext>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-0 py-4 text-lg bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-4 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50"
                style={{ background: "#C47D0E" }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <LinkNext href="/login" className="text-gray-600 font-medium hover:underline">
                  ← Back to Login
                </LinkNext>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
