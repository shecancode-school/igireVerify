"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    if (email) {
      setStep(2); 
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
    
      console.log("Login attempt:", { email, password });

   
      const isStaff = email.endsWith("@igirerwanda.org");
      
      if (isStaff) {
        console.log("Staff login detected");
        router.push("/dashboard/staff");
      } else {
       
        console.log("Participant login detected");
        router.push("/dashboard/participant");
      }


    } catch (err: any ) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Continue with Google");
    
  };

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-72px)] bg-white flex items-start justify-center px-6 py-12 relative overflow-hidden">
        
    
     

        
        <div className="w-full max-w-2xl relative z-10 pt-8">
          
    
          <div className="mb-12">
            <h1 className="font-black text-4xl leading-none tracking-tight">
              <span style={{ color: "#C47D0E" }}>Igire</span>
              <span style={{ color: "#2E7D32" }}>Verify</span>
            </h1>
          </div>

      
          {step === 1 && (
            <>
              <h2 className="text-5xl font-bold text-gray-900 mb-12">Sign In</h2>

              <form onSubmit={handleEmailSubmit} className="max-w-2xl">
                
            
                <div className="mb-6">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gray-300
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                </div>
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

              
                <div className="mb-16">
                  <p className="text-lg text-gray-900">
                    No Account? {" "}
                    <Link 
                      href="/register"
                      className="font-semibold hover:underline"
                      style={{ color: "#2E7D32" }}
                    >
                      Create one!
                    </Link>
                  </p>
                </div>

            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3
                               bg-white border-2 border-gray-300 rounded-lg
                               px-6 py-4
                               font-semibold text-gray-700 text-base
                               hover:bg-gray-50 transition-colors duration-200"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>

              
                  <button
                    type="submit"
                    className="text-white font-bold text-lg
                               px-8 py-4 rounded-lg
                               transition-all duration-200
                               hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "#C47D0E" }}
                  >
                    Next
                  </button>
                </div>
              </form>
            </>
          )}

      
          {step === 2 && (
            <>
              <h2 className="text-5xl font-bold text-gray-900 mb-12">
                Enter your password
              </h2>

              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="max-w-2xl">
                
            
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Logging in as:</p>
                  <p className="text-lg font-semibold text-gray-900">{email}</p>
                </div>

              
                <div className="mb-6">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-0 py-4 text-base text-gray-700 placeholder-gray-400
                               bg-transparent
                               border-0 border-b-2 border-gray-300
                               focus:border-gray-900 focus:outline-none focus:ring-0
                               transition-colors duration-200"
                  />
                </div>

              
                <div className="mb-16">
                  <Link 
                    href="/forgot-password"
                    className="text-lg font-semibold hover:underline"
                    style={{ color: "#2E7D32" }}
                  >
                    Forgot Password?
                  </Link>
                </div>

                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-bold text-lg
                             px-8 py-4 rounded-lg
                             transition-all duration-200
                             hover:opacity-90 active:scale-[0.98]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#C47D0E" }}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-600 font-semibold text-base
                             px-8 py-3 mt-4
                             hover:text-gray-900 transition-colors"
                >
                  ← Back to email
                </button>
              </form>
            </>
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