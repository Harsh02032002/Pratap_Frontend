import React, { useState, useEffect } from "react";
import { 
  Save, RefreshCw, 
  Sparkles, CheckCircle2, ShieldAlert
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
  const [defaultBookingAmount, setDefaultBookingAmount] = useState(500);
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
          setDefaultBookingAmount(settingsRes.settings.defaultBookingAmount ?? 500);
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
          gst_percentage: Number(gstPercentage),
          defaultBookingAmount: Number(defaultBookingAmount)
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

  if (loading) {
    return (
      <div className="p-8 space-y-4 flex flex-col items-center justify-center min-h-[400px] font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
        <RefreshCw className="w-7 h-7 text-[#0E7C86] animate-spin" />
        <p className="text-[13px] font-semibold text-[#4A5961]">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* ── Banner Notification ── */}
      {banner.show && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-[12px] shadow-xl transition-all duration-300 ${
            banner.type === "success" 
              ? "bg-[#0E7C86] text-white" 
              : "bg-rose-600 text-white"
          }`}
        >
          {banner.type === "success" ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          <p className="text-[12px] font-semibold">{banner.text}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Settings</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage platform preferences and profile</p>
        </div>
      </div>

      {/* ── Top Stat Cards (NO ICONS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Commission Rate</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{commissionPercentage}%</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">GST on Commission</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{gstPercentage}%</h3>
          </div>
        </div>
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Default Booking Amount</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">₹{Number(defaultBookingAmount || 500).toLocaleString("en-IN")}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* ── Left Side: Commission Split Setting ── */}
        <div className="md:col-span-2 space-y-4">
          
          {/* Card: Platform Commission Calibration */}
          <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 space-y-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A]">Platform Commission</h3>
              <p className="text-[12px] text-[#4A5961]">Configure platform fee, GST, and default booking token amount</p>
            </div>

            <div className="p-4 bg-[#F9FAFB] rounded-[8px] border border-[#E1E6EA] space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#10242A]">Commission %</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-16 bg-white border border-[#CBD3D9] rounded-[6px] py-1 px-2 text-center text-[13px] font-bold text-[#10242A] focus:outline-none focus:border-[#0E7C86] transition-all shadow-xs"
                  />
                  <span className="text-[13px] font-semibold text-[#4A5961]">%</span>
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
                className="w-full h-1.5 bg-[#CBD3D9] rounded-lg appearance-none cursor-pointer accent-[#0E7C86]"
              />

              <div className="border-t border-dashed border-[#CBD3D9] my-2" />

              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-[#10242A]">GST on Commission %</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-16 bg-white border border-[#CBD3D9] rounded-[6px] py-1 px-2 text-center text-[13px] font-bold text-[#10242A] focus:outline-none focus:border-[#0E7C86] transition-all shadow-xs"
                  />
                  <span className="text-[13px] font-semibold text-[#4A5961]">%</span>
                </div>
              </div>

              <div className="border-t border-dashed border-[#CBD3D9] my-2" />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13px] font-semibold text-[#10242A] block">Default Booking Amount (₹)</label>
                  <span className="text-[12px] text-[#4A5961] block">Configured token amount charged for room/property bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#4A5961]">₹</span>
                  <input 
                    type="number" 
                    min="0"
                    value={defaultBookingAmount}
                    onChange={(e) => setDefaultBookingAmount(Math.max(0, Number(e.target.value)))}
                    className="w-24 bg-white border border-[#CBD3D9] rounded-[6px] py-1 px-2 text-center text-[13px] font-bold text-[#10242A] focus:outline-none focus:border-[#0E7C86] transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Live Calculator Visualizer */}
              <div className="bg-white rounded-[8px] p-3.5 border border-[#E1E6EA] shadow-xs space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">
                  <Sparkles size={12} className="text-[#0E7C86]" /> Live Earnings Calculator
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#4A5961] font-medium">Default Booking Amount:</span>
                  <span className="font-bold text-[#0E7C86]">₹{Number(defaultBookingAmount || 500).toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-dashed border-[#E1E6EA] my-1.5" />
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-[#0E7C86]">Admin Commission ({commissionPercentage}%)</span>
                    <span className="text-[11px] text-[#4A5961]">Admin gets (before GST)</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#0E7C86]">₹{((Number(defaultBookingAmount || 500) * commissionPercentage) / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-rose-600">GST on Commission ({gstPercentage}%)</span>
                    <span className="text-[11px] text-[#4A5961]">Govt. Tax</span>
                  </div>
                  <span className="text-[13px] font-bold text-rose-600">₹{(((Number(defaultBookingAmount || 500) * commissionPercentage / 100) * gstPercentage) / 100).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-[#10242A]">Owner Earnings</span>
                    <span className="text-[11px] text-[#4A5961]">Net Owner Payout</span>
                  </div>
                  <span className="text-[14px] font-bold text-[#10242A]">₹{(Number(defaultBookingAmount || 500) - ((Number(defaultBookingAmount || 500) * commissionPercentage) / 100) - (((Number(defaultBookingAmount || 500) * commissionPercentage / 100) * gstPercentage) / 100)).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-[#0E7C86] hover:bg-[#0B666E] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} /> {savingSettings ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          {/* Card: Account Profile Settings */}
          <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 space-y-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A]">My Profile</h3>
              <p className="text-[12px] text-[#4A5961]">Update your superadmin contact details</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#10242A]">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#10242A]">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#10242A]">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-[#F9FAFB] border border-[#E1E6EA] rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium text-[#708088] cursor-not-allowed outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-[#10242A]">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-[#0E7C86] hover:bg-[#0B666E] text-white px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} /> {profileSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right Side: Change Password ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 space-y-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#10242A]">Change Password</h3>
              <p className="text-[12px] text-[#4A5961]">Update your account password</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#10242A]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#10242A]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-[#10242A]">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-1.5 bg-[#0E7C86] hover:bg-[#0B666E] text-white rounded-[8px] text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
