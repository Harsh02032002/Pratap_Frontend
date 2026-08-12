import React, { useState, useEffect, useCallback } from "react";
import StaffLayout from "../../components/StaffLayout";
import {
  Search, Home, ShieldCheck, AlertCircle, Phone, Mail,
  Loader2, Users, RefreshCw, Calendar, Trash2
} from "lucide-react";
import { getApiBase, getAuthHeader } from "../../utils/api";
import { getActiveOwnerPropertyId } from "../../utils/propertyowner";

function getStaffSession() {
  try {
    const raw = sessionStorage.getItem("staff_session") || localStorage.getItem("staff_session");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

const STATUS_COLOR = {
  active:   "bg-emerald-50 text-emerald-600 border-emerald-100",
  pending:  "bg-amber-50 text-amber-600 border-amber-100",
  inactive: "bg-slate-50 text-slate-400 border-slate-100",
  suspended:"bg-rose-50 text-rose-600 border-rose-100",
};

export default function StaffTenants() {
  const staff = getStaffSession();
  const parentLoginId = staff?.parentLoginId || "";

  const [allTenants, setAllTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchTenants = useCallback(async () => {
    if (!parentLoginId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const propertyId = getActiveOwnerPropertyId();
      const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : "";
      const res = await fetch(`${getApiBase()}/api/tenants/owner/${parentLoginId}${qs}`, { headers: getAuthHeader() });
      const data = await res.json();
      const list = data?.tenants || data?.data || (Array.isArray(data) ? data : []);
      setAllTenants(list.filter(t => !t.isDeleted && t.status !== "inactive"));
    } catch (e) {
      setError("Failed to load tenants. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [parentLoginId]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const filtered = allTenants.filter(t => {
    const q = search.toLowerCase();
    return !q ||
      (t.name || "").toLowerCase().includes(q) ||
      (t.roomNo || "").toLowerCase().includes(q) ||
      (t.loginId || "").toLowerCase().includes(q) ||
      (t.phone || "").includes(q);
  });

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Are you sure you want to delete tenant ${tenant.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/api/tenants/${tenant._id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        setAllTenants(prev => prev.filter(t => t._id !== tenant._id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete tenant');
      }
    } catch (e) {
      alert('Failed to delete tenant: ' + e.message);
    }
  };

  return (
    <StaffLayout title="Tenants" subtitle="All residents assigned to your property">
      <div className="space-y-6">

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 w-full sm:w-[400px] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, room, phone, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-semibold w-full text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black border border-blue-100">
              <Users size={12} className="inline mr-1" />{allTenants.length} Tenants
            </div>
            <button onClick={fetchTenants} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all">
              <RefreshCw size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="text-sm font-bold">Loading tenants...</span>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl px-5 py-4 text-sm font-bold flex items-center gap-3">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-20 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm">
              {search ? "No tenants match your search" : "No tenants found for this property"}
            </p>
          </div>
        )}

        {/* Tenant Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((t) => {
              const initials = (t.name || "T").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
              const statusCls = STATUS_COLOR[t.status] || STATUS_COLOR.pending;
              const kycVerified = t.kycStatus === "verified";
              const moveIn = t.moveInDate ? new Date(t.moveInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

              return (
                <div key={t._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {t.photoDataUrl ? (
                        <img src={t.photoDataUrl} alt={t.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                        {kycVerified
                          ? <ShieldCheck size={10} className="text-emerald-500" />
                          : <AlertCircle size={10} className="text-amber-500" />}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-base font-black text-slate-900 tracking-tight truncate">{t.name}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>
                          {t.status || "pending"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {t.roomNo && (
                          <span className="flex items-center gap-1"><Home size={10} className="text-blue-400" />Room {t.roomNo}{t.bedNo ? ` Bed ${t.bedNo}` : ""}</span>
                        )}
                        {t.phone && (
                          <span className="flex items-center gap-1"><Phone size={10} className="text-blue-400" />{t.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Login ID</p>
                      <p className="text-[10px] font-black text-slate-700 font-mono">{t.loginId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rent</p>
                      <p className="text-[10px] font-black text-slate-700">₹{t.agreedRent || "—"}</p>
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        onClick={() => handleDeleteTenant(t)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Tenant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
