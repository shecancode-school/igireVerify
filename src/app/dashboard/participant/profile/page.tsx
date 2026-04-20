"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ParticipantProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch current user profile
    fetch("/api/auth/me").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setProfilePhotoUrl(data.profilePhotoUrl || null);
      }
    });
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    let uploadedUrl = profilePhotoUrl;
    if (newPhoto) {
      // Upload photo to backend (assume /api/users/profile-photo)
      const formData = new FormData();
      formData.append("photo", newPhoto);
      const uploadRes = await fetch("/api/users/profile-photo", {
        method: "POST",
        body: formData,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        uploadedUrl = data.url;
        setProfilePhotoUrl(uploadedUrl);
      } else {
        setMessage("Failed to upload photo");
        setSaving(false);
        return;
      }
    }
    // Save name and photo URL
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, profilePhotoUrl: uploadedUrl }),
    });
    if (res.ok) {
      setMessage("Profile updated successfully");
      window.dispatchEvent(new Event("profileUpdated"));
    } else {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 px-4 sm:px-0">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-900 border-b border-gray-100 pb-3">Edit Profile</h2>
      <div className="flex flex-col items-center mb-4">
        {profilePhotoUrl ? (
          <img src={profilePhotoUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover border-2 border-green-600 mb-2" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold mb-2">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="mt-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#14532D] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#0f3d23] disabled:opacity-50 transition-colors mt-2"
      >
        {saving ? "Saving changes..." : "Save Changes"}
      </button>
      {message && <div className={`mt-4 text-center text-sm font-medium p-3 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}
      </div>
    </div>
  );
}
