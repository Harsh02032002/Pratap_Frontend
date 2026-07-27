import React, { useEffect, useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import TenantAgreementModal from "../../components/propertyowner/TenantAgreementModal";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { 
  FileText, Search, Download, CheckCircle2, 
  Eye, Loader2, RefreshCw
} from "lucide-react";

export default function Agreement() {
  const owner = getOwnerRuntimeSession();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetchJson(`/api/tenants/owner/${encodeURIComponent(owner.loginId)}`, {
        headers: getAuthHeader()
      });
      const list = res.tenants || res.data || (Array.isArray(res) ? res : []);
      setTenants(list);
    } catch (err) {
      console.error("Error loading tenants for agreement page:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (owner?.loginId) loadTenants();
  }, [owner?.loginId]);

  const filteredTenants = tenants.filter(t => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.loginId || "").toLowerCase().includes(q) ||
      (t.roomNo || "").toLowerCase().includes(q)
    );
  });

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Tenant Rental Agreements" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Rental Agreements</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor e-signed tenant rental agreements, terms &amp; conditions, and digital compliance.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tenant name, room..."
              className="w-full bg-card border border-border rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-foreground outline-none focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={loadTenants}
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Resident / Tenant</th>
                <th className="px-6 py-3.5 font-semibold">Room &amp; Property</th>
                <th className="px-6 py-3.5 font-semibold">Move-In Date</th>
                <th className="px-6 py-3.5 font-semibold text-center">Agreement Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-muted-foreground">
                    <Loader2 className="size-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs font-medium">Loading rental agreements...</p>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-muted-foreground">
                    <FileText className="size-10 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs font-semibold">No rental agreements found</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t, index) => {
                  const isSigned = t.agreementSigned || t.agreementStatus === "signed" || t.kycStatus === "verified";
                  const moveInFmt = t.moveInDate ? new Date(t.moveInDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                  return (
                    <tr key={index} className="hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setSelectedTenant(t)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
                            {(t.name || "T").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground leading-snug">{t.name || "Resident"}</p>
                            <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.loginId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">Room {t.roomNo || t.room || "N/A"}</p>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[160px] block">{t.propertyTitle || "Property"}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">{moveInFmt}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${
                          isSigned ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {isSigned ? "Signed & Active" : "Pending E-Sign"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedTenant(t)}
                          className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-all inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <Eye size={14} /> View Agreement
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Agreement Modal */}
      {selectedTenant && (
        <TenantAgreementModal 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
        />
      )}
    </PropertyOwnerLayout>
  );
}
