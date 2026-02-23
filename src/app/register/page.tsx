"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <>
      {/* Same Navbar as Homepage */}
      <Navbar />

      {/* Main Content */}
      <div className="min-h-[calc(100vh-72px)] bg-white flex items-start justify-center px-6 py-12 relative overflow-hidden">
        
       

        {/* Form Container */}
        <div className="w-full max-w-md relative z-10 pt-8">
          
          {/* IgireVerify Text Logo */}
          <div className="mb-12">
            <h1 className="font-black text-4xl leading-none tracking-tight">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

          {/* Sign up Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-12">Sign up</h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Fullname Input */}
            <div>
              <input
                type="text"
                name="fullname"
                placeholder="Enter your fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                           bg-transparent
                           border-0 border-b-2 border-gray-300
                           focus:border-gray-900 focus:outline-none focus:ring-0
                           transition-colors duration-200"
              />

               {/* Background Logo Image - positioned at TOP */}
           <div className="absolute top-0 right-0 pointer-events-none select-none">
          <div className="relative opacity-[0.12]">
            <Image
              src="/Real.png"
              alt="IRO Background"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </div>
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                           bg-transparent
                           border-0 border-b-2 border-gray-300
                           focus:border-gray-900 focus:outline-none focus:ring-0
                           transition-colors duration-200"
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                           bg-transparent
                           border-0 border-b-2 border-gray-300
                           focus:border-gray-900 focus:outline-none focus:ring-0
                           transition-colors duration-200"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                           bg-transparent
                           border-0 border-b-2 border-gray-300
                           focus:border-gray-900 focus:outline-none focus:ring-0
                           transition-colors duration-200"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full text-white font-bold text-lg
                         px-8 py-4 rounded-lg mt-10
                         transition-all duration-200
                         hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#C47D0E" }}
            >
              Register
            </button>

            {/* Already have account */}
            <p className="text-center text-gray-600 mt-8 text-base">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-semibold hover:underline"
                style={{ color: "#2E7D32" }}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        {/* Menu Icon - Top Right */}
        <button 
          className="fixed top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors z-20"
          style={{ color: "#C47D0E" }}
          aria-label="Menu"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

      </div>
    </>
  );
}