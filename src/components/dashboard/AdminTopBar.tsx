'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminTopBarProps {
  userName: string;
  userRole: string;
  profilePhotoUrl?: string | null;
}

export default function AdminTopBar({ userName, userRole, profilePhotoUrl }: AdminTopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [previewImage, setPreviewImage] = useState<string | null>(profilePhotoUrl || null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          profilePhotoUrl: previewImage,
        }),
      });

      if (res.ok) {
        setIsProfileModalOpen(false);
        window.location.reload(); // Refresh to securely apply updates across all dashboard states
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0 sticky top-0 z-40">
      <div className="flex items-center w-full sm:w-auto min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Admin Dashboard</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 flex-1 sm:flex-initial justify-end w-full sm:w-auto min-w-0">
        {/* Search Bar - Hidden on mobile */}
        <div className="relative hidden sm:block flex-1 sm:flex-initial min-w-[12rem]">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 md:w-64 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <svg className="h-5 sm:h-6 w-5 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V7a5 5 0 00-10 0v5l-5 5h5m0 0v1a3 3 0 006 0v-1m-6 0h6" />
          </svg>
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
            title="Edit Profile"
          >
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={userName} className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-[#2E7D32] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
             <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 focus:outline-none bg-gray-100/50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                disabled={saving}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
             
             <h2 className="text-2xl font-black text-gray-900 text-center mb-6">Edit Profile</h2>

             <form onSubmit={handleSaveProfile} className="flex flex-col items-center">
                <div className="relative group mb-6">
                  {previewImage ? (
                     <img src={previewImage} alt="Preview" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
                  ) : (
                     <div className="w-28 h-28 rounded-full bg-[#E8F5E9] flex items-center justify-center border-4 border-white shadow-lg">
                       <span className="text-4xl font-bold text-[#2E7D32]">{editName.charAt(0).toUpperCase()}</span>
                     </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-[#2E7D32] text-white p-2.5 rounded-full cursor-pointer shadow-md hover:bg-[#1B5E20] transition-transform hover:scale-110 active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} disabled={saving} />
                  </label>
                </div>

                <div className="w-full mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    minLength={2}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all outline-none text-gray-900 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}