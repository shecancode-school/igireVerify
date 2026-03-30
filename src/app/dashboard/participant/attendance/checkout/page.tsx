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
  const [step, setStep] = useState<Step>(1);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    checkOutWindow: "16:00 - 17:00",
    currentTime: "16:45",
  };

  // Simulate check-in verification (later we will make this real)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);

  // Start camera when entering step 2
  useEffect(() => {
    if (step !== 2) return;

    async function startCamera() {
      try {
        setCameraStatus("idle");
        setCameraError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraStatus("active");
          };
        }
      } catch (error) {
        console.error("Camera error:", error);
        setCameraStatus("error");
        setCameraError("Failed to access camera. Please allow permission.");
      }
    }

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [step]);

  const handleVerifyLocation = () => {
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
          setGpsError(`GPS accuracy too low (${Math.round(accuracy)}m).`);
          return;
        }

        const distance = distanceInMeters(latitude, longitude, IGIRE_LAT, IGIRE_LNG);

        setGpsInfo(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}, Accuracy: ${Math.round(accuracy)}m`);

        if (distance <= IGIRE_RADIUS_METERS) {
          setGpsStatus("verified");
          setCheckOutTime(new Date().toLocaleString());
        } else {
          setGpsStatus("error");
          setGpsError(`You are ${Math.round(distance)}m away.`);
        }
      },
      (error) => {
        setGpsStatus("error");
        setGpsError("Location request failed. Please enable GPS.");
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
    if (!capturedImage) return;
    if (!hasCheckedInToday) {
      setMessage("You must check in today before checking out.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const photoUrl = await uploadToCloudinary(capturedImage, "igire/attendance");

      const response = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userData.userName,
          programName: userData.programName,
          checkOutTime: new Date().toISOString(),
          gpsInfo: gpsInfo || "GPS recorded",
          photoUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setMessage("Check-out recorded successfully.");
      setStep(3);
    } catch (err) {
      console.error(err);
      setMessage("Failed to save check-out. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-4 mb-10">
      {[1, 2, 3].map((value, index) => (
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
            {value < step ? "✓" : value}
          </div>
          {index < 2 && (
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
              <p className="mb-6">You are within the Igire Rwanda premises.</p>
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
            className="w-full h-14 rounded-xl text-white font-semibold disabled:opacity-70"
            style={{ background: "#14532D" }}
          >
            {gpsStatus === "checking" ? "Checking Location..." : "Verify My Location"}
          </button>
          {gpsError && <p className="mt-6 text-red-600 text-center">{gpsError}</p>}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Step 2: Take Photo for Check-out</h2>

          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-8 shadow-md">
            {cameraStatus === "captured" && capturedImage ? (
              <Image src={capturedImage} alt="Captured" fill className="object-cover" />
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
                <div className="w-52 h-64 border-4 border-white/60 rounded-full" />
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
        <div className="bg-green-50 border border-green-200 rounded-2xl p-12">
          <h2 className="text-4xl font-bold text-green-700 mb-4">Check-out Complete</h2>
          <p className="text-lg text-gray-700 mb-8">Your check-out has been successfully recorded.</p>
          <button
            onClick={() => window.location.href = "/dashboard/participant"}
            className="px-10 py-4 bg-[#14532D] text-white rounded-xl font-semibold"
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
        <TopBar {...userData} />

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