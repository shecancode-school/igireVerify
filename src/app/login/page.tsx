"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setError("");
      setStep(2);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest" // Try to bypass any proxy
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (like Console Ninja interception)
        const text = await response.text();
        if (text.includes("PRO FEATURE")) {
          setError("Development tool interference detected. Please disable Console Ninja extension or try a different browser.");
          setLoading(false);
          return;
        }
        setError(`Unexpected response: ${text}`);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect based on role from backend
      router.push(data.redirectTo || "/dashboard/participant");
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 relative overflow-hidden">
     

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="mb-10">
            <h1 className="font-black text-5xl tracking-tighter">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

             {/* Background Logo Image */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none select-none opacity-10 z-0 hidden lg:block">
          <Image
            src="/Real.png"           
            alt="Igire Rwanda Organization"
            width={520}
            height={520}
            className="object-contain"
            priority
          />
        </div>
          

          {step === 1 && (
            <>
              <h2 className="text-5xl font-bold text-gray-900 mb-12">Sign In</h2>

              <form onSubmit={handleEmailSubmit} className="space-y-8">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-0 py-4 text-xl bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none placeholder-gray-400"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 text-white font-bold text-lg rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "#C47D0E" }}
                  >
                    Next
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600">
                    No account?{" "}
                    <Link
                      href="/register"
                      className="font-semibold hover:underline"
                      style={{ color: "#2E7D32" }}
                    >
                      Create one!
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-5xl font-bold text-gray-900 mb-10">
                Enter your password
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Logging in as</p>
                  <p className="text-lg font-semibold text-gray-900 break-all">{email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoFocus
                    className="w-full px-0 py-4 text-xl bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none placeholder-gray-400"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    href="/forgot-password"
                    className="text-[#2E7D32] font-semibold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ background: "#C47D0E" }}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-600 font-medium py-3 hover:text-gray-900 transition-colors"
                >
                  ← Back to email
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}