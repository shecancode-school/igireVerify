"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check user role based on email
    if (email.toLowerCase().includes("hr@igirerwanda.org") || 
        email.toLowerCase().includes("hr@igire.com")) {
      // HR Staff - Redirect to HR Dashboard
      router.push("/dashboard/hr");
    } else if (email.endsWith("@igirerwanda.org")) {
      // Other Staff - Redirect to Staff Dashboard
      router.push("/dashboard/staff");
    } else {
      // Participant - Redirect to Participant Dashboard
      router.push("/dashboard/participant");
    }

    setIsLoading(false);
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          
          {/* Logo */}
          <div className="mb-12">
            <h1 className="font-black text-4xl leading-none tracking-tight">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

          <h2 className="text-5xl font-bold text-gray-900 mb-12">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                placeholder="your.email@igirerwanda.org"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: "#2E7D32" }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link 
                href="/register" 
                className="font-semibold hover:underline"
                style={{ color: "#2E7D32" }}
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Logins:</p>
            <p className="text-xs text-blue-700">HR: hr@igirerwanda.org</p>
            <p className="text-xs text-blue-700">Participant: participant@example.com</p>
          </div>

        </div>
      </div>
    </>
  );
}