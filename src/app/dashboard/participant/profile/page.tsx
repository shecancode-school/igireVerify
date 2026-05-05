"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Save, AlertCircle, User as UserIcon, ShieldCheck } from "lucide-react";
import imageCompression from 'browser-image-compression';

export default function ParticipantProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
  
  const [name, setName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
      const file = e.target.files[0];
      setNewPhoto(file);
      
      // Turbo-Preview: Create an instant local URL for the UI
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMessage("");
      setError("");
    }
  };

  const handleSave = async () => {
    if (!name || name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");
    
    let uploadedUrl = profilePhotoUrl;
    
    if (newPhoto) {
      try {
        // Compress the image before uploading
        const options = {
          maxSizeMB: 0.1, // Target size: ~100KB
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(newPhoto, options);
        console.log(`Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
        
        const formData = new FormData();
        formData.append("photo", compressedFile);
        
        const uploadRes = await fetch("/api/users/profile-photo", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploadedUrl = data.url;
          setProfilePhotoUrl(uploadedUrl);
          setPreviewUrl(null);
        } else {
          const errorData = await uploadRes.json();
          setError(`Upload failed: ${errorData.details || "Configuration issue"}`);
          setSaving(false);
          return;
        }
      } catch (err) {
        console.error("Compression or upload error:", err);
        setError("An error occurred while preparing the image.");
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
      // Dispatch custom event to notify TopBar immediately
      window.dispatchEvent(new CustomEvent("profileUpdated", { 
        detail: { name, profilePhotoUrl: uploadedUrl } 
      }));
    } else {
      const errorData = await res.json().catch(() => ({}));
      setError(errorData.error || "Failed to update profile");
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password");
      } else {
        setPasswordMessage("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setSavingPassword(false);
    }
  };

  const displayImage = previewUrl || profilePhotoUrl;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-12">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            
            <div className="relative mb-6 group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-50 flex items-center justify-center relative">
                {displayImage ? (
                  <img 
                    src={displayImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    key={displayImage}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] flex items-center justify-center text-white text-4xl font-bold">
                    {name ? name.charAt(0).toUpperCase() : <UserIcon className="w-12 h-12 opacity-50" />}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-white text-xs font-medium">Change Photo</span>
                </div>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Change profile photo"
              />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">{name || "Loading..."}</h2>
            <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">Participant</p>
          </div>
        </div>

        {/* Right Column: Tabbed Settings */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setActiveTab("personal")}
                className={`flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold transition-colors ${
                  activeTab === "personal" 
                    ? "text-[#2E7D32] border-b-2 border-[#2E7D32] bg-white" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 flex justify-center items-center gap-2 py-4 text-sm font-bold transition-colors ${
                  activeTab === "security" 
                    ? "text-[#C47D0E] border-b-2 border-[#C47D0E] bg-white" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Security & Password
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              
              {/* Personal Information Tab */}
              {activeTab === "personal" && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  {message && (
                    <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium">
                      {message}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-[#2E7D32] hover:bg-[#256327] text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Save Personal Info
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <form onSubmit={handlePasswordChange} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#C47D0E] focus:ring-1 focus:ring-[#C47D0E] outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#C47D0E] focus:ring-1 focus:ring-[#C47D0E] outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#C47D0E] focus:ring-1 focus:ring-[#C47D0E] outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{passwordError}</p>
                    </div>
                  )}

                  {passwordMessage && (
                    <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium">
                      {passwordMessage}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex items-center justify-center w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {savingPassword ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Updating Security...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
