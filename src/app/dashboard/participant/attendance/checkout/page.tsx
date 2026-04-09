"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Step = 1 | 2 | 3;
type GpsStatus = "idle" | "checking" | "verified" | "error";
type CameraStatus = "idle" | "active" | "captured" | "error";

const IGIRE_LAT = -1.9306;
const IGIRE_LNG = 30.0746;
const IGIRE_RADIUS_METERS = 50;
const MIN_GPS_ACCURACY = 58;

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
        headers: { "Content-Type": "application/json" },
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
    <div className="flex items-center justify-center gap-4 mb-10">
      {[1, 2, 3].map((value) => (
        <div key={value} className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg transition-all ${
              value <= step ? "bg-[#16A34A]" : "bg-gray-300"
            }`}
          >
            {value < step || (value === 3 && step === 3) ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              value
            )}
          </div>
          {value < 3 && (
            <div className={`hidden sm:block w-20 h-1 rounded ${value < step ? "bg-[#16A34A]" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    if (step === 1) {
      if (gpsStatus === "verified") {
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#E3F6E5] rounded-2xl border-2 border-[#16A34A] p-8 text-center">
              <h2 className="text-2xl font-bold text-[#14532D] mb-4">Location Verified</h2>
              <p className="mb-6 text-gray-700">You are at Igire Rwanda Organisation premises.</p>
              <button
                onClick={handleGpsContinue}
                className="w-full h-12 rounded-xl text-white font-semibold"
                style={{ background: "#14532D" }}
              >
                Continue to Camera
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Step 1: GPS Verification (Check-out)</h2>
          <button
            onClick={handleVerifyLocation}
            disabled={gpsStatus === "checking"}
            className="w-full h-14 rounded-xl text-white font-semibold disabled:opacity-70 transition-all shadow-sm hover:shadow-md mt-4"
            style={{ background: "#14532D" }}
          >
            {gpsStatus === "checking" ? "Verifying GPS Coordinates..." : "Verify My Location"}
          </button>
          
          {gpsError && (
            <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-700">Verification Failed</h3>
              </div>
              <p className="text-red-900 font-medium mb-2">
                You are not currently at Igire Rwanda Organisation premises. Please be physically present to record attendance.
              </p>
              <div className="bg-white/60 p-4 rounded-xl mt-4">
                <p className="text-sm text-red-800 font-semibold mb-1">Security Policy:</p>
                <p className="text-sm text-red-700">
                  Attendance can only be recorded when you are within the official geofenced headquarters radius. Please commute to the premises and try again.
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Step 2: Take Photo for Check-out</h2>

          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-md">
            {cameraStatus === "captured" && capturedImage ? (
              <Image src={capturedImage} alt="Captured Photo" fill className="object-cover" />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            )}

            {cameraStatus === "active" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-72 border-4 border-white/70 rounded-full" />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {cameraStatus === "captured" ? (
              <>
                <button
                  onClick={handleRetakePhoto}
                  className="flex-1 h-14 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50"
                >
                  Retake Photo
                </button>
                <button
                  onClick={handleSubmitCheckOut}
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#14532D] text-white rounded-xl font-semibold disabled:opacity-70"
                >
                  {isSubmitting ? "Saving..." : "Submit Check-out"}
                </button>
              </>
            ) : (
              <button
                onClick={handleCapturePhoto}
                disabled={cameraStatus !== "active"}
                className="w-full h-14 bg-[#14532D] text-white rounded-xl font-semibold disabled:opacity-70"
              >
                Capture Photo
              </button>
            )}
          </div>

          {cameraError && <p className="mt-4 text-red-600 text-center">{cameraError}</p>}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-[#E3F6E5] rounded-3xl p-12 border border-[#16A34A]">
          <h2 className="text-4xl font-bold text-[#14532D] mb-3">Session Complete</h2>
          <p className="text-lg text-gray-700 mb-10">Your check-out has been successfully recorded. You are now free to leave.</p>
          <button
            onClick={() => window.location.href = "/dashboard/participant"}
            className="px-10 py-4 bg-[#14532D] text-white rounded-2xl font-semibold text-lg hover:bg-[#0f3d23]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      <div className="flex-1 ml-[120px]">
        <TopBar />

        <main className="px-12 py-10 bg-[#F5F5F5] min-h-screen">
          {loading || !userData ? (
            <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32] mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              {renderStepper()}
              {renderStepContent()}

              {/* Global notification — visible on ALL steps */}
              {uiMessage && (
                <div className={`mt-8 max-w-2xl mx-auto p-6 rounded-2xl text-center font-medium border animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  uiMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  <div className="flex items-center justify-center gap-3 mb-1">
                    {uiMessage.type === "success" ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="text-lg">{uiMessage.text}</span>
                  </div>
                  {uiMessage.type === "error" && (
                    <p className="text-sm opacity-80 mt-1">Please try again or visit the Help Desk if you need assistance.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}