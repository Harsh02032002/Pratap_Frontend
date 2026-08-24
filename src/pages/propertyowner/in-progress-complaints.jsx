import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import { cacheGet, cacheSet } from "../../utils/cache";
import { AlertCircle, CheckCircle2, Clock, Plus, Search, Loader2 } from "lucide-react";

const Pill = ({ tone="muted", children }) => {
  const t = { success:"bg-green-100 text-green-700", warning:"bg-amber-100 text-amber-700", danger:"bg-red-100 text-red-700", muted:"bg-gray-100 text-gray-600" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${t[tone]||t.muted}`}>{children}</span>;
};

const StatCard = ({ label, value, icon:Icon, tone="muted" }) => {
  const bg = { muted:"bg-muted/40", warning:"bg-amber-50", success:"bg-green-50", danger:"bg-red-50" };
  return (
    <div className={`rounded-2xl border border-border p-4 shadow-soft ${bg[tone]||bg.muted}`}>
      <div className="flex items-center justify-between mb-3"><span className="text-[12.5px] text-muted-foreground font-medium">{label}</span>{Icon&&<Icon className="size-4 text-muted-foreground"/>}</div>
      <div className="font-serif text-[26px] leading-none text-foreground">{value}</div>
    </div>
  );
};

export default function Complaints() {
  const owner = getOwnerRuntimeSession();
  const [tab, setTab] = useState("in-progress");
  const [search, setSearch] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  useEffect(() => {
    const fetchData = async () => {
      const propertyId = getActiveOwnerPropertyId();
      const COMP_KEY = `complaints:${owner.loginId}:${propertyId || "all"}`;
      const EMP_KEY = `employees:${owner.loginId}`;
      const cachedComp = cacheGet(COMP_KEY);
      const cachedEmp = cacheGet(EMP_KEY);
      if (cachedComp && cachedEmp) {
        setComplaints(cachedComp);
        setStaffList(cachedEmp);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [compData, empData] = await Promise.all([
          cachedComp ? Promise.resolve(cachedComp) : getOwnerComplaints(owner.loginId, { propertyId }),
          cachedEmp ? Promise.resolve(cachedEmp) : apiFetch(`/api/employees?parentLoginId=${owner.loginId}`),
        ]);
        const complaints = Array.isArray(compData) ? compData : [];
        const staff = empData?.data || [];
        setComplaints(complaints);
        setStaffList(staff);
        if (!cachedComp) cacheSet(COMP_KEY, complaints, 2 * 60 * 1000);
        if (!cachedEmp) cacheSet(EMP_KEY, staff, 3 * 60 * 1000);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [owner.loginId]);

  const updateStatus = async (id, newStatus) => {
    try {
      const data = await apiFetch(`/api/complaints/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (data && data.success) {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const assignStaff = async (id, staffId) => {
    try {
      const staffObj = staffList.find(s => s._id === staffId);
      const data = await apiFetch(`/api/complaints/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assignedStaffId: staffId, assignedStaffName: staffObj ? staffObj.name : null })
      });
      if (data && data.success) {
        setComplaints(prev => prev.map(c => c._id === id ? { 
          ...c, 
          assignedStaffId: staffId, 
          assignedStaffName: staffObj ? staffObj.name : null 
        } : c));
      }
    } catch (err) {
      console.error("Failed to assign staff", err);
    }
  };

  const filtered = complaints.filter(c => {
    const cStatus = (c.status || "Open").toLowerCase().replace(" ", "-");
    const matchesTab = tab === "all" || cStatus === tab || (tab === "in-progress" && cStatus === "taken");
    const term = search.toLowerCase();
    const matchesSearch = !search || 
      (c.tenantName || "").toLowerCase().includes(term) || 
      (c.category || "").toLowerCase().includes(term) ||
      (c.description || "").toLowerCase().includes(term);
    return matchesTab && matchesSearch;
  });

  return (
    <PropertyOwnerLayout owner={owner} title="Complaints" onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Complaints</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Track and resolve tenant complaints from one place.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading complaints...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total" value={complaints.length} icon={AlertCircle} tone="muted"/>
            <StatCard label="Open" value={complaints.filter(c=>(c.status||"Open")==="Open").length} icon={AlertCircle} tone="danger"/>
            <StatCard label="In Progress" value={complaints.filter(c=>["In Progress", "Taken"].includes(c.status)).length} icon={Clock} tone="warning"/>
            <StatCard label="Resolved" value={complaints.filter(c=>c.status==="Resolved").length} icon={CheckCircle2} tone="success"/>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-4 border-b border-border">
            {[{k:"all",l:"All"},{k:"open",l:"Open"},{k:"in-progress",l:"In Progress"},{k:"resolved",l:"Resolved"}].map(({k,l}) => (
              <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-primary text-foreground":"border-transparent text-muted-foreground hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <div className="relative mb-4">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search complaints…" className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Tenant</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                     <tr><td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">No complaints found.</td></tr>
                  ) : filtered.map(c => (
                    <tr key={c._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {c.tenantName}
                        {c.escalated && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">ESCALATED</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.roomNo}</td>
                      <td className="px-4 py-3 text-foreground">{c.category}</td>
                      <td className="px-4 py-3">
                        <Pill tone={(c.priority||"Low")==="High"?"danger":(c.priority==="Medium"?"warning":"muted")}>{c.priority}</Pill>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={c.status==="Resolved"?"success":(c.status==="Open"?"danger":"warning")}>{c.status}</Pill>
                      </td>
                      <td className="px-4 py-3">
                        {c.status !== "Resolved" ? (
                          <select 
                            value={c.assignedStaffId || ""} 
                            onChange={(e) => assignStaff(c._id, e.target.value)}
                            className="bg-muted border border-border text-[11px] rounded px-2 py-1 outline-none"
                          >
                            <option value="">-- Assign Staff --</option>
                            {staffList.map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                          </select>
                        ) : (
                          <span className="text-[11.5px] font-medium text-muted-foreground">{c.assignedStaffName || "Unassigned"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "Open" && (
                           <button onClick={() => updateStatus(c._id, "In Progress")} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">Mark In-Progress</button>
                        )}
                        {(c.status === "In Progress" || c.status === "Taken") && (
                           <button onClick={() => updateStatus(c._id, "Resolved")} className="text-[11px] font-medium text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded mt-1">Mark Resolved</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PropertyOwnerLayout>
  );
}
