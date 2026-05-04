"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 1. Capture the token from the URL hash (#token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const t = params.get("token");
    
    if (t) {
      setToken(t);
      // 2. Clean the URL immediately so the user doesn't see the token
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setError("Missing reset token. Please use the link from your email.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-green-50 border border-green-200 rounded-2xl text-center">
        <h3 className="text-2xl font-bold text-green-800 mb-4">Password Reset Successful</h3>
        <p className="text-green-700 mb-8">Your password has been updated. You can now log in with your new credentials.</p>
        <Link
          href="/login"
          className="inline-block px-8 py-4 bg-[#2E7D32] text-white font-bold rounded-xl transition-transform active:scale-95"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="font-black text-5xl tracking-tighter">
          <span style={{ color: "#C47D0E" }}>Igire</span>
          <span style={{ color: "#2E7D32" }}>Verify</span>
        </h1>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Password</h2>
      <p className="text-gray-600 mb-8">Please enter and confirm your new password below.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="w-full px-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
            className="w-full px-4 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-4 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#C47D0E" }}
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
        <Suspense fallback={<div className="text-xl font-bold">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
