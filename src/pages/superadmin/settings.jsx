import React, { useState, useEffect } from "react";
import { 
  Percent, User, Lock, Save, RefreshCw, 
  ChevronRight, Sparkles, CheckCircle2, ShieldAlert
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function SuperadminSettings() {
  useSEO({
    title: "Settings – Roomhy Superadmin",
    description: "Manage commission rates and profile settings.",
  });

  const [commissionPercentage, setCommissionPercentage] = useState(10);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Alert message banner state
  const [banner, setBanner] = useState({ show: false, text: "", type: "success" });

  const showBanner = (text, type = "success") => {
    setBanner({ show: true, text, type });
    setTimeout(() => setBanner({ show: false, text: "", type: "success" }), 4000);
  };

  useEffect(() => {
    async function loadSettingsAndProfile() {
      try {
        const [settingsRes, profileRes] = await Promise.all([
          fetchJson("/api/superadmin/settings").catch(() => null),
          fetchJson("/api/users/profile").catch(() => null)
        ]);

        if (settingsRes && settingsRes.success && settingsRes.settings) {
          setCommissionPercentage(settingsRes.settings.commission_percentage ?? 10);
          setGstPercentage(settingsRes.settings.gst_percentage ?? 18);
        }
        if (profileRes && profileRes.success && profileRes.user) {
          setProfile({
            firstName: profileRes.user.firstName || profileRes.user.name?.split(' ')[0] || "",
            lastName: profileRes.user.lastName || profileRes.user.name?.split(' ').slice(1).join(' ') || "",
            phone: profileRes.user.phone || "",
            email: profileRes.user.email || ""
          });
        }
      } catch (err) {
        console.error("Failed to load settings or profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettingsAndProfile();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetchJson("/api/superadmin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          commission_percentage: Number(commissionPercentage),
          gst_percentage: Number(gstPercentage)
        })
      });
      if (res.success) {
        showBanner("Platform settings updated successfully!", "success");
      } else {
        showBanner(res.message || "Failed to update settings", "error");
      }
    } catch (err) {
      showBanner("Error saving settings: " + err.message, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetchJson("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone
        })
      });
      if (res.success) {
        showBanner("Profile details saved successfully!", "success");
      } else {
        showBanner(res.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showBanner("Error updating profile: " + err.message, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showBanner("Please fill in all password fields.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showBanner("New passwords do not match.", "error");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetchJson("/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.success) {
        showBanner("Password changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showBanner(res.message || "Failed to update password", "error");
      }
    } catch (err) {
      showBanner("Error updating password: " + err.message, "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  // Helper calculation for illustration
  const mockTenantPayment = 10000;
  const platformEarning = (mockTenantPayment * commissionPercentage) / 100;
  const gstOnCommission = (platformEarning * gstPercentage) / 100;
  const ownerPayout = mockTenantPayment - platformEarning - gstOnCommission;

  if (loading) {
    return (
      <div className="p-8 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-16">
      {/* ── Banner Notification ── */}
      {banner.show && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 ${
            banner.type === "success" 
              ? "bg-emerald-600 text-white" 
              : "bg-rose-600 text-white"
          }`}
        >
          {banner.type === "success" ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          <p className="text-xs font-bold uppercase tracking-wider">{banner.text}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Superadmin</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-blue-600">Settings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ── Left Side: Commission Split Setting ── */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card: Platform Commission Calibration */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Platform Commission</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Set your percentage</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600">Commission %</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-3 text-center text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  />
                  <span className="text-sm font-black text-slate-500">%</span>
                </div>
              </div>

              {/* Slider */}
              <input 
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />

              <div className="border-t border-dashed border-slate-200 my-4" />

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600">GST on Commission %</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-3 text-center text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  />
                  <span className="text-sm font-black text-slate-500">%</span>
                </div>
              </div>

              {/* Live Calculator Visualizer */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-inner space-y-3">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <Sparkles size={11} className="text-purple-600" /> Live Earnings Calculator
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Booking Amount:</span>
                  <span className="font-bold text-slate-800">₹{mockTenantPayment.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-dashed border-slate-100 my-2" />
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Admin Commission ({commissionPercentage}%)</span>
                    <span className="text-[9px] text-slate-400">Admin gets (before GST)</span>
                  </div>
                  <span className="text-sm font-black text-purple-700">₹{platformEarning.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">GST on Commission ({gstPercentage}%)</span>
                    <span className="text-[9px] text-slate-400">Govt. Tax</span>
                  </div>
                  <span className="text-sm font-bold text-rose-700">₹{gstOnCommission.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Owner Earnings</span>
                    <span className="text-[9px] text-slate-400">Net Owner Payout</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">₹{ownerPayout.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/10 disabled:opacity-50"
              >
                <Save size={14} /> {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          {/* Card: Account Profile Settings */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">My Profile</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Update your details</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200/60 rounded-xl py-3 px-4 text-xs font-bold text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/10 disabled:opacity-50"
                >
                  <Save size={14} /> {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right Side: Change Password ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Update your password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={14} /> {passwordSaving ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
