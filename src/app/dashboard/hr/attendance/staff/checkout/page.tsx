"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";

type Step = 1 | 2 | 3;
type GpsStatus = "idle" | "checking" | "verified" | "error";
type CameraStatus = "idle" | "active" | "captured" | "error";

const IGIRE_LAT = -1.9306;
const IGIRE_LNG = 30.0746;
const IGIRE_RADIUS_METERS = 25;
const MIN_GPS_ACCURACY = 20;

function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
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

export default function CheckInPage() {
  const [step, setStep] = useState<Step>(1);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const userData = {
    userName: "Alice Uwera",
    programName: "Web fundamentals",
    isOnline: true,
    sessionDate: "Today: Friday, 6 Feb 2026",
    checkInWindow: "08:00 - 08:30",
    currentTime: "08:52",
  };

  useEffect(() => {
    if (step !== 2) return;

    async function startCamera() {
      try {
        setCameraStatus("idle");
        setCameraError(null);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraStatus("active");
          };
        }
      } catch (error: unknown) {
        console.error("Camera error:", error);
        setCameraStatus("error");

        const err = error as { name?: string };
        if (err?.name === "NotAllowedError") {
          setCameraError("Camera permission denied. Please allow camera access.");
        } else if (err?.name === "NotFoundError") {
          setCameraError("No camera found on your device.");
        } else {
          setCameraError("Failed to access camera. Please try again.");
        }
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [step]);

  function handleVerifyLocation() {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation is not supported on this device.");
      return;
    }

    setGpsStatus("checking");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        
        if (accuracy > MIN_GPS_ACCURACY) {
          setGpsStatus("error");
          setGpsError(
            `GPS accuracy too low (${Math.round(accuracy)}m). Required: ≤${MIN_GPS_ACCURACY}m. Please go outside for better GPS signal.`
          );
          return;
        }

        const distance = distanceInMeters(
          latitude,
          longitude,
          IGIRE_LAT,
          IGIRE_LNG
        );

        console.log("GPS Debug:", {
          userLat: latitude,
          userLng: longitude,
          distance: Math.round(distance),
          accuracy: Math.round(accuracy)
        });

        setGpsInfo(
          `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, Accuracy: ${Math.round(accuracy)}m`
        );

        if (distance <= IGIRE_RADIUS_METERS) {
          setGpsStatus("verified");
          setCheckInTime(new Date().toLocaleString());
        } else {
          setGpsStatus("error");
          setGpsError(
            `You are ${Math.round(distance)} meters away. You must be within ${IGIRE_RADIUS_METERS}m to check in.`
          );
        }
      },
      (error) => {
        setGpsStatus("error");
        
        if (error.code === 1) {
          setGpsError("Location permission denied. Please enable location access.");
        } else if (error.code === 2) {
          setGpsError("Location unavailable. Please check your device settings.");
        } else {
          setGpsError("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleGpsContinue() {
    setStep(2);
  }

  function handleCapturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    setCameraStatus("captured");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleRetakePhoto() {
    setCapturedImage(null);
    setCameraStatus("idle");
  }

  function handleCameraContinue() {
    setStep(3);
  }

  function renderStepper() {
    const circles = [1, 2, 3] as Step[];

    return (
      <div className="flex items-center justify-center gap-4 mb-10">
        {circles.map((value, index) => (
          <div key={value} className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-lg transition-all ${
                value < step
                  ? "bg-[#16A34A]"
                  : value === step
                  ? "bg-[#14532D]"
                  : "bg-gray-300"
              }`}
            >
              {value < step ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                value
              )}
            </div>
            {index < circles.length - 1 && (
              <div className={`hidden sm:block w-20 h-1 rounded ${
                value < step ? "bg-[#16A34A]" : "bg-gray-300"
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderStepContent() {
    if (step === 1) {
      if (gpsStatus === "verified") {
        return (
          <section className="max-w-2xl mx-auto">
            <div className="bg-[#E3F6E5] rounded-2xl border-2 border-[#16A34A] shadow-sm p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#16A34A] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-[#14532D] mb-2">
                    ✓ Location Verified
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    You are at Igire Rwanda Organisation premises.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">{checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GPS:</span>
                      <span className="font-mono text-xs">{gpsInfo}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGpsContinue}
                className="w-full mt-4 h-12 px-8 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                style={{ background: "#14532D" }}
              >
                Continue to Camera →
              </button>
            </div>
          </section>
        );
      }

      return (
        <section className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#111111] mb-3">
            Step 1: GPS Verification
          </h2>
          <p className="text-gray-600 mb-8">
            Confirm you are at Igire Rwanda Organisation premises.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">
                📍 You must be within {IGIRE_RADIUS_METERS} meters of the classroom
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerifyLocation}
              disabled={gpsStatus === "checking"}
              className="w-full h-14 px-8 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              style={{ background: "#14532D" }}
            >
              {gpsStatus === "checking" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking Location...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Verify Location
                </>
              )}
            </button>

            {gpsStatus === "error" && gpsError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium whitespace-pre-line">{gpsError}</p>
              </div>
            )}
          </div>
        </section>
      );
    }

    if (step === 2) {
      return (
        <section className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-[#111111] mb-3">
            Step 2: Live Camera Capture
          </h2>
          <p className="text-gray-600 mb-8">
            Position your face in the frame for verification.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="relative w-full max-w-md mx-auto mb-6">
              <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative">
                {cameraStatus === "captured" && capturedImage ? (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                )}

                {cameraStatus === "idle" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <div className="w-12 h-12 mx-auto mb-3 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}

                {cameraStatus === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-white text-center px-4">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      <p className="text-sm">{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>

              {cameraStatus === "active" && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-4 border-white/50 rounded-full" />
                </div>
              )}
            </div>

            {cameraStatus === "error" && cameraError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{cameraError}</p>
              </div>
            )}

            <div className="flex gap-4">
              {cameraStatus === "captured" ? (
                <>
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="flex-1 h-12 px-6 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleCameraContinue}
                    className="flex-1 h-12 px-6 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                    style={{ background: "#14532D" }}
                  >
                    Continue →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={cameraStatus !== "active"}
                  className="w-full h-12 px-8 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: "#14532D" }}
                >
                  📸 Capture Photo
                </button>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </section>
      );
    }

    return (
      <section className="max-w-2xl mx-auto">
        <div className="bg-[#E3F6E5] rounded-2xl border-2 border-[#16A34A] shadow-lg p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#16A34A] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-4xl font-black text-[#14532D] mb-4">
            Check-In Complete!
          </h2>
          
          <p className="text-gray-700 mb-8">
            Your attendance has been recorded successfully.
          </p>

          <div className="bg-white rounded-xl p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span className="font-semibold">{checkInTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Location:</span>
              <span className="font-mono text-xs">{gpsInfo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Photo:</span>
              <span className="font-semibold text-green-600">✓ Captured</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900">
              📅 Please return at 4:00 PM for check-out
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard/participant'}
            className="w-full h-12 px-8 rounded-lg text-white font-semibold transition-all hover:opacity-90"
            style={{ background: "#14532D" }}
          >
            Return to Dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />

      <div className="flex-1 ml-[120px]">
        <TopBar
          userName={userData.userName}
          programName={userData.programName}
          isOnline={userData.isOnline}
          sessionDate={userData.sessionDate}
          checkInWindow={userData.checkInWindow}
          currentTime={userData.currentTime}
        />

        <main className="px-12 py-10 bg-[#F5F5F5] min-h-screen">
          <div className="max-w-5xl mx-auto">
            {renderStepper()}
            {renderStepContent()}
          </div>
        </main>
      </div>
    </div>
  );
}