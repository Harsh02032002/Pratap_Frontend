import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import {
  FileText, Search, Download, CheckCircle2,
  ArrowUpRight, IndianRupee, Tag
} from "lucide-react";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";

export default function ServiceHistoryPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchHistory();
  }, [owner.loginId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const propertyId = getActiveOwnerPropertyId();
      const [maintData, compData] = await Promise.all([
        apiFetch(`/api/maintenance/owner/${owner.loginId}${propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : ""}`),
        getOwnerComplaints(owner.loginId, { propertyId }).then(d => ({ complaints: d }))
      ]);
      
      const history = [];

      (maintData.tasks || []).forEach(t => {
        if (t.status === "Completed") {
          history.push({
            id: `MNT-${t._id.substring(t._id.length-4).toUpperCase()}`,
            desc: t.title,
            vendor: t.assignedStaffName || t.staff || "Internal Staff",
            date: new Date(t.updatedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}),
            amount: 0,
            type: "Maintenance"
          });
        }
      });

      (compData.complaints || []).forEach(c => {
        if (c.status === "Resolved") {
          history.push({
            id: `CMP-${c._id.substring(c._id.length-4).toUpperCase()}`,
            desc: c.category + " - " + c.description,
            vendor: c.assignedStaffName || "Internal Staff",
            date: new Date(c.updatedAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}),
            amount: 0,
            type: "Complaint Resolution"
          });
        }
      });

      setLogs(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.desc.toLowerCase().includes(search.toLowerCase()) ||
    l.vendor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Asset Audits" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Service History</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Historical records of completed asset repairs, plumbing servicing bills, and diesel invoices.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service logs by description or vendor..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Service history list table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Service ID</th>
                <th className="px-6 py-3.5 font-semibold">Description</th>
                <th className="px-6 py-3.5 font-semibold">Vendor</th>
                <th className="px-6 py-3.5 font-semibold">Completed Date</th>
                <th className="px-6 py-3.5 font-semibold">Service Fee</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading service history...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No completed services found.</td></tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-foreground">{l.id}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {l.desc}
                      <span className="block text-[10px] text-muted-foreground font-normal mt-0.5 uppercase tracking-wider">{l.type}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{l.vendor}</td>
                    <td className="px-6 py-4 text-muted-foreground">{l.date}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{l.amount > 0 ? `₹${l.amount.toLocaleString("en-IN")}` : "N/A"}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors">
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
