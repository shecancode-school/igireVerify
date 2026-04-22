"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Step = 1 | 2 | 3;
type GpsStatus = "idle" | "checking" | "verified" | "error";
type CameraStatus = "idle" | "active" | "captured" | "error";

// Igire Rwanda Organization Headquarters - More accurate coordinates
const IGIRE_LAT = -1.9305;
const IGIRE_LNG = 30.0747;
// Increased radius to account for GPS variance (100m is reasonable for indoor/outdoor)
const IGIRE_RADIUS_METERS = 100;
// GPS accuracy threshold - more lenient for real-world conditions
const MIN_GPS_ACCURACY = 100;

interface UserData {
  userName: string;
  programName: string;
  programId: string;
  userId: string;
  role: string;
}

function distanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CheckOutPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiMessage, setUiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (step !== 2 || cameraStatus !== "idle") return;

    let mounted = true;
    let localStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             if (videoRef.current && mounted) {
               videoRef.current.play().catch(e => console.error("Video play failed:", e));
               setCameraStatus("active");
             }
          };
        }
      } catch (error) {
        if (mounted) {
          console.error("Camera access failed:", error);
          setCameraStatus("error");
          setCameraError("Camera access denied or unavailable. Please check permissions.");
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
    };
  }, [step, cameraStatus]);

  useEffect(() => {
    return () => {
      if (step !== 2) {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [step]);

  const handleVerifyLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported.");
      return;
    }

    setGpsStatus("checking");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (accuracy > MIN_GPS_ACCURACY) {
          setGpsStatus("error");
          setGpsError(`GPS accuracy too low (${Math.round(accuracy)}m).`);
          return;
        }

        const distance = distanceInMeters(latitude, longitude, IGIRE_LAT, IGIRE_LNG);

        if (distance <= IGIRE_RADIUS_METERS) {
          setGpsStatus("verified");
          setGpsCoords({ latitude, longitude, accuracy });
        } else {
          setGpsStatus("error");
          setGpsError(`Distance: ${Math.round(distance)}m away.`);
        }
      },
      () => {
        setGpsStatus("error");
        setGpsError("Failed to get location. Please enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleGpsContinue = () => setStep(2);

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
    setCameraStatus("captured");

    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setCameraStatus("idle");
  };

  const handleSubmitCheckOut = async () => {
    if (!capturedImage || !userData || !gpsCoords) return;

    setIsSubmitting(true);
    setUiMessage(null);

    try {
      const preflightRes = await fetch("/api/attendance/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.userId,
          programId: userData.programId,
          type: "checkout",
          role: userData.role || "participant",
        }),
      });

      if (!preflightRes.ok) {
        let preflightData;
        try {
          preflightData = await preflightRes.json();
        } catch {
          throw new Error("Connection issue detected. Please check your internet connection and try again.");
        }
        throw new Error(preflightData.error || "Attendance rules could not be verified. Please try again.");
      }

      let photoUrl = "";
      try {
        photoUrl = await uploadToCloudinary(capturedImage, "igire/attendance");
      } catch (storageErr) {
        console.error("[STORAGE_FAILURE]", storageErr);
        throw new Error("Unable to securely store your photo. Please check your internet connection and try again.");
      }

      const response = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        body: JSON.stringify({
          userId: userData.userId,
          programId: userData.programId,
          userName: userData.userName,
          programName: userData.programName,
          checkOutTime: new Date().toISOString(),
          photoUrl,
          gpsLocation: {
            latitude: gpsCoords.latitude,
            longitude: gpsCoords.longitude,
            accuracy: gpsCoords.accuracy,
          },
          role: userData.role || "participant",
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error("Connection issue detected. Please check your internet connection and try again.");
        }
        throw new Error(errorData.error || "Failed to record check-out.");
      }

      const data = await response.json();
      setUiMessage({ type: "success", text: `Check-out recorded successfully. Status: ${data.status}` });
      setStep(3);

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      const finalMessage =
        message.trim().length > 0
          ? message
          : "Network connection issue detected. Please ensure you have a stable internet connection and try again.";

      console.error("[CHECKOUT_PHASE_ERROR]", finalMessage);
      setUiMessage({ type: "error", text: finalMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-12 mb-16">
      {[1, 2, 3].map((value) => (
        <div key={value} className="relative flex flex-col items-center group">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-[20px] transition-all duration-500 shadow-lg ${
              value < step ? "bg-[#16A34A] text-white shadow-green-100" :
              value === step ? "bg-[#16A34A] text-white ring-8 ring-green-50 shadow-green-100 scale-110" :
              "bg-white text-gray-300 border-2 border-gray-100"
            }`}
          >
            {value < step || (value === 3 && step === 3) ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <span className="text-lg font-black">{value}</span>
            )}
          </div>
          
          <span className={`absolute -bottom-8 whitespace-nowrap text-[12px] font-black uppercase tracking-widest transition-colors ${
            value <= step ? "text-[#16A34A]" : "text-gray-300"
          }`}>
            {value === 1 ? "Location" : value === 2 ? "Identity" : "Finish"}
          </span>

          {value < 3 && (
            <div className={`absolute left-[4.5rem] top-1/2 -translate-y-1/2 hidden lg:block w-20 h-[3px] rounded-full transition-colors duration-500 ${
              value < step ? "bg-[#16A34A]" : "bg-gray-100"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center">
            <div className={`w-20 h-20 mx-auto rounded-[24px] flex items-center justify-center mb-8 transition-colors duration-500 ${
              gpsStatus === "verified" ? "bg-[#F0FDF4]" : "bg-gray-50"
            }`}>
              <svg className={`w-10 h-10 ${gpsStatus === "verified" ? "text-[#16A34A]" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Location Verification</h2>
            <p className="text-gray-500 font-medium mb-10 leading-relaxed">
              We need to verify you are still at the premises to record your check-out.
            </p>

            {gpsStatus === "verified" ? (
              <button
                onClick={handleGpsContinue}
                className="w-full h-14 bg-[#16A34A] text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:shadow-green-200 transition-all hover:-translate-y-1 active:scale-95"
              >
                Continue to Photo
              </button>
            ) : (
              <button
                onClick={handleVerifyLocation}
                disabled={gpsStatus === "checking"}
                className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-100 hover:shadow-gray-200 transition-all disabled:opacity-50"
              >
                {gpsStatus === "checking" ? "Verifying..." : "Verify My Location"}
              </button>
            )}

            {gpsError && (
              <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-[28px] animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-center gap-3 text-red-600 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span className="font-black uppercase tracking-widest text-xs">Verification Failed</span>
                </div>
                <p className="text-red-700 font-bold text-sm leading-relaxed">{gpsError}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Identity Verification (Check-out)</h2>

            <div className="relative w-full aspect-video bg-gray-900 rounded-[32px] overflow-hidden mb-10 shadow-2xl ring-4 ring-gray-50">
              {cameraStatus === "captured" && capturedImage ? (
                <Image src={capturedImage} alt="Captured Photo" fill className="object-cover" />
              ) : (
                <video ref={videoRef} className="w-full h-full object-cover absolute inset-0" autoPlay playsInline muted />
              )}

              {cameraStatus === "active" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-48 h-64 border-[3px] border-white/40 border-dashed rounded-[60px] mb-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                  <p className="text-white font-bold text-sm uppercase tracking-[0.2em] bg-black/20 backdrop-blur-md px-6 py-2 rounded-full">Position Face Clearly</p>
                </div>
              )}
            </div>

            <div className="flex gap-6 max-w-lg mx-auto">
              {cameraStatus === "captured" ? (
                <>
                  <button onClick={handleRetakePhoto} className="flex-1 h-14 border-2 border-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-50 transition-colors">
                    Retake
                  </button>
                  <button
                    onClick={handleSubmitCheckOut}
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-[#16A34A] text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:shadow-green-200 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Verify & Check-out"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCapturePhoto}
                  disabled={cameraStatus !== "active"}
                  className="w-full h-16 bg-[#16A34A] text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:shadow-green-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  Capture Photo
                </button>
              )}
            </div>

            {cameraError && <p className="mt-6 text-red-500 font-bold text-sm tracking-tight">{cameraError}</p>}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-[40px] p-16 border border-[#16A34A]/20 shadow-[0_10px_40px_rgba(22,163,74,0.05)]">
          <div className="w-24 h-24 bg-[#F0FDF4] rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-green-50">
            <svg className="w-12 h-12 text-[#16A34A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-4">Check-out Complete</h2>
          <p className="text-gray-500 font-medium text-lg mb-12">Your attendance session has been finalized. Thank you for participating!</p>
          <button
            onClick={() => window.location.href = "/dashboard/participant"}
            className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-100 hover:shadow-gray-200 transition-all hover:-translate-y-1"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col-reverse md:flex-row">
      <Sidebar />
      <div className="flex-1 w-full sm:ml-20 md:ml-24 lg:ml-[120px] pb-24 md:pb-0">
        <TopBar {...userData} />

        <main className="px-4 py-8 md:px-12 md:py-10 bg-[#F9FAFB] min-h-screen">
          <div className="max-w-5xl mx-auto">
            {renderStepper()}
            
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {renderStepContent()}
            </div>

            {uiMessage && (
              <div className={`mt-10 max-w-2xl mx-auto p-6 rounded-[28px] text-center font-bold border-2 animate-in fade-in zoom-in duration-500 ${
                uiMessage.type === "success"
                  ? "bg-green-50 border-green-100 text-green-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}>
                <div className="flex items-center justify-center gap-3">
                  {uiMessage.type === "success" ? (
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  <span className="text-base tracking-tight">{uiMessage.text}</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}