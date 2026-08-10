import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson } from "../../utils/api";
import { 
  User, CheckCircle2, AlertCircle, Save 
} from "lucide-react";

export default function OwnerProfile() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [name, setName] = useState(owner.name || owner.profile?.name || "");
  const [email, setEmail] = useState(owner.email || owner.profile?.email || "");
  const [phone, setPhone] = useState(owner.phone || owner.profile?.phone || "");
  const [address, setAddress] = useState(owner.address || owner.profile?.address || "");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // The cached login session (owner_user) is a snapshot taken at last login —
  // it goes stale the moment a superadmin approves a profile-change request.
  // Refetch the live Owner record so this page shows what's actually saved.
  useEffect(() => {
    if (!owner?.loginId) return;
    fetchJson(`/api/owners/${encodeURIComponent(owner.loginId)}`)
      .then((fresh) => {
        if (!fresh) return;
        setName(fresh.name || "");
        setEmail(fresh.email || "");
        setPhone(fresh.phone || "");
        setAddress(fresh.address || "");
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await fetchJson("/api/owner-change-requests/submit", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          requestType: "profile",
          requestedChanges: { name, phone, address }
        })
      });
      if (data.success) {
        setSuccess("Changes submitted for Superadmin approval.");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setSuccess(data.message || "Failed to submit request.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setSuccess(err.message || "Failed to submit request.");
      setTimeout(() => setSuccess(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Owner Profile Settings" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Profile Settings</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage your property owner profile name, credentials, and contact verification settings.</p>
        </div>
      </div>

      <div className="max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
        <h3 className="font-serif text-[20px] text-foreground border-b border-border/60 pb-3">Personal Details</h3>

        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all cursor-not-allowed opacity-60"
                disabled
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Phone Number</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Address</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button 
              type="submit"
              disabled={loading}
              className="px-6 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              <Save size={14} /> {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </PropertyOwnerLayout>
  );
}
