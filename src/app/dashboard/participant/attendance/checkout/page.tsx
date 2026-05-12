"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as faceapi from "face-api.js";
import { loadFaceApiModels, compareFaces, calculateEAR, calculateMAR, getAverageDescriptor } from "@/lib/face-api-utils";
import { CheckCircle2, RefreshCw, Scan, AlertCircle, ShieldCheck, Target, Move, Activity, Fingerprint } from "lucide-react";

export default function CheckOutPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<any>("idle");
  const [cameraError, setCameraError] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const [livenessStep, setLivenessStep] = useState<string>("Initializing...");
  const [livenessScore, setLivenessScore] = useState(0);
  const [identityScore, setIdentityScore] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
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
      if (!data.isCheckOutOpen) {
        setRuleError(data.checkOutMessage || "The check-out window is currently closed.");
      }
    });
  }, []);

  useEffect(() => {
    if (userData) {
      setAiLoading(true);
      loadFaceApiModels().finally(() => {
        setAiLoading(false);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } }).then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setCameraStatus("detecting");
            };
          }
        });
      });
    }
  }, [userData]);

  useEffect(() => {
    if (cameraStatus !== "detecting" || aiLoading) return;
    let active = true;
    let frameId: number;

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

          // 1. IDENTITY
          descriptorBuffer.push(descriptor);
          if (descriptorBuffer.length > maxBufferSize) descriptorBuffer.shift();

          const avgDesc = getAverageDescriptor(descriptorBuffer);
          if (avgDesc) {
            const distance = compareFaces(avgDesc, userData.faceDescriptor);
            const confidence = Math.max(0, Math.min(100, (1 - distance / 0.55) * 100));
            setIdentityScore(Math.round(confidence));
            setMatchConfidence(confidence);
            if (confidence > 85) frontalDescriptorRef.current = Array.from(avgDesc);
          }

          // 2. LIVENESS
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const yaw = (Math.abs(nose[0].x - leftEye[3].x) / Math.abs(nose[0].x - rightEye[0].x)) - 1;

          if ((calculateEAR(leftEye) + calculateEAR(rightEye)) / 2 < 0.22) hasBlinked = true;
          if (calculateMAR(landmarks) > 0.5) hasMouthed = true;
          if (Math.abs(yaw) > 0.3) hasTurned = true;

          let currentLiveness = 0;
          if (hasBlinked) currentLiveness += 40;
          if (hasTurned) currentLiveness += 30;
          if (hasMouthed) currentLiveness += 30;
          setLivenessScore(currentLiveness);

          // HUD
          if (!hasBlinked) setLivenessStep("Blink to Verify");
          else if (!hasTurned) setLivenessStep("Turn head slightly");
          else if (!hasMouthed) setLivenessStep("Open your mouth");
          else setLivenessStep("Finalizing...");

          // 3. EXPRESS FINALIZATION
          const livenessThreshold = identityScore > 95 ? 40 : 100;
          if (identityScore >= 90 && currentLiveness >= livenessThreshold) {
            setStabilityCounter(prev => {
              if (prev >= 5) {
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
          setCameraError("SEARCHING...");
          setIdentityScore(0);
        }
      } catch (e) {}
      if (active) frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => { 
      active = false; 
      cancelAnimationFrame(frameId);
    };
  }, [cameraStatus, userData, aiLoading, identityScore]);

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

  const handleSubmit = async (img: string, evolutionDescriptor?: number[]) => {
    setIsSubmitting(true);
    try {
      const photoUrl = await uploadToCloudinary(img, "attendance");
      const response = await fetch("/api/attendance/checkout", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          userId: userData.userId, 
          programId: userData.programId, 
          checkOutTime: new Date().toISOString(),
          photoUrl, 
          evolutionDescriptor 
        }) 
      });
      const result = await response.json();
      if (response.ok) {
        window.location.href = "/dashboard/participant";
      } else {
        setRuleError(result.error || result.message || "Check-out failed.");
        setCameraStatus("idle");
      }
    } catch (e) {
      setRuleError("Network Error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col-reverse md:flex-row">
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
          <div className="max-w-5xl mx-auto bg-white p-10 rounded-[70px] text-center shadow-xl border border-slate-50 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 px-6 gap-6">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Checkout Core</h2>
            <div className="flex flex-1 items-center gap-8 w-full md:w-auto">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Integrity</span>
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
          
          <div className="relative aspect-video bg-black rounded-[50px] overflow-hidden mb-12 shadow-3xl">
            {aiLoading && <div className="absolute inset-0 z-30 bg-black flex items-center justify-center text-white"><RefreshCw className="animate-spin text-emerald-500 w-12 h-12" /></div>}
            {capturedImage ? <Image src={capturedImage} alt="Face" fill className="object-cover" /> : <video ref={videoRef} className="w-full h-full object-cover opacity-80" autoPlay playsInline muted />}
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
               <div className="absolute top-10 left-10 w-16 h-16 border-t-4 border-l-4 border-white/20 rounded-tl-3xl" />
               <div className="absolute top-10 right-10 w-16 h-16 border-t-4 border-r-4 border-white/20 rounded-tr-3xl" />
               <div className="absolute bottom-10 left-10 w-16 h-16 border-b-4 border-l-4 border-white/20 rounded-bl-3xl" />
               <div className="absolute bottom-10 right-10 w-16 h-16 border-b-4 border-r-4 border-white/20 rounded-br-3xl" />
               <div className={`w-[480px] h-[480px] rounded-full border-2 ${cameraError ? "border-red-500/30" : "border-emerald-500/30"}`} />
               {stabilityCounter > 0 && <div className="absolute w-24 h-24 border-4 border-emerald-500 rounded-full animate-ping opacity-50" />}
            </div>

            {cameraStatus === "detecting" && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                 <div className="bg-black/60 backdrop-blur-3xl px-10 py-5 rounded-[30px] text-white flex flex-col items-center border border-white/10">
                     <span className="text-[10px] font-black text-emerald-400 tracking-[0.4em] uppercase mb-1">Instruction</span>
                     <p className="text-2xl font-black uppercase italic text-white">{livenessStep}</p>
                 </div>
                 {cameraError && (
                   <div className="flex flex-col items-center gap-2">
                     <div className="bg-red-600 px-6 py-2 rounded-2xl text-white font-black text-xs uppercase animate-pulse">{cameraError}</div>
                     {matchConfidence !== null && (
                       <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">
                         Match Precision: {matchConfidence.toFixed(1)}%
                       </div>
                     )}
                   </div>
                 )}
               </div>
            )}
            {cameraStatus === "blinking" && <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center text-white font-black text-4xl uppercase tracking-[0.5em]">Success</div>}
          </div>
          </div>
        </main>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}