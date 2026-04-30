"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import { loadFaceApiModels, isEyeClosed, getFaceDescriptor } from "@/lib/face-api-utils";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { Camera, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function FaceEnrollmentPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "detecting" | "blinking" | "captured" | "saving" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [hasBlinked, setHasBlinked] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        // 1. Fetch user data for TopBar
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) setUserData(await userRes.json());

        // 2. Load AI Models
        await loadFaceApiModels();
        
        // 3. Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setStatus("ready");
      } catch (err) {
        console.error("Initialization error:", err);
        setStatus("error");
        setErrorMessage("Camera access denied or models failed to load. Please ensure camera permissions are granted.");
      } finally {
        setLoading(false);
      }
    }
    init();

    return () => {
      // Stop camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Detection Loop for Liveness (Blink)
  useEffect(() => {
    let animationId: number;
    
    async function detect() {
      if (status !== "detecting" && status !== "blinking") return;
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
        .withFaceLandmarks();

      if (detections) {
        const closed = isEyeClosed(detections.landmarks);
        
        if (closed && !hasBlinked) {
          setHasBlinked(true);
          setStatus("blinking");
          setProgress(100);
          
          // Small delay to show "Blinked" status
          setTimeout(() => {
            captureDescriptor();
          }, 800);
        }
      }

      animationId = requestAnimationFrame(detect);
    }

    if (status === "detecting") {
      detect();
    }

    return () => cancelAnimationFrame(animationId);
  }, [status, hasBlinked]);

  async function startDetection() {
    setHasBlinked(false);
    setProgress(0);
    setStatus("detecting");
  }

  async function captureDescriptor() {
    if (!videoRef.current) return;
    setStatus("saving");

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) {
        setStatus("detecting");
        setErrorMessage("Could not capture face clearly. Please try again.");
        return;
      }

      const res = await fetch("/api/auth/register-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor: Array.from(descriptor) }),
      });

      if (res.ok) {
        setStatus("captured");
        setTimeout(() => {
          router.push("/dashboard/participant/profile");
        }, 2000);
      } else {
        throw new Error("Failed to save to database");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("System error during registration. Please refresh and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col-reverse md:flex-row">
      <Sidebar />
      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 md:pb-0">
        <TopBar {...userData} />

        <main className="p-4 md:p-12 flex flex-col items-center">
          <div className="max-w-3xl w-full">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-black text-slate-900 mb-2">Facial Enrollment</h1>
              <p className="text-slate-500 font-medium italic">Step 1 of Phase 2: Secure Identity Verification</p>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
              
              {/* Camera Container */}
              <div className="aspect-[4/3] bg-slate-900 relative flex items-center justify-center overflow-hidden">
                {loading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
                    <RefreshCw className="w-12 h-12 animate-spin text-[#16A34A]" />
                    <p className="font-bold tracking-widest text-sm uppercase">Loading AI Models...</p>
                  </div>
                )}

                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`w-full h-full object-cover transform transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}
                />
                
                {/* Face Overlay UI */}
                <div className="absolute inset-0 border-[16px] border-transparent pointer-events-none">
                  <div className="w-full h-full border-2 border-white/20 rounded-2xl flex items-center justify-center relative">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#16A34A] rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#16A34A] rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#16A34A] rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#16A34A] rounded-br-xl" />

                    {/* Scan Line Animation */}
                    {(status === 'detecting' || status === 'blinking') && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#16A34A] shadow-[0_0_20px_#16A34A] animate-scan" />
                    )}
                  </div>
                </div>

                {/* Status Banners */}
                {status === 'blinking' && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#16A34A] text-white px-6 py-2 rounded-full flex items-center gap-2 animate-bounce shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-black text-sm uppercase tracking-widest">Blink Detected!</span>
                  </div>
                )}
              </div>

              {/* Controls Section */}
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                      {status === 'ready' && <Camera className="w-6 h-6 text-[#16A34A]" />}
                      {status === 'detecting' && <RefreshCw className="w-6 h-6 text-[#16A34A] animate-spin" />}
                      {status === 'captured' && <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />}
                      {status === 'error' && <AlertCircle className="w-6 h-6 text-red-600" />}
                      
                      {status === 'ready' && "Camera Ready"}
                      {status === 'detecting' && "Verification in Progress"}
                      {status === 'blinking' && "Blink Detected!"}
                      {status === 'captured' && "Identity Verified"}
                      {status === 'error' && "Access Error"}
                      {status === 'saving' && "Processing Face Vector..."}
                    </h3>
                    <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
                      {status === 'ready' && "Position your face within the frame and click 'Start Verification' to begin the liveness challenge."}
                      {status === 'detecting' && "Please look directly at the camera and blink once to prove you are a live user."}
                      {status === 'captured' && "Your facial identity has been successfully secured. Redirecting to your profile..."}
                      {status === 'error' && errorMessage}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {status === 'ready' && (
                      <button 
                        onClick={startDetection}
                        className="bg-[#16A34A] hover:bg-[#15803d] text-white px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-[#16A34A]/20"
                      >
                        <ShieldCheck className="w-6 h-6" />
                        Start Verification
                      </button>
                    )}

                    {status === 'detecting' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#16A34A] transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-black text-[#16A34A] uppercase tracking-tighter animate-pulse">Waiting for Blink...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Grid */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Camera className="text-[#16A34A]" />, title: "Lighting", desc: "Ensure your room is well lit and your face is clear." },
                { icon: <ShieldCheck className="text-[#16A34A]" />, title: "Liveness", desc: "The system will ask for a blink to prevent photo spoofing." },
                { icon: <RefreshCw className="text-[#16A34A]" />, title: "Privacy", desc: "We store a mathematical vector, not your actual image." },
              ].map((item, i) => (
                <div key={i} className="bg-white/50 border border-slate-100 rounded-2xl p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-50">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-slate-800">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
