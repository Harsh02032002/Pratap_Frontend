import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { 
  clearOwnerRuntimeSession, 
  getOwnerRuntimeSession,
  fetchOwnerProperties,
  fetchOwnerRooms,
  fetchOwnerTenants,
  downloadCsv
} from "../../utils/propertyowner";
import { Building, UserCog, Shield, Globe, Lock, Check, Database, Download, Landmark, Eye, EyeOff, X, Loader2, Upload, FileCheck, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { fetchJson, getApiBase, getAuthHeader } from "../../utils/api";

function FieldRow({ label, value, masked, empty }) {
  const [show, setShow] = useState(false);
  const display = !value ? (
    <span className="text-muted-foreground/50 italic text-xs">Not provided</span>
  ) : masked ? (
    show ? value : "••••••" + String(value).slice(-4)
  ) : value;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0 gap-4">
      <span className="text-xs text-muted-foreground font-medium w-40 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-[13px] font-semibold text-foreground text-right">{display}</span>
        {masked && value && (
          <button onClick={() => setShow(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
            {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const owner = getOwnerRuntimeSession();

  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("owner_settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return {
      automaticRentReminders: true,
      maintenanceNotifications: true,
      emailNotifications: "all",
      language: "en",
    };
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bankData, setBankData]       = useState(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankEditOpen, setBankEditOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ accountHolder: "", bankName: "", branchName: "", accountNumber: "", ifscCode: "", upiId: "" });
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankProof, setBankProof] = useState({ url: "", name: "" });
  const [bankProofUploading, setBankProofUploading] = useState(false);

  const [pwModal, setPwModal] = useState(false);
  const [pwStep, setPwStep] = useState("otp"); // "otp" | "reset"
  const [pwOtp, setPwOtp] = useState("");
  const [pwToken, setPwToken] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetchJson(`/api/owners/${encodeURIComponent(owner.loginId)}`)
      .then(data => setBankData({
        accountHolder: data.checkinAccountHolderName || data.accountHolderName || "",
        bankName:      data.checkinBankName      || data.bankName      || "",
        branchName:    data.checkinBranchName    || data.branchName    || "",
        accountNumber: data.checkinBankAccountNumber || data.accountNumber || "",
        ifscCode:      data.checkinIfscCode      || data.ifscCode      || "",
        upiId:         data.checkinUpiId         || data.upiId         || "",
        locked:        !!data.bankLockedByVisit,
      }))
      .catch(() => setBankData(null))
      .finally(() => setBankLoading(false));
  }, [owner.loginId]);

  const handleExportBackup = async () => {
    setExporting(true);
    try {
      // 1. Fetch all data in parallel
      const [propertiesList, roomsResponse, tenantsList, rentsResponse, complaintsResponse] = await Promise.all([
        fetchOwnerProperties(owner.loginId, true),
        fetchOwnerRooms(owner.loginId).catch(() => ({ rooms: [] })),
        fetchOwnerTenants(owner.loginId),
        fetchJson(`/api/rents/owner/${encodeURIComponent(owner.loginId)}`).catch(() => []),
        fetchJson(`/api/complaints/owner/${encodeURIComponent(owner.loginId)}`).catch(() => [])
      ]);

      const roomsList = roomsResponse?.rooms || [];
      const rentsList = Array.isArray(rentsResponse) ? rentsResponse : rentsResponse?.rents || [];
      const complaintsList = Array.isArray(complaintsResponse) ? complaintsResponse : complaintsResponse?.complaints || [];

      // 2. Helper to trigger file download
      const downloadData = (filename, data, columnsToExtract) => {
        if (!data || data.length === 0) {
          console.warn(`No data to export for ${filename}`);
          return;
        }
        
        const rows = data.map(item => {
          const row = {};
          columnsToExtract.forEach(col => {
            const keys = col.split('.');
            let val = item;
            for (const k of keys) {
              val = val?.[k];
            }
            if (val && typeof val === 'object') {
              row[col.replace(/\./g, '_')] = JSON.stringify(val);
            } else {
              row[col.replace(/\./g, '_')] = val !== undefined && val !== null ? val : '';
            }
          });
          return row;
        });

        downloadCsv(filename, rows);
      };

      // 3. Export Properties
      if (propertiesList && propertiesList.length > 0) {
        downloadData(
          `properties_backup_${owner.loginId}.csv`, 
          propertiesList,
          ['_id', 'title', 'locationCode', 'address', 'locality', 'city', 'propertyType', 'gender', 'monthlyRent', 'isPublished', 'status', 'createdAt']
        );
      }

      // 4. Export Rooms
      if (roomsList && roomsList.length > 0) {
        downloadData(
          `rooms_backup_${owner.loginId}.csv`, 
          roomsList,
          ['_id', 'roomNo', 'type', 'beds', 'price', 'sharingType', 'isAvailable', 'status', 'createdAt']
        );
      }

      // 5. Export Tenants
      if (tenantsList && tenantsList.length > 0) {
        downloadData(
          `tenants_backup_${owner.loginId}.csv`, 
          tenantsList,
          ['_id', 'name', 'phone', 'email', 'loginId', 'roomNo', 'bedNo', 'agreedRent', 'status', 'kycStatus', 'moveInDate', 'createdAt']
        );
      }

      // 6. Export Rent Invoices
      if (rentsList && rentsList.length > 0) {
        downloadData(
          `rents_backup_${owner.loginId}.csv`, 
          rentsList,
          ['_id', 'tenantName', 'tenantLoginId', 'roomNumber', 'rentAmount', 'paidAmount', 'paymentStatus', 'paymentMethod', 'dueDate', 'createdAt']
        );
      }

      // 7. Export Complaints
      if (complaintsList && complaintsList.length > 0) {
        downloadData(
          `complaints_backup_${owner.loginId}.csv`, 
          complaintsList,
          ['_id', 'tenantName', 'tenantLoginId', 'category', 'status', 'urgency', 'description', 'createdAt']
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Export backup failed:", err);
      toast.error("Failed to export backup data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const handleScrollToBackup = () => {
      if (window.location.hash === "#backup") {
        const element = document.getElementById("backup");
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        }
      }
    };
    handleScrollToBackup();
    window.addEventListener("hashchange", handleScrollToBackup);
    return () => window.removeEventListener("hashchange", handleScrollToBackup);
  }, []);

  const openChangePassword = async () => {
    setPwError("");
    setPwOtp("");
    setPwToken("");
    setPwNew("");
    setPwConfirm("");
    setPwStep("otp");
    setPwLoading(true);
    setPwModal(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: owner.loginId })
      });
    } catch (err) {
      setPwError(err?.body || err?.message || "Failed to send OTP. Try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const verifyPwOtp = async () => {
    if (!pwOtp || pwOtp.length !== 6) { setPwError("Enter the 6-digit OTP sent to your email."); return; }
    setPwError("");
    setPwLoading(true);
    try {
      const data = await fetchJson("/api/auth/owner/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({ loginId: owner.loginId, otp: pwOtp })
      });
      setPwToken(data?.token || "");
      setPwStep("reset");
    } catch (err) {
      setPwError(err?.body || err?.message || "Invalid OTP.");
    } finally {
      setPwLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!pwNew || pwNew.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match."); return; }
    setPwError("");
    setPwLoading(true);
    try {
      await fetchJson("/api/auth/owner/forgot-password/reset-password", {
        method: "POST",
        body: JSON.stringify({ loginId: owner.loginId, token: pwToken, newPassword: pwNew })
      });
      setPwModal(false);
      toast.success("Password changed successfully!");
    } catch (err) {
      setPwError(err?.body || err?.message || "Failed to reset password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem("owner_settings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const hasBank = bankData && (
    bankData.accountHolder || bankData.bankName || bankData.accountNumber || bankData.upiId
  );

  const openBankEdit = () => {
    setBankForm({
      accountHolder: bankData?.accountHolder || "",
      bankName: bankData?.bankName || "",
      branchName: bankData?.branchName || "",
      accountNumber: bankData?.accountNumber || "",
      ifscCode: bankData?.ifscCode || "",
      upiId: bankData?.upiId || "",
    });
    setBankProof({ url: "", name: "" });
    setBankEditOpen(true);
  };

  // A changed account number is exactly the case a fraudster would exploit to
  // redirect payouts — require proof (passbook/cancelled cheque) before the
  // request can even be submitted for review.
  const accountNumberChanged = bankForm.accountNumber !== (bankData?.accountNumber || "");

  // Cloudinary rejects any single asset over 10MB at the account level —
  // that's enforced after upload regardless of transport, so chunking the
  // request doesn't help. Phone-camera photos of a passbook routinely blow
  // past that, so shrink the image client-side rather than asking the owner
  // to do it themselves.
  const compressImage = (file, maxDim, quality) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

  const uploadBankProof = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image (photo of the passbook or cheque), not a document file.");
      return;
    }
    setBankProofUploading(true);
    try {
      let uploadFile = file;
      const TEN_MB = 10 * 1024 * 1024;
      if (file.type.startsWith('image/') && file.size > TEN_MB) {
        uploadFile = await compressImage(file, 1920, 0.8);
        if (uploadFile.size > TEN_MB) {
          uploadFile = await compressImage(file, 1280, 0.6);
        }
      }
      const data = new FormData();
      data.append('image', uploadFile);
      const res = await fetch(`${getApiBase()}/api/upload`, {
        method: 'POST',
        body: data,
        headers: getAuthHeader()
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Upload failed');
      setBankProof({ url: json.url, name: file.name });
    } catch (err) {
      toast.error(err.message || "Failed to upload document.");
    } finally {
      setBankProofUploading(false);
    }
  };

  // Bank changes never apply instantly — same submit-then-approve pipeline as
  // Profile Settings. Superadmin review + approve is what actually updates
  // the Owner record (and anywhere else it's read from) once accepted.
  const submitBankUpdate = async (e) => {
    e.preventDefault();
    if (accountNumberChanged && !bankProof.url) {
      toast.error("Please upload a passbook or cancelled cheque photo to verify the new account number.");
      return;
    }
    setBankSubmitting(true);
    try {
      const requestedChanges = {
        checkinAccountHolderName: bankForm.accountHolder,
        checkinBankName: bankForm.bankName,
        checkinBranchName: bankForm.branchName,
        checkinBankAccountNumber: bankForm.accountNumber,
        checkinIfscCode: bankForm.ifscCode,
        checkinUpiId: bankForm.upiId,
      };
      if (bankProof.url) {
        requestedChanges.checkinBankProof = bankProof.url;
        requestedChanges.checkinBankProofName = bankProof.name;
      }
      const data = await fetchJson("/api/owner-change-requests/submit", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          requestType: "bank_details",
          requestedChanges
        })
      });
      if (data.success) {
        toast.success("Bank details submitted for Superadmin approval.");
        setBankEditOpen(false);
      } else {
        toast.error(data.message || "Failed to submit request.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setBankSubmitting(false);
    }
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Settings"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header Container (gets hidden on mobile view by first-child:has(h1) CSS rule) */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Settings</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">App preferences and configuration parameters.</p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs self-start sm:self-center"
        >
          {saveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
        </button>
      </div>

      {/* Main Content Container (remains visible on mobile view) */}
      <div className="max-w-4xl mx-auto space-y-6">

          {/* Property Settings */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-soft">
            <h3 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2.5">
              <Building className="w-5 h-5 text-primary" />
              Property Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20">
                <div>
                  <p className="font-bold text-sm text-foreground">Automatic Rent Reminders</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Send automatic reminders to tenants</p>
                </div>
                <input type="checkbox" checked={settings.automaticRentReminders} id="reminderCheck"
                  onChange={e => setSettings(p => ({ ...p, automaticRentReminders: e.target.checked }))}
                  className="size-5 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary" />
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20">
                <div>
                  <p className="font-bold text-sm text-foreground">Maintenance Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Receive alerts for maintenance requests</p>
                </div>
                <input type="checkbox" checked={settings.maintenanceNotifications} id="maintCheck"
                  onChange={e => setSettings(p => ({ ...p, maintenanceNotifications: e.target.checked }))}
                  className="size-5 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary" />
              </div>
            </div>
          </div>

          {/* Payment & Banking — pulled from KYC, edits go through Superadmin approval */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-primary" />
                Payment &amp; Banking
              </h3>
              {hasBank && (
                <button
                  onClick={openBankEdit}
                  className="inline-flex items-center gap-1 text-[11.5px] text-primary font-semibold hover:underline"
                >
                  Update
                </button>
              )}
            </div>

            {bankLoading ? (
              <div className="text-[13px] text-muted-foreground py-4 text-center">Loading...</div>
            ) : !hasBank ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-[13px] text-muted-foreground mb-2">No bank details found.</p>
                <a href="/propertyowner/kyc-verification" className="text-[12px] text-primary font-medium hover:underline">
                  Complete KYC to add your bank account →
                </a>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-1">
                <FieldRow label="Account Holder"  value={bankData.accountHolder} />
                <FieldRow label="Bank Name"        value={bankData.bankName} />
                <FieldRow label="Branch"           value={bankData.branchName} />
                <FieldRow label="Account Number"   value={bankData.accountNumber} masked />
                <FieldRow label="IFSC Code"        value={bankData.ifscCode} />
                <FieldRow label="UPI ID"           value={bankData.upiId} />
              </div>
            )}

            {bankData?.locked && (
              <p className="text-[11.5px] text-amber-600 mt-3 flex items-center gap-1.5">
                <Lock className="size-3" />
                Verified via KYC — any change you submit here still needs Superadmin approval before it takes effect.
              </p>
            )}
          </div>

          {/* Account Settings */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-soft">
            <h3 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2.5">
              <UserCog className="w-5 h-5 text-primary" />
              Account Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Notifications</label>
                <select className="w-full h-11 px-4 border border-border bg-card rounded-xl text-foreground text-sm focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={settings.emailNotifications}
                  onChange={e => setSettings(p => ({ ...p, emailNotifications: e.target.value }))}>
                  <option value="all">All Activities</option>
                  <option value="important">Important Only</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Language</label>
                <select className="w-full h-11 px-4 border border-border bg-card rounded-xl text-foreground text-sm focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={settings.language}
                  onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-soft">
            <h3 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-primary" />
              Privacy &amp; Security
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-xl bg-muted/20 gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">Password Update</p>
                <p className="text-xs text-muted-foreground mt-0.5">Secure your account by updating your credentials regularly.</p>
              </div>
              <button type="button"
                onClick={openChangePassword}
                className="px-4 h-10 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 self-start sm:self-center">
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          </div>

          {/* Data Backup & Export Card */}
          <div id="backup" className="border border-border bg-card rounded-2xl p-6 shadow-soft animate-in fade-in slide-in-from-bottom duration-200">
            <h3 className="text-[16px] font-bold text-foreground mb-4 flex items-center gap-2.5">
              <Database className="w-5 h-5 text-primary" />
              Data Backup &amp; Export
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-xl bg-muted/20 gap-4">
              <div>
                <p className="font-bold text-sm text-foreground">Complete Data Backup</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download all your property details, rooms, tenant list, rent invoices, and complaints into separate CSV files.</p>
              </div>
              <button 
                type="button" 
                disabled={exporting}
                onClick={handleExportBackup}
                className="px-5 h-10 bg-primary/15 hover:bg-primary/25 text-primary rounded-xl font-semibold text-xs transition-all shrink-0 flex items-center gap-2 self-start sm:self-center disabled:opacity-50 active:scale-95 duration-200 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
                {exporting ? "Backing up..." : "Export Data Backup"}
              </button>
            </div>
          </div>

          {/* Mobile Save Changes Button */}
          <div className="lg:hidden mt-6">
            <button
              onClick={handleSave}
              className="w-full px-5 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 text-xs shadow-md"
            >
              {saveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </button>
          </div>
        </div>
      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setPwModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Change Password</h3>
                <p className="text-[11.5px] text-slate-500">
                  {pwStep === "otp" ? "An OTP has been sent to your registered email." : "Enter your new password below."}
                </p>
              </div>
            </div>

            {pwError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-4 py-3">
                {pwError}
              </div>
            )}

            {pwStep === "otp" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pwOtp}
                    onChange={e => setPwOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter OTP from email"
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 tracking-widest"
                  />
                </div>
                <button
                  onClick={verifyPwOtp}
                  disabled={pwLoading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify OTP"}
                </button>
                <button onClick={openChangePassword} disabled={pwLoading} className="w-full text-center text-xs text-primary font-semibold hover:underline disabled:opacity-50">
                  Resend OTP
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">New Password</label>
                  <input
                    type="password"
                    value={pwNew}
                    onChange={e => setPwNew(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <button
                  onClick={submitNewPassword}
                  disabled={pwLoading}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Set New Password</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {bankEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setBankEditOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Update Bank Details</h3>
                <p className="text-[11.5px] text-slate-500">Submitted for Superadmin approval before it takes effect.</p>
              </div>
            </div>

            <form onSubmit={submitBankUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">Account Holder</label>
                <input
                  type="text"
                  value={bankForm.accountHolder}
                  onChange={e => setBankForm(p => ({ ...p, accountHolder: e.target.value }))}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">Bank Name</label>
                  <input
                    type="text"
                    value={bankForm.bankName}
                    onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">Branch</label>
                  <input
                    type="text"
                    value={bankForm.branchName}
                    onChange={e => setBankForm(p => ({ ...p, branchName: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">Account Number</label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm(p => ({ ...p, accountNumber: e.target.value }))}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  required
                />
              </div>

              {accountNumberChanged && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-tight mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" /> Bank Proof Required
                  </label>
                  <p className="text-[11px] text-amber-700/80 mb-3">
                    You changed the account number — upload a passbook photo or cancelled cheque so Superadmin can verify it before approving.
                  </p>

                  {bankProof.url ? (
                    <div className="flex items-center justify-between gap-3 bg-white border border-emerald-200 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[12px] font-semibold text-slate-700 truncate">{bankProof.name || "Document uploaded"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBankProof({ url: "", name: "" })}
                        className="text-[11px] font-semibold text-rose-600 hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 h-11 border-2 border-dashed border-amber-300 rounded-lg text-[12px] font-semibold text-amber-700 cursor-pointer hover:bg-amber-100/50 transition-colors">
                      {bankProofUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Upload Passbook / Cheque</>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={bankProofUploading}
                        onChange={e => uploadBankProof(e.target.files?.[0])}
                      />
                    </label>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">IFSC Code</label>
                  <input
                    type="text"
                    value={bankForm.ifscCode}
                    onChange={e => setBankForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-tight mb-2 block">UPI ID</label>
                  <input
                    type="text"
                    value={bankForm.upiId}
                    onChange={e => setBankForm(p => ({ ...p, upiId: e.target.value }))}
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={bankSubmitting || bankProofUploading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {bankSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit for Approval"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
