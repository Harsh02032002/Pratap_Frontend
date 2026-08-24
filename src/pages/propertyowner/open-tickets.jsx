import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import { AlertCircle, CheckCircle2, Clock, Plus, Search, Loader2, Send, X } from "lucide-react";

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
  const [mainTab, setMainTab] = useState("tenant"); // "tenant" or "superadmin"
  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [ownerTickets, setOwnerTickets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [ticketType, setTicketType] = useState("Owner Complaint");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const propertyId = getActiveOwnerPropertyId();
      const data = await getOwnerComplaints(owner.loginId, { propertyId });
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerTickets = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/superadmin/support/tickets');
      if (data && data.success) {
        setOwnerTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching support tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const data = await apiFetch(`/api/properties?ownerLoginId=${owner.loginId}&limit=100`);
      if (data && data.success) {
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  useEffect(() => {
    if (mainTab === "tenant") {
      fetchComplaints();
    } else {
      fetchOwnerTickets();
    }
  }, [owner.loginId, mainTab]);

  useEffect(() => {
    fetchProperties();
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

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Subject and description are required.");
      return;
    }

    setSubmittingTicket(true);
    try {
      const data = await apiFetch('/api/superadmin/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          ticket_type: ticketType,
          subject,
          description,
          priority,
          property_name: selectedProperty || null,
          owner_name: owner.name,
          raised_by_name: owner.name,
          raised_by_role: 'property_owner'
        })
      });

      if (data && data.success) {
        alert("Complaint filed to superadmin successfully!");
        setIsModalOpen(false);
        setSubject("");
        setDescription("");
        setPriority("Medium");
        setTicketType("Owner Complaint");
        setSelectedProperty("");
        if (mainTab === "superadmin") {
          fetchOwnerTickets();
        } else {
          setMainTab("superadmin");
        }
      }
    } catch (err) {
      alert("Failed to submit support ticket: " + err.message);
    } finally {
      setSubmittingTicket(false);
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

  const filteredTickets = ownerTickets.filter(t => {
    const term = search.toLowerCase();
    return !search ||
      (t.subject || "").toLowerCase().includes(term) ||
      (t.ticket_type || "").toLowerCase().includes(term) ||
      (t.description || "").toLowerCase().includes(term);
  });

  return (
    <PropertyOwnerLayout owner={owner} title="Complaints" onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Complaints</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Track tenant complaints and raise support tickets to the superadmin.</p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold shadow transition-colors"
          >
            <Plus size={16} /> File Ticket to Superadmin
          </button>
        </div>
      </div>
      
      {/* Tab select: Tenant Complaints vs Superadmin Tickets */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setMainTab("tenant")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${mainTab === "tenant" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Tenant Complaints
        </button>
        <button
          onClick={() => setMainTab("superadmin")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${mainTab === "superadmin" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          My Tickets to Superadmin
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {mainTab === "tenant" ? (
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
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tenant complaints…" className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"/>
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
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.status === "Open" && (
                               <button onClick={() => updateStatus(c._id, "In Progress")} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">Mark In-Progress</button>
                            )}
                            {(c.status === "In Progress" || c.status === "Taken") && (
                               <button onClick={() => updateStatus(c._id, "Resolved")} className="text-[11px] font-medium text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded">Mark Resolved</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search support tickets…" className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                      <th className="px-4 py-3 font-semibold">Ticket ID</th>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Property</th>
                      <th className="px-4 py-3 font-semibold">Priority</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Assignee</th>
                      <th className="px-4 py-3 font-semibold text-right">Created Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {filteredTickets.length === 0 ? (
                         <tr><td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">No support tickets found.</td></tr>
                      ) : filteredTickets.map(t => (
                        <tr key={t._id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-blue-600">{t.ticket_id}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{t.subject}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{t.ticket_type}</td>
                          <td className="px-4 py-3 text-muted-foreground">{t.property_name || "—"}</td>
                          <td className="px-4 py-3">
                            <Pill tone={t.priority==="High"||t.priority==="Critical"?"danger":(t.priority==="Medium"?"warning":"muted")}>{t.priority}</Pill>
                          </td>
                          <td className="px-4 py-3">
                            <Pill tone={t.status==="Resolved"?"success":(t.status==="Open"?"danger":"warning")}>{t.status}</Pill>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">{t.assigned_admin_name || "Unassigned"}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {new Date(t.created_at || t.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* File Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <h3 className="text-base font-bold text-foreground">Raise Ticket to Superadmin</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize your issue..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={ticketType}
                    onChange={e => setTicketType(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card text-foreground"
                  >
                    <option value="Owner Complaint">Owner Complaint</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Booking Dispute">Booking Dispute</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card text-foreground"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Linked Property (Optional)</label>
                <select
                  value={selectedProperty}
                  onChange={e => setSelectedProperty(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card text-foreground"
                >
                  <option value="">Select Property...</option>
                  {properties.map(p => (
                    <option key={p._id} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide all context and details of the complaint here..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-card text-foreground resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {submittingTicket ? "Submitting..." : <><Send size={14} /> Send Ticket</>}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 h-11 border border-border hover:bg-muted rounded-xl text-sm font-semibold text-muted-foreground transition-colors bg-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
