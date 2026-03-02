"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  
  const [userType, setUserType] = useState<null | "participant" | "staff">(null);
  

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    program: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { userType, ...formData });
    
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] bg-white flex items-start justify-center px-6 py-12 relative overflow-hidden">
   

        {/* Form Container */}
        <div className="w-full max-w-md relative z-10 pt-8">
          
          {/* IgireVerify Logo */}
          <div className="mb-12">
            <h1 className="font-black text-4xl leading-none tracking-tight">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

          

          {/* STEP 1: Show Buttons (when userType is null) */}
          {userType === null && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Create Your Account
              </h2>

              <p className="text-gray-600 mb-8">
                Choose your account type to get started
              </p>

              {/* Participant Button */}
              <button
                onClick={() => setUserType("participant")}
                className="w-full flex items-center justify-center gap-4
                           bg-[#2E7D32] text-white font-bold text-lg
                           px-8 py-5 rounded-xl
                           hover:bg-[#1E5E2A] transition-all duration-200
                           active:scale-[0.98]"
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                I am a Participant
              </button>

              {/* Staff Button */}
              <button
                onClick={() => setUserType("staff")}
                className="w-full flex items-center justify-center gap-4
                           bg-[#C47D0E] text-white font-bold text-lg
                           px-8 py-5 rounded-xl
                           hover:bg-[#A86A0B] transition-all duration-200
                           active:scale-[0.98]"
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                I am Staff
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
            </div>
          )}

          {/* STEP 2A: Participant Form */}
          {userType === "participant" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Participant Registration
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Program Selection Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Your Program *
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 text-base text-gray-700
                               bg-white border-2 border-gray-300 rounded-lg
                               focus:border-[#2E7D32] focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  >
                    <option value="">Choose a program...</option>
                    <option value="web-fundamentals">Web Fundamentals</option>
                    <option value="advanced-frontend">Advanced Frontend</option>
                    <option value="advanced-backend">Advanced Backend</option>
        
                  </select>
                </div>

        
                <div>
                  
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Enter your full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gra
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                </div>
                

                {/* Email */}
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

                {/* Phone Number */}
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gray-300
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                </div>

                     
        {/* Background Logo */}
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

                {/* Password */}
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
                

                {/* Confirm Password */}
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
                             px-8 py-4 rounded-lg mt-8
                             transition-all duration-200
                             hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#2E7D32" }}
                >
                  Register as Participant
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="w-full text-gray-600 font-semibold text-base
                             px-8 py-3 mt-4
                             hover:text-gray-900 transition-colors"
                >
                  ← Back to account type selection
                </button>
              </form>
            </div>
          )}

          {/* STEP 2B: Staff Form */}
          {userType === "staff" && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Staff Registration
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Full Name */}
                <div>
                  <input
                    type="text"
                    name="fullname"
                    placeholder="Enter your full name"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gray-300
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                </div>
                

                {/* Work Email */}
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your work email (@igirerwanda.org)"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gray-300
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Must end with @igirerwanda.org
                  </p>
                </div>

                

                {/* Password */}
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

                {/* Confirm Password */}
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
                             px-8 py-4 rounded-lg mt-8
                             transition-all duration-200
                             hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#C47D0E" }}
                >
                  Register as Staff
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setUserType(null)}
                  className="w-full text-gray-600 font-semibold text-base
                             px-8 py-3 mt-4
                             hover:text-gray-900 transition-colors"
                >
                  ← Back to account type selection
                  
                </button>
              </form>
            </div>
            
          )}

        </div>

      
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