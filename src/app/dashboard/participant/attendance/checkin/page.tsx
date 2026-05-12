"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as faceapi from "face-api.js";
import { loadFaceApiModels, compareFaces, calculateEAR, calculateMAR, getAverageDescriptor } from "@/lib/face-api-utils";
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Zap, UserCheck, Timer, Scan, Target, Move, Activity, Fingerprint } from "lucide-react";

export default function CheckInPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gpsStatus, setGpsStatus] = useState<any>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<any>(null);
  const [cameraStatus, setCameraStatus] = useState<any>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [livenessStep, setLivenessStep] = useState<string>("Initializing...");
  const [livenessScore, setLivenessScore] = useState(0);
  const [identityScore, setIdentityScore] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stabilityCounter, setStabilityCounter] = useState(0);
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frontalDescriptorRef = useRef<number[] | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      setUserData(data);
      setLoading(false);
      if (!data.isCheckInOpen) {
        setRuleError(data.checkInMessage || "Program Rules: Attendance window is currently closed.");
      }
    });
  }, []);

  useEffect(() => {
    if (step === 2 && cameraStatus === "idle" && !ruleError) {
      setAiLoading(true);
      loadFaceApiModels().finally(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } }).then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setCameraStatus("detecting");
            };
          }
        }).finally(() => setAiLoading(false));
      });
    }
  }, [step, cameraStatus, ruleError]);

  useEffect(() => {
    if (cameraStatus !== "detecting") return;
    let active = true;
    let frameId: number;
    
    // Express Buffers
    const descriptorBuffer: number[][] = [];
    const maxBufferSize = 5;
    let hasBlinked = false;
    let hasTurned = false;
    let hasMouthed = false;

    const loop = async () => {
      if (!active || !videoRef.current || cameraStatus !== "detecting") return;
      
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection) {
          setCameraError(null);
          const landmarks = detection.landmarks;
          const descriptor = Array.from(detection.descriptor);
          
          // 1. IDENTITY TRACKING
          descriptorBuffer.push(descriptor);
          if (descriptorBuffer.length > maxBufferSize) descriptorBuffer.shift();
          
          const avgDesc = getAverageDescriptor(descriptorBuffer);
          if (avgDesc) {
            const distance = compareFaces(avgDesc, userData.faceDescriptor);
            // 0.5 is strict, 0.6 is default. We use 0.55 for a good balance.
            const confidence = Math.max(0, Math.min(100, (1 - distance / 0.55) * 100));
            setIdentityScore(Math.round(confidence));
            setMatchConfidence(confidence);
            
            if (confidence > 85) {
              frontalDescriptorRef.current = Array.from(avgDesc);
            }
          }

          // 2. LIVENESS TRACKING (Parallel)
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const distL = Math.abs(nose[0].x - leftEye[3].x);
          const distR = Math.abs(nose[0].x - rightEye[0].x);
          const yaw = (distL / distR) - 1;

          // Blink Detection
          const ear = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;
          if (ear < 0.22) hasBlinked = true;

          // Mouth Detection (Yawn/Speak)
          const mar = calculateMAR(landmarks);
          if (mar > 0.5) hasMouthed = true;

          // Turn Detection
          if (Math.abs(yaw) > 0.3) hasTurned = true;

          // 3. SCORE CALCULATION
          let currentLiveness = 0;
          if (hasBlinked) currentLiveness += 40;
          if (hasTurned) currentLiveness += 30;
          if (hasMouthed) currentLiveness += 30;
          
          setLivenessScore(currentLiveness);

          // 4. SMART HUD INSTRUCTIONS
          if (!hasBlinked) setLivenessStep("Blink your eyes");
          else if (!hasTurned) setLivenessStep("Turn head slightly");
          else if (!hasMouthed) setLivenessStep("Open your mouth");
          else setLivenessStep("Hold still...");

          // 5. EXPRESS FINALIZATION
          // If Identity is very strong (>95%), we only need 40 points of liveness (just a blink)
          const identityThreshold = 90;
          const livenessThreshold = identityScore > 95 ? 40 : 100;

          if (identityScore >= identityThreshold && currentLiveness >= livenessThreshold) {
            setStabilityCounter(prev => {
              if (prev >= 5) { // Consistent for 5 frames
                setCameraStatus("blinking");
                handleFinalize();
                return 0;
              }
              return prev + 1;
            });
          } else {
            setStabilityCounter(0);
          }

        } else {
          setCameraError("BRING FACE INTO VIEW");
          setIdentityScore(0);
        }
      } catch (e) {
        console.error("Face Loop Error:", e);
      }

      if (active) frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => { 
      active = false; 
      cancelAnimationFrame(frameId);
    };
  }, [cameraStatus, userData, identityScore]);

  const handleFinalize = async () => {
    if (!videoRef.current || !canvasRef.current || !frontalDescriptorRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const img = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(img);
    setCameraStatus("captured");
    streamRef.current?.getTracks().forEach(t => t.stop());
    
    handleSubmit(img, frontalDescriptorRef.current);
  };

  const handleVerifyLocation = () => {
    if (ruleError) return;
    setGpsStatus("checking");
    navigator.geolocation.getCurrentPosition(pos => {
      setGpsCoords(pos.coords);
      setGpsStatus("verified");
      setTimeout(() => setStep(2), 800);
    }, () => {
      setGpsStatus("error"); setGpsError("GPS Signal Failed.");
    });
  };

  const handleSubmit = async (img: string, evolutionDescriptor?: number[]) => {
    setIsSubmitting(true);
    try {
      const photoUrl = await uploadToCloudinary(img, "attendance");
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: userData.userId, 
          programId: userData.programId, 
          userName: userData.userName || userData.name,
          programName: userData.programName,
          checkInTime: new Date().toISOString(),
          photoUrl, 
          gpsLocation: gpsCoords, 
          evolutionDescriptor 
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        setStep(3);
      } else {
        setRuleError(result.error || result.message || "Attendance Window Closed.");
        setStep(1); // Reset back to start to show error
        setCameraStatus("idle");
      }
    } catch (e) {
      setRuleError("Network Error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col-reverse md:flex-row font-sans">
      <Sidebar />
      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-32">
        <TopBar {...userData} />
        <main className="p-8 max-w-6xl mx-auto">
          {ruleError && (
            <div className="mt-12 mb-10 max-w-2xl mx-auto p-8 bg-white border-l-8 border-red-500 rounded-[35px] shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-6 duration-700">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase mb-1">Access Restricted</h3>
                <p className="font-bold text-slate-500 leading-relaxed">{ruleError}</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="max-w-xl mx-auto bg-white p-14 rounded-[60px] text-center shadow-sm border border-slate-100">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[45px] flex items-center justify-center mx-auto mb-10"><Zap className="w-12 h-12" /></div>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">FastPass Check-in</h2>
              <p className="text-slate-500 mb-12 font-medium">Verify your location to begin biometric authentication.</p>
              <button onClick={handleVerifyLocation} disabled={gpsStatus === "checking" || !!ruleError} className="w-full h-20 bg-slate-900 text-white rounded-[35px] font-black text-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-20">
                {gpsStatus === "checking" ? "SEARCHING..." : "VERIFY LOCATION"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-5xl mx-auto bg-white p-10 rounded-[70px] text-center shadow-xl border border-slate-50 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 px-4 gap-6">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> EXPRESS VERIFY</h2>
                
                <div className="flex flex-1 items-center gap-8 w-full md:w-auto">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Identity</span>
                      <span className="text-xs font-black text-slate-900">{identityScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${identityScore > 90 ? "bg-emerald-500" : "bg-orange-500"}`} style={{ width: `${identityScore}%` }} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3" /> Liveness</span>
                      <span className="text-xs font-black text-slate-900">{livenessScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${livenessScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-[55px] overflow-hidden mb-10 shadow-3xl group">
                {aiLoading && <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center text-white"><RefreshCw className="animate-spin text-emerald-500 w-14 h-14 mb-4" /><p className="font-black text-xs tracking-[0.3em] uppercase opacity-50">Calibrating Optics...</p></div>}
                {capturedImage ? <Image src={capturedImage} alt="Face" fill className="object-cover" /> : <video ref={videoRef} className="w-full h-full object-cover opacity-80" autoPlay playsInline muted />}
                
                {/* TACTICAL HUD */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   {/* HUD Corners */}
                   <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-white/20 rounded-tl-3xl" />
                   <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-white/20 rounded-tr-3xl" />
                   <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-white/20 rounded-bl-3xl" />
                   <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-white/20 rounded-br-3xl" />
                   
                   {/* Main Target Guide */}
                   <div className={`w-[480px] h-[480px] rounded-full border-2 transition-all duration-500 flex items-center justify-center ${cameraError ? "border-red-500/30" : "border-emerald-500/30"}`}>
                      <div className={`w-[440px] h-[440px] rounded-full border-4 border-dashed animate-[spin_20s_linear_infinite] ${cameraError ? "border-red-500/20" : "border-emerald-500/20"}`} />
                   </div>

                   {/* Stability Pulse */}
                   {stabilityCounter > 0 && (
                     <div className="absolute w-24 h-24 border-4 border-emerald-500 rounded-full animate-ping opacity-50" />
                   )}
                </div>

                {/* REAL-TIME GUIDANCE OVERLAY */}
                {cameraStatus === "detecting" && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <div className="bg-black/40 backdrop-blur-3xl px-8 py-4 rounded-3xl border border-white/10 flex flex-col items-center shadow-3xl">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Status</span>
                        <p className="text-2xl font-black text-white uppercase tracking-tighter italic">
                          {livenessStep}
                        </p>
                    </div>
                    {cameraError && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 bg-red-600 px-6 py-2 rounded-2xl text-white font-black text-xs uppercase tracking-widest animate-pulse">
                          <Move className="w-4 h-4" /> {cameraError}
                        </div>
                        {matchConfidence !== null && (
                          <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">
                            Current Confidence: {matchConfidence.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {cameraStatus === "blinking" && (
                  <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-2xl flex flex-col items-center justify-center text-white">
                    <CheckCircle2 className="w-24 h-24 mb-6 animate-bounce" />
                    <span className="font-black text-3xl uppercase tracking-[0.5em]">SECURED</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto bg-white p-24 rounded-[80px] text-center shadow-2xl border border-emerald-50">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[50px] flex items-center justify-center mx-auto mb-10"><CheckCircle2 className="w-16 h-16" /></div>
              <h2 className="text-5xl font-black mb-6 tracking-tighter">Verified</h2>
              <p className="text-slate-500 mb-16 text-xl font-medium">Your attendance has been permanently recorded.</p>
              <button onClick={() => window.location.href = "/dashboard/participant"} className="w-full h-20 bg-slate-900 text-white rounded-[40px] font-black text-xl shadow-2xl">Return Home</button>
            </div>
          )}
        </main>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}