"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

type Step = 1 | 2 | 3;
type GpsStatus = "idle" | "checking" | "verified" | "error";

// Igire premises: 36 KG 549 St, Kigali
const IGIRE_LAT = -1.9309836;
const IGIRE_LNG = 30.0745498;
const IGIRE_RADIUS_METERS = 200;

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

export default function ParticipantAttendancePage() {
  const [step, setStep] = useState<Step>(1);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (step !== 2 || cameraActive) return;

    let stream: MediaStream;

    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
        setCameraActive(true);
      })
      .catch(() => {
        setCameraActive(false);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
    };
  }, [step, cameraActive]);

  const userData = {
    userName: "Alice Uwera",
    programName: "Web fundamentals",
    isOnline: true,
    sessionDate: "Today: Friday, 6 Feb 2026",
    checkInWindow: "08:00 - 08:30",
    currentTime: "08:52",
  };

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
        const { latitude, longitude } = pos.coords;
        const distance = distanceInMeters(
          latitude,
          longitude,
          IGIRE_LAT,
          IGIRE_LNG
        );

        setGpsInfo(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);

        if (distance <= IGIRE_RADIUS_METERS) {
          setGpsStatus("verified");
          setCheckInTime(new Date().toLocaleString());
          setTimeout(() => setStep(2), 800);
        } else {
          setGpsStatus("error");
          setGpsError(
            "You are not at Igire Rwanda Organisation premises. Please move closer and retry."
          );
        }
      },
      () => {
        setGpsStatus("error");
        setGpsError("Unable to verify location. Please check GPS permissions.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function handleCameraNext() {
    setStep(3);
  }

  function renderStepper() {
    const circles = [1, 2, 3] as Step[];

    return (
      <div className="flex items-center gap-6 mb-10">
        {circles.map((value, index) => (
          <div key={value} className="flex items-center gap-6">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold"
              style={{ background: value <= step ? "#14532D" : "#D1D5DB" }}
            >
              {value}
            </div>
            {index < circles.length - 1 && (
              <div className="hidden sm:block flex-1 border-t border-dashed border-gray-400 min-w-[60px]" />
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
          <section className="bg-[#E3F6E5] rounded-2xl border border-[#16A34A] shadow-sm p-6 max-w-xl">
            <div className="flex items-start gap-3 mb-3">
              <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14532D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <h2 className="text-2xl font-black text-[#14532D]">
                Check-in verified
              </h2>
            </div>
            <p className="text-sm text-[#111111] mb-1">
              <span className="font-semibold">Time :</span>{" "}
              {checkInTime ?? ""}
            </p>
            <p className="text-sm text-[#111111] mb-1">
              <span className="font-semibold">GPS :</span>{" "}
              {gpsInfo ?? "Current device location"}
            </p>
            <p className="text-sm text-[#111111] mt-4">
              Wait for camera verification.
            </p>
          </section>
        );
      }

      return (
        <section className="max-w-xl">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">
            Step 1: GPS Verification
          </h2>
          <p className="text-sm text-[#111111] mb-6">
            We need to confirm you are at Igire Rwanda Organisation premises.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <button
              type="button"
              onClick={handleVerifyLocation}
              disabled={gpsStatus === "checking"}
              className="h-12 px-8 rounded-lg text-white font-semibold disabled:opacity-70"
              style={{ background: "#14532D" }}
            >
              {gpsStatus === "checking"
                ? "Checking the Live Location..."
                : "Verify the Location"}
            </button>

            {gpsStatus === "error" && gpsError && (
              <p className="mt-4 text-sm text-red-600">{gpsError}</p>
            )}
          </div>
        </section>
      );
    }

    if (step === 2) {
      return (
        <section className="max-w-xl">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">
            Step 2: Live Camera Capture
          </h2>
          <p className="text-sm text-[#111111] mb-6">
            Align your face in the frame so we can capture a verification image.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 flex flex-col items-center">
            <div className="w-full max-w-md aspect-video bg-black/5 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            </div>

            <button
              type="button"
              onClick={handleCameraNext}
              className="h-12 px-10 rounded-lg text-white font-semibold"
              style={{ background: "#14532D" }}
            >
              Capture & Continue
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="max-w-xl">
        <h2 className="text-2xl font-bold text-[#111111] mb-4">
          Step 3: Attendance Verified
        </h2>
        <div className="bg-[#E3F6E5] rounded-2xl border border-[#16A34A] shadow-sm p-6 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#14532D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <h3 className="text-2xl font-black text-[#14532D]">
              Attendance Check‑in completed
            </h3>
          </div>
          <p className="text-sm text-[#111111] mb-1">
            <span className="font-semibold">Time :</span>{" "}
            {checkInTime ?? new Date().toLocaleString()}
          </p>
          <p className="text-sm text-[#111111] mb-1">
            <span className="font-semibold">GPS :</span>{" "}
            {gpsInfo ?? "Igire Rwanda Organisation Position"}
          </p>
          <p className="text-sm text-[#111111] mt-4">
            You can now wait for Check‑Out time.
          </p>
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

        <main className="px-12 py-10 bg-white min-h-screen">
          <div className="max-w-5xl mx-auto">
            {renderStepper()}
            {renderStepContent()}

            <div className="mt-10">
              <DashboardFooter />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
