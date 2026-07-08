import React, { useState } from "react";
import { api } from "../api";
import { useAuth } from "../components/AuthContext";
import { 
  User, 
  Lock, 
  Image, 
  ShieldCheck, 
  Activity, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";

const AVATAR_OPTIONS = [
  { name: "Bull Analyst", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" },
  { name: "Risk Strategist", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" },
  { name: "Global Allocator", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" },
  { name: "Sovereign Specialist", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" }
];

export function Profile() {
  const { user, updateProfile } = useAuth();
  
  // Profile update state
  const [name, setName] = useState(user?.name || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || AVATAR_OPTIONS[0].url);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError("Username cannot be blank.");
      setProfileLoading(false);
      return;
    }

    try {
      await updateProfile(name, profileImage);
      setProfileSuccess("Investor profile details synchronized.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("Confirm password does not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Security credentials updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Credential change rejected.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
          My Account Settings
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Customize your investor alias, update security credentials, and select your avatar badge.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT CARD: USER ALIAS & CHOOSE AVATAR */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <User className="h-5 w-5 text-emerald-500" />
            <span>Profile Identity</span>
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {profileSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Profile Image View */}
              <div className="text-center sm:text-left space-y-2">
                <span className="block text-xs font-semibold text-slate-400 font-sans">Active Profile Badge</span>
                <img
                  src={profileImage}
                  alt="Profile Avatar"
                  className="h-20 w-20 rounded-full mx-auto sm:mx-0 object-cover border-2 border-emerald-500 shadow-md shadow-emerald-500/10"
                />
              </div>

              {/* Display Fields */}
              <div className="sm:col-span-2 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Registered Email (Read-Only)</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Investor Username</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Avatar Badge Selection Gallery */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-slate-400 font-sans flex items-center gap-1">
                <Image className="h-4 w-4" />
                <span>Select Investor Theme Avatar</span>
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((av) => {
                  const isSel = profileImage === av.url;
                  return (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => setProfileImage(av.url)}
                      className={`p-2.5 rounded-xl border text-center space-y-2 transition-all ${
                        isSel 
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <img src={av.url} alt={av.name} className="h-10 w-10 rounded-full mx-auto object-cover" />
                      <span className="text-[10px] font-bold block">{av.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {profileLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>SYNCHRONIZE PROFILE</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT CARD: PASSWORD UPDATER */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base font-sans flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Lock className="h-5 w-5 text-emerald-500" />
            <span>Update Credentials</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-sans">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full h-11 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {passwordLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <span>UPDATE PASSWORD</span>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
export default Profile;
