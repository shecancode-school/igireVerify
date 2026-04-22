"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun, Bell, Lock } from "lucide-react";

export default function ParticipantSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Settings state
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);

  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load theme preference
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme as "light" | "dark");
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Save theme preference
      localStorage.setItem("theme", theme);

      // Save notification preferences
      const response = await fetch("/api/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
          attendanceReminders,
        }),
      });

      if (response.ok) {
        setMessage("Settings saved successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A] mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium text-sm group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your preferences and notifications</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Name</p>
              <p className="text-base text-gray-900 font-medium">{user?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Email</p>
              <p className="text-base text-gray-900 font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Role</p>
              <p className="text-base text-gray-900 font-medium capitalize">
                {user?.role || "N/A"}
              </p>
            </div>
            {user?.programName && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Program</p>
                <p className="text-base text-gray-900 font-medium">{user.programName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                className="w-4 h-4 accent-[#16A34A]"
              />
              <span className="text-gray-900 font-medium">Light Mode</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                className="w-4 h-4 accent-[#16A34A]"
              />
              <span className="text-gray-900 font-medium">Dark Mode</span>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div>
                <p className="text-gray-900 font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div>
                <p className="text-gray-900 font-medium">Push Notifications</p>
                <p className="text-sm text-gray-500">Get instant alerts on your device</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div>
                <p className="text-gray-900 font-medium">Attendance Reminders</p>
                <p className="text-sm text-gray-500">Reminders before check-in windows close</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendanceReminders}
                  onChange={(e) => setAttendanceReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-[#16A34A]" />
            <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
          </div>
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <div>
              <p className="text-gray-900 font-medium">Change Password</p>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-[#16A34A] text-white rounded-xl font-semibold hover:bg-[#14532D] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-xl text-center font-medium ${
              message.includes("successfully")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

