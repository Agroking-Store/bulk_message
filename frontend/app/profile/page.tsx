"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Edit, Shield, Activity, LogOut, Key, Smartphone, MoreVertical, Info, HelpCircle, Loader2, Camera, Check, X, Eye, EyeOff } from "lucide-react";
import Topbar from '@/components/Topbar';
import Sidebar from '@/components/sidebar';
import { profileApi } from '@/lib/api/profile';
import { reportsApi } from '@/lib/api/reports';
import { useUser } from '@/lib/context/UserContext';
import ImageCropper from '@/components/report/ImageCropper';

export default function ProfilePage() {
  const { user: contextUser, refreshUser, loading: userLoading } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [openMenu, setOpenMenu] = useState(false);

  // Cropper state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
  if (contextUser) {
    setFormData(contextUser);
if (contextUser.email) {
      localStorage.setItem("userEmail", contextUser.email);
      console.log("Email saved in memory:", contextUser.email);
    }
  }
}, [contextUser]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const reportStats = await reportsApi.getStats();
      setStats(reportStats);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await profileApi.updateProfile(formData);
      await refreshUser(); // Update global context
      if (formData.email) {
      localStorage.setItem("userEmail", formData.email);
    }
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
      const result = await profileApi.uploadAvatar(file);
      console.log('Avatar upload result:', result);
      await refreshUser(); // Update global context
      console.log('User after refresh:', contextUser);
      setShowCropper(false);
      setSelectedImage(null);
      alert("Avatar updated successfully!");
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert("Failed to upload avatar");
    }
  };

  const handleSendOTP = async () => {
    try {
      await profileApi.send2FAOTP();
      setOtpSent(true);
      alert("Verification code sent to your email!");
    } catch (error) {
      alert("Failed to send OTP");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const res = await profileApi.verify2FA(otpCode);
      await refreshUser(); 
      setShow2FAModal(false);
      setOtpSent(false);
      setOtpCode("");
      alert(res.message);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleChangePassword = async () => {
    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!passwordRegex.test(passwordData.newPassword)) {
      setPasswordError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&#)");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    setPasswordError(null);
    try {
      await profileApi.changePassword(passwordData);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully!");
    } catch (error: any) {
      setPasswordError(error.message);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="animate-spin text-[#087063]" size={48} />
      </div>
    );
  }

  if (!contextUser) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center flex-col gap-4">
        <p className="text-gray-500 font-bold">Please log in to view your profile.</p>
        <button
          onClick={() => window.location.href = "/auth/sign-in"}
          className="bg-[#087063] text-white px-6 py-2 rounded-lg font-bold"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <Topbar title="Profile" />
       <main className="flex-1 overflow-y-auto pt-20 px-6 md:px-10">
          <div className="w-full  mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mt-[20px]">Profile Setting</h1>
              <p className="text-gray-600 text-m font-medium">Manage your profile setting and personal information.</p>
            </div>

            {/* Main Profile Card */}
            <div className="bg-white rounded-xl border border-[#075E54] shadow-sm p-8 mb-5 relative">

              {editMode ? (
                <div className="absolute top-6 right-16 flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center gap-2 bg-[#087063] px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-[#075E54] transition-all active:scale-95 shadow-sm"
                  >
                    Save <Check size={14} />
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setFormData(contextUser); }}
                    className="flex items-center gap-2 bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-300 transition-all active:scale-95 shadow-sm"
                  >
                    Cancel <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute top-6 right-16 flex items-center gap-2 bg-[#087063] px-4 py-2 rounded-lg text-m font-bold text-white hover:bg-[#075E54] transition-all active:scale-95 shadow-sm"
                >
                  Edit <Edit size={15} />
                </button>
              )}

              {/* Three Dot Menu */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => setOpenMenu(!openMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <MoreVertical size={20} />
                </button>

                {/* Dropdown */}
                {openMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Info size={16} />
                      About Us
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <HelpCircle size={16} />
                      Help
                    </button>
                    <button
                      onClick={() => { localStorage.clear(); window.location.href = "/auth/sign-in"; }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-lg font-medium text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={20} />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-center">
               {/* Profile Image Box */}
<div className="w-48 text-center shrink-0">
  <div className="bg-[#075E54]/10 p-4 rounded-xl relative group border border-[#075E54]"> 
    <img
      src={contextUser?.avatar ? (contextUser.avatar.startsWith('http') ? contextUser.avatar : `http://localhost:4000${contextUser.avatar}`) : "/profile (2).png"}
      alt="Admin"
      className="w-32 h-32 rounded-full mx-auto object-cover shadow-sm transition-opacity group-hover:opacity-75"
    />
    <button
      onClick={handleAvatarClick}
      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full w-32 h-32 mx-auto"
    >
      <Camera className="text-white" size={24} />
    </button>
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      className="hidden"
      accept="image/*"
    />
  </div>
</div>

                {/* Profile Details Grid */}
                < div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-16 flex-1 w-full" >
                  <DetailItem
                    label="Name"
                    value={formData.name}
                    isEdit={editMode}
                    onChange={(v: any) => setFormData({ ...formData, name: v })}
                  />
                  <DetailItem
                    label="Email ID"
                    value={formData.email}
                    isEdit={false}
                  />
<DetailItem
  label="DOB"
  value={
    formData.dob
      ? (() => {
          const parts = formData.dob.split("-"); 
          if (parts.length !== 3) return formData.dob;
          if (editMode) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return `${parts[1]}-${parts[0]}-${parts[2]}`;
        })()
      : ""
  }
  isEdit={editMode}
  onChange={(v: string) => {
    if (!v) {
      setFormData({ ...formData, dob: "" });
      return;
    }
    const [y, m, d] = v.split("-");
    setFormData({ ...formData, dob: `${d}-${m}-${y}` });
  }}
/>
                  <DetailItem
                    label="Gender"
                    value={formData.gender}
                    isEdit={editMode}
                    onChange={(v: any) => setFormData({ ...formData, gender: v })}
                    isSelect
                    options={["Male", "Female", "Other"]}
                  />
                  <DetailItem
                    label="Mobile Number"
                    value={formData.mobileNumber}
                    isEdit={editMode}
                    onChange={(v: any) => setFormData({ ...formData, mobileNumber: v })}
                  />
                  <DetailItem
  label="Role"
  value="Admin"
  isEdit={false}
/>
                </div >
              </div >
            </div >

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Activity Section */}
              <div className="bg-white rounded-xl border border-[#075E54] shadow-sm p-6 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                  <Activity size={18} className="text-[#075E54]" /> Account Activity Section
                </h2>
                <div className="space-y-5">
                  <ActivityRow label="Last Login Time" value={contextUser?.lastLogin ? new Date(contextUser.lastLogin).toLocaleString() : "N/A"} />
                  <ActivityRow label="Last Campaign Sent" value={stats?.totalAttempted?.toLocaleString() || "0"} />
                  <ActivityRow label="Success Rate" value={stats?.engagementRate || "0%"} />
                  <ActivityRow label="Failed messages" value={stats?.totalFailed?.toLocaleString() || "0"} />
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-xl border border-[#075E54] shadow-sm p-6 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-4 flex items-center gap-2">
                  <Shield size={18} className="text-[#075E54]" /> Security Section
                </h2>
                <div className="space-y-1">
                  <SecurityItem
                    icon={<Smartphone size={18} />}
                    label="Login Devices"
                    onClick={() => alert("Coming soon: Manage your active sessions.")}
                  />

                  <SecurityItem
                    icon={<Key size={18} />}
                    label="Change Password"
                    onClick={() => setShowPasswordModal(true)}
                  />
                  <button
                    onClick={() => { localStorage.clear(); window.location.href = "/auth/sign-in"; }}
                    className="flex items-center gap-3 w-full p-3.5 rounded-xl transition-all font-bold text-lg text-red-500 hover:bg-red-50 mt-1"
                  >
                    <span className="p-2 bg-red-50 rounded-[20px]"><LogOut size={20} /></span>
                    <span>Logout from all devices</span>
                  </button>
                </div>
              </div>
            </div>
          </div >
        </main >
      </div >

      {showCropper && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => { setShowCropper(false); setSelectedImage(null); }}
        />
      )}

      {/* 2FA Modal */}
      {
        show2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
              <button onClick={() => { setShow2FAModal(false); setOtpSent(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#075E54]/10 rounded-full flex items-center justify-center mb-6">
                  <Shield className="text-[#075E54]" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Two-Factor Authentication</h3>
                <p className="text-gray-600 mb-8">
                  {contextUser?.is2FAEnabled
                    ? "Are you sure you want to disable 2FA? You will need to verify with an OTP."
                    : "Enable 2FA to add an extra layer of security to your account."
                  }
                </p>

                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    className="w-full bg-[#087063] text-white py-3 rounded-xl font-bold hover:bg-[#075E54] transition-all"
                  >
                    Send Verification Code
                  </button>
                ) : (
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#075E54] outline-none text-center text-2xl tracking-[10px] font-bold"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    <button
                      onClick={handleVerify2FA}
                      className="w-full bg-[#087063] text-white py-3 rounded-xl font-bold hover:bg-[#075E54] transition-all"
                    >
                      Verify & {contextUser?.is2FAEnabled ? "Disable" : "Enable"}
                    </button>
                    <button onClick={handleSendOTP} className="text-[#087063] font-bold text-sm hover:underline">Resend code</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Password Modal */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
              <button onClick={() => { setShowPasswordModal(false); setPasswordError(null); setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#075E54]/10 rounded-full flex items-center justify-center mb-6">
                  <Key className="text-[#075E54]" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 font-primary">Change Password</h3>

                {passwordError && (
                  <div className="w-full bg-red-50 text-red-500 p-3 rounded-xl text-xs font-semibold border border-red-100 mb-4 text-center leading-relaxed">
                    {passwordError}
                  </div>
                )}

                <div className="w-full space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#075E54] outline-none pr-12"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075E54] transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#075E54] outline-none pr-12"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075E54] transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 ml-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#075E54] outline-none pr-12"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075E54] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-[#087063] text-white py-4 rounded-xl font-bold hover:bg-[#075E54] transition-all mt-4"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
}

function DetailItem({ label, value, isEdit, onChange, placeholder, isSelect, options }: any) {
  return (
    <div className="flex items-center">
      <span className="font-bold text-gray-800 w-36 shrink-0">{label} :-</span>
      {isEdit ? (
        isSelect ? (
          <select
            className="flex-1 bg-gray-50 border-b-2 border-[#075E54] outline-none px-2 py-1 font-medium text-gray-700"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
<input
  type={label === "DOB" ? "date" : "text"}
  max={label === "DOB" ? new Date().toISOString().split("T")[0] : undefined} 
  className="flex-1 bg-gray-50 border-b-2 border-[#075E54] outline-none px-2 py-1 font-medium text-gray-700"
  value={value || ""}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
/>
        )
      ) : (
        <span className="text-gray-600 font-medium">{value || "N/A"}</span>
      )}
    </div>
  );
}

function ActivityRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center group p-3 rounded-lg hover:bg-[#087063]/5 transition-colors">
      <span className="text-gray-600 font-bold">{label}</span>
      <span className="text-gray-300 font-black px-2">:</span>
      <span className="text-gray-800 font-bold flex-1 text-right">{value}</span>
    </div>
  );
}

function SecurityItem({ icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3.5 rounded-xl transition-all font-bold text-lg text-gray-700 hover:bg-[#087063]/5 hover:text-[#087063]"
    >
      <span className="p-2 bg-gray-50 rounded-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}