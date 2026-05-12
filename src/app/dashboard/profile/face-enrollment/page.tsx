"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as faceapi from "face-api.js";
import { loadFaceApiModels } from "@/lib/face-api-utils";
import { CheckCircle2, RefreshCw, Scan, AlertCircle } from "lucide-react";

export default function FaceEnrollmentPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>("idle");
  const [error, setError] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<any>(null);
  const [livenessStep, setLivenessStep] = useState<"match" | "blink" | "left" | "right">("match");
  const [progress, setProgress] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      setUserData(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      setAiLoading(true);
      loadFaceApiModels().finally(() => {
        setAiLoading(false);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } }).then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              setStatus("detecting");
            };
          }
        });
      });
    }
  }, [loading]);

  useEffect(() => {
    if (status !== "detecting" || aiLoading) return;
    let active = true;
    const loop = async () => {
      if (!active || !videoRef.current || status !== "detecting") return;
      try {
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 128 })).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
          setError(null);
          const nose = detection.landmarks.getNose();
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const distL = Math.abs(nose[0].x - leftEye[3].x);
          const distR = Math.abs(nose[0].x - rightEye[0].x);
          const yaw = (distL / distR) - 1;

          if (livenessStep === "match") {
            if (Math.abs(yaw) < 0.15) { setProgress(25); setLivenessStep("blink"); }
            else { setError("Align face in center."); }
          }
          else if (livenessStep === "blink") {
            const getEAR = (eye: any) => {
              const v1 = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
              const v2 = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
              const h = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
              return (v1 + v2) / (2 * h);
            };
            if ((getEAR(leftEye) + getEAR(rightEye)) / 2 < 0.25) { setProgress(50); setLivenessStep("left"); }
          }
          else if (livenessStep === "left" && yaw > 0.45) { setProgress(75); setLivenessStep("right"); }
          else if (livenessStep === "right" && yaw < -0.45) {
            setProgress(100); setStatus("captured");
            handleSave(detection.descriptor);
            return;
          }
        } else { setError("Face not detected."); }
      } catch (e) {}
      if (active) setTimeout(loop, 80);
    };
    loop();
    return () => { active = false; };
  }, [status, aiLoading, livenessStep]);

  const handleSave = async (descriptor: any) => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const img = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(img);
    streamRef.current?.getTracks().forEach(t => t.stop());

    const photoUrl = await uploadToCloudinary(img, "enrollment");
    await fetch("/api/users/face-enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userData.userId, faceDescriptor: Array.from(descriptor), photoUrl })
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col-reverse md:flex-row">
      <Sidebar />
      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px]">
        <TopBar {...userData} />
        <main className="p-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-[70px] mt-10 shadow-3xl border border-slate-50 text-center p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
               <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_15px_#10b981]" style={{ width: `${progress}%` }} />
            </div>

            <div className="mb-12">
               <h2 className="text-4xl font-black mb-4 tracking-tighter text-slate-900">Biometric Identity Setup</h2>
               <p className="text-slate-500 font-medium max-w-xl mx-auto">Establish your secure digital identity. This high-fidelity scan will be used for all future attendance verifications.</p>
            </div>
            
            <div className="relative aspect-video bg-slate-950 rounded-[55px] overflow-hidden mb-12 shadow-3xl group">
              {aiLoading && (
                <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center text-white">
                  <RefreshCw className="animate-spin text-emerald-500 w-16 h-16 mb-6" />
                  <p className="font-black text-xs tracking-[0.4em] uppercase opacity-40">Initialising Quantum Optics...</p>
                </div>
              )}
              {capturedImage ? <Image src={capturedImage} alt="Face" fill className="object-cover" /> : <video ref={videoRef} className="w-full h-full object-cover opacity-80" autoPlay playsInline muted />}
              
              {/* PRECISION HUD */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 {/* Precision Corners */}
                 <div className="absolute top-12 left-12 w-20 h-20 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-[40px]" />
                 <div className="absolute top-12 right-12 w-20 h-20 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-[40px]" />
                 <div className="absolute bottom-12 left-12 w-20 h-20 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-[40px]" />
                 <div className="absolute bottom-12 right-12 w-20 h-20 border-b-2 border-r-2 border-emerald-500/30 rounded-br-[40px]" />
                 
                 {/* Scanning Circle */}
                 <div className={`w-[480px] h-[480px] rounded-full border border-white/5 flex items-center justify-center transition-all duration-1000 ${status === "detecting" ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
                    <div className="w-[440px] h-[440px] rounded-full border-4 border-dashed border-emerald-500/20 animate-[spin_30s_linear_infinite]" />
                 </div>

                 {/* Active Scan Line */}
                 {status === "detecting" && (
                   <div className="absolute inset-0 overflow-hidden rounded-[55px]">
                      <div className="w-full h-1 bg-emerald-500/40 shadow-[0_0_30px_#10b981] animate-[scan_4s_ease-in-out_infinite]" />
                   </div>
                 )}
              </div>

              {status === "detecting" && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
                  <div className="bg-slate-900/40 backdrop-blur-3xl px-12 py-6 rounded-[40px] border border-white/10 flex flex-col items-center shadow-3xl min-w-[300px]">
                    <span className="font-black text-[11px] uppercase tracking-[0.5em] text-emerald-400 mb-2">Protocol: {livenessStep}</span>
                    <p className="text-4xl font-black text-white italic tracking-tighter uppercase">
                       {livenessStep === "match" ? "Face Center" : livenessStep === "blink" ? "Action: Blink" : livenessStep === "left" ? "Rotate Left" : "Rotate Right"}
                    </p>
                  </div>
                </div>
              )}

              {status === "captured" && (
                <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-in fade-in duration-700">
                  <CheckCircle2 className="w-32 h-32 mb-8 animate-bounce" />
                  <h3 className="text-4xl font-black uppercase tracking-[0.3em]">Master Enrolled</h3>
                  <p className="mt-4 font-bold opacity-80">Securing biometric anchor...</p>
                </div>
              )}
            </div>

            {error && (
              <div className="max-w-md mx-auto p-5 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center justify-center gap-3 animate-pulse">
                <AlertCircle className="w-6 h-6" /> 
                <span className="font-black text-xs uppercase tracking-widest">{error}</span>
              </div>
            )}
          </div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
