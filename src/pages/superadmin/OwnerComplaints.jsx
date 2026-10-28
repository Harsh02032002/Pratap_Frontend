import React, { useState, useMemo, useEffect } from "react";
import { fetchJson } from "../../utils/api";
import {
  Ticket, Search, Download, Filter, Eye, UserCheck, MessageSquare,
  AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight,
  Building2, CreditCard, Calendar, User, FileText, X, Plus,
  ExternalLink, AlertCircle
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...c) => c.filter(Boolean).join(" ");

const PRIORITY_CFG = {
  Low:      { cls: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-400"  },
  Medium:   { cls: "bg-amber-50 text-amber-700 border border-amber-200",   dot: "bg-amber-500"  },
  High:     { cls: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-500" },
  Critical: { cls: "bg-rose-50 text-rose-700 border border-rose-200",       dot: "bg-rose-500"   },
};
const STATUS_CFG = {
  "Open":                  { cls: "bg-[#E6F4F5] text-[#0E7C86] border border-[#0E7C86]/20" },
  "Assigned":              { cls: "bg-indigo-50 text-indigo-700 border border-indigo-200"  },
  "In Progress":           { cls: "bg-amber-50 text-amber-700 border border-amber-200"    },
  "Waiting For Response":  { cls: "bg-purple-50 text-purple-700 border border-purple-200" },
  "Resolved":              { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200"},
  "Closed":                { cls: "bg-slate-100 text-slate-600 border border-slate-200"   },
};

function Badge({ label, cfg }) {
  return <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10px] font-bold", cfg?.cls)}>{label}</span>;
}

function PriorityDot({ priority }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[10px] font-bold", PRIORITY_CFG[priority]?.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_CFG[priority]?.dot)}/>
      {priority}
    </span>
  );
}

function TicketDetailPanel({ ticket, onClose, onUpdate, employees = [] }) {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState(ticket.status);
  const [resNotes, setResNotes] = useState(ticket.resolution_notes || "");

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-end p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-2xl h-[95vh] flex flex-col overflow-hidden border border-[#E1E6EA]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E1E6EA] shrink-0 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-[#0E7C86]">{ticket.ticket_id}</span>
              {ticket.sla_breached && <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-[4px]">SLA BREACHED</span>}
            </div>
            <h3 className="text-base font-bold text-[#10242A]">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#4A5961] hover:text-[#10242A] hover:bg-[#E1E6EA] rounded-full transition-all cursor-pointer"><X size={18}/></button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-0 divide-x divide-[#E1E6EA]">
            {/* LEFT: Info */}
            <div className="p-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-2">Update Status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.keys(STATUS_CFG).map(s => (
                    <button key={s} onClick={() => setStatus(s)} className={cn("text-[10px] font-semibold px-2 py-1 rounded-[6px] transition-all cursor-pointer", status === s ? STATUS_CFG[s].cls : "border border-[#E1E6EA] text-[#4A5961] hover:bg-[#F4F6F8]")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F4F6F8] rounded-[12px] p-4 space-y-2 border border-[#E1E6EA]">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider">Ticket Information</p>
                {[
                  ["Type", ticket.ticket_type],
                  ["Priority", ticket.priority],
                  ["Status", status],
                  ["Created", ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-[#4A5961] font-medium">{l}</span>
                    <span className="text-[#10242A] font-bold">{v}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#F4F6F8] rounded-[12px] p-4 border border-[#E1E6EA]">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-2">Raised By</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#E6F4F5] text-[#0E7C86] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                    {ticket.raised_by_name?.split(" ").map(n=>n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#10242A]">{ticket.raised_by_name}</p>
                    <p className="text-[10px] text-[#4A5961]">{ticket.raised_by_role}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1.5">Resolution Notes</p>
                <textarea
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  placeholder="Enter ticket resolution notes here..."
                  className="w-full bg-[#F4F6F8] border border-[#E1E6EA] rounded-[10px] p-3 text-xs outline-none focus:border-[#0E7C86] text-[#10242A] min-h-[70px]"
                />
              </div>
            </div>

            {/* RIGHT: Description + Notes */}
            <div className="p-5 flex flex-col space-y-5">
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-2">Description</p>
                <p className="text-xs text-[#4A5961] leading-relaxed">{ticket.description}</p>
              </div>

              <div className="flex flex-col flex-1">
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-2">Internal Notes</p>
                <div className="space-y-2 mb-3 flex-1">
                  {notes.map((n, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-[8px] p-2.5 text-xs text-amber-800">{n}</div>
                  ))}
                  {notes.length === 0 && <p className="text-xs text-[#4A5961]">No internal notes.</p>}
                </div>
                <div className="flex gap-2 mt-auto">
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add an internal note..." className="flex-1 bg-[#F4F6F8] rounded-[8px] px-3 py-1.5 text-xs outline-none border border-[#E1E6EA] focus:border-[#0E7C86] text-[#10242A]"/>
                  <button onClick={() => { if(note.trim()) { setNotes(p => [...p, note]); setNote(""); }}} className="p-2 bg-[#0E7C86] text-white rounded-[8px] hover:bg-[#09626A] transition-all cursor-pointer">
                    <Plus size={14}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E1E6EA] flex gap-3 shrink-0 bg-[#F8FAFC]">
          <button onClick={() => onUpdate(ticket._id, status, resNotes)} className="flex-1 py-2 bg-[#0E7C86] text-white rounded-[8px] text-xs font-semibold hover:bg-[#09626A] transition-all cursor-pointer">
            Save Changes
          </button>
          <button onClick={() => onUpdate(ticket._id, 'Resolved', resNotes)} className="flex-1 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[8px] text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
            Mark Resolved
          </button>
          <button onClick={() => onUpdate(ticket._id, 'Closed', resNotes)} className="flex-1 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-[8px] text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer">
            Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerComplaints() {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [priorityF, setPriorityF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [assignModal, setAssignModal] = useState(null);
  const [registerModal, setRegisterModal] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/support/tickets");
      if (res && res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchJson("/api/employees");
      if (res && res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadEmployees();
  }, []);

  const filtered = useMemo(() => tickets.filter(t => {
    const isOwnerTicket = t.ticket_type === "Owner Complaint" || t.raised_by_role === "property_owner" || t.raised_by_role === "owner";
    if (!isOwnerTicket) return false;

    const s = search.toLowerCase();
    const matchS = !search || 
      (t.ticket_id && t.ticket_id.toLowerCase().includes(s)) || 
      (t.raised_by_name && t.raised_by_name.toLowerCase().includes(s)) || 
      (t.subject && t.subject.toLowerCase().includes(s)) || 
      (t.property_name && t.property_name.toLowerCase().includes(s));
    const matchP = priorityF === "All" || t.priority === priorityF;
    const matchSt = statusF === "All" || t.status === statusF;
    const matchT = typeF === "All" || t.ticket_type === typeF;
    return matchS && matchP && matchSt && matchT;
  }), [tickets, search, priorityF, statusF, typeF]);

  const counts = useMemo(() => {
    const ownerTicketsList = tickets.filter(t => t.ticket_type === "Owner Complaint" || t.raised_by_role === "property_owner" || t.raised_by_role === "owner");
    const total = ownerTicketsList.length;
    return {
      total,
      open: ownerTicketsList.filter(t => t.status === "Open").length,
      inProgress: ownerTicketsList.filter(t => t.status === "In Progress").length,
      resolved: ownerTicketsList.filter(t => t.status === "Resolved").length,
      critical: ownerTicketsList.filter(t => t.priority === "Critical").length,
      breached: ownerTicketsList.filter(t => t.sla_breached).length,
    };
  }, [tickets]);

  const handleUpdate = async (id, newStatus, resolutionNotes = "") => {
    try {
      const res = await fetchJson(`/api/superadmin/support/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus, resolution_notes: resolutionNotes })
      });
      if (res && res.success) {
        setTickets(prev => prev.map(t => t._id === id ? res.ticket : t));
      }
    } catch (err) {
      console.error(err);
    }
    setSelected(null);
  };

  const handleAssign = async (id, empId, empName) => {
    try {
      const res = await fetchJson(`/api/superadmin/support/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify({ assigned_admin: empId, assigned_admin_name: empName, status: "Assigned" })
      });
      if (res && res.success) {
        setTickets(prev => prev.map(t => t._id === id ? res.ticket : t));
      }
    } catch (err) {
      console.error(err);
    }
    setAssignModal(null);
  };

  const handleExport = () => {
    const csv = [
      ["Ticket ID","Type","Raised By","Property","Booking","Priority","Status","Assigned","Created"],
      ...filtered.map(t => [t.ticket_id, t.ticket_type, t.raised_by_name, t.property_name||"", t.booking_id||"", t.priority, t.status, t.assigned_admin_name||"Unassigned", t.created_at])
    ].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="owner_complaints.csv"; a.click();
  };

  const handleRegister = async (form) => {
    try {
      const res = await fetchJson("/api/superadmin/support/tickets", {
        method: "POST",
        body: JSON.stringify({ ...form, ticket_type: "Owner Complaint", raised_by_role: "property_owner" })
      });
      if (res && res.success) {
        setRegisterModal(false);
        loadTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const RegisterComplaintModal = ({ onClose, onSubmit }) => {
    const [form, setForm] = useState({
      ticket_type: "Owner Complaint",
      raised_by_name: "",
      raised_by_role: "property_owner",
      property_name: "",
      booking_id: "",
      owner_name: "",
      subject: "",
      description: "",
      priority: "Medium",
      assigned_admin: "",
      assigned_admin_name: ""
    });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-xl my-8 p-6 border border-[#E1E6EA]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#10242A]">Register Owner Complaint</h3>
            <button onClick={onClose} className="p-1 hover:bg-[#E1E6EA] rounded-full"><X size={18} className="text-[#4A5961]"/></button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Type</p>
                <select value={form.ticket_type} onChange={e => set("ticket_type", e.target.value)} className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs font-semibold text-[#4A5961] outline-none border border-[#E1E6EA]">
                  {["Owner Complaint","Booking Dispute","Payment Issue","Property Issue","Other"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Priority</p>
                <select value={form.priority} onChange={e => set("priority", e.target.value)} className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs font-semibold text-[#4A5961] outline-none border border-[#E1E6EA]">
                  {["Low","Medium","High","Critical"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Owner Name</p>
                <input value={form.raised_by_name} onChange={e => set("raised_by_name", e.target.value)} placeholder="Owner Name" className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs outline-none border border-[#E1E6EA] focus:border-[#0E7C86] text-[#10242A]"/>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Property</p>
                <input value={form.property_name} onChange={e => set("property_name", e.target.value)} placeholder="Property Name" className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs outline-none border border-[#E1E6EA] focus:border-[#0E7C86] text-[#10242A]"/>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Subject *</p>
              <input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Complaint subject" className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs outline-none border border-[#E1E6EA] focus:border-[#0E7C86] text-[#10242A]"/>
            </div>

            <div>
              <p className="text-[10px] font-bold text-[#4A5961] uppercase tracking-wider mb-1">Description *</p>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe complaint details..." className="w-full bg-[#F4F6F8] rounded-[8px] px-3 py-2 text-xs outline-none border border-[#E1E6EA] focus:border-[#0E7C86] text-[#10242A] min-h-[80px]"/>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-2 bg-[#F4F6F8] border border-[#E1E6EA] text-[#4A5961] rounded-[8px] text-xs font-semibold hover:bg-[#E1E6EA] transition-all cursor-pointer">Cancel</button>
            <button onClick={() => onSubmit(form)} className="flex-1 py-2 bg-[#0E7C86] text-white rounded-[8px] text-xs font-semibold hover:bg-[#09626A] transition-all cursor-pointer">Register Complaint</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Owners Complaints"
        subtitle="Manage all support tickets, complaints, and escalations raised by property owners."
        actions={
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="bg-white border border-slate-200/80 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer">
              <Download size={14}/> Export CSV
            </button>
            <button onClick={() => setRegisterModal(true)} className="bg-[#095256] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-[#073d40] transition-colors shadow-2xs cursor-pointer">
              <Plus size={14}/> Register Complaint
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Tickets",  val: counts.total,     icon: Ticket        },
          { label: "Open",           val: counts.open,      icon: AlertCircle   },
          { label: "In Progress",    val: counts.inProgress,icon: Clock         },
          { label: "Resolved",       val: counts.resolved,  icon: CheckCircle   },
          { label: "Critical",       val: counts.critical,  icon: AlertTriangle },
          { label: "SLA Breached",   val: counts.breached,  icon: XCircle       },
        ].map(c => (
          <div key={c.label} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#095256]/10 text-[#095256] flex items-center justify-center mb-2">
                <c.icon size={15}/>
              </div>
              <p className="text-xl font-bold text-slate-900 leading-tight">{c.val}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Outside Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative group w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticket ID, name, property..." className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs"/>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={priorityF} onChange={e => setPriorityF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
            <option value="All">All Priority</option>
            {["Low","Medium","High","Critical"].map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
            <option value="All">All Status</option>
            {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={typeF} onChange={e => setTypeF(e.target.value)} className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer">
            <option value="All">All Types</option>
            {["Owner Complaint","Booking Dispute","Payment Issue","Property Issue","Other"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
              <tr>
                <th className="px-5 py-3">Ticket</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Raised By</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA]">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">No Owner Complaints Found</td></tr>
              ) : filtered.map(t => (
                <tr key={t._id} className={cn("hover:bg-[#F4F6F8]/60 transition-colors", t.sla_breached && "bg-rose-50/20")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {t.sla_breached && <AlertTriangle size={12} className="text-rose-600 shrink-0"/>}
                      <div>
                        <p className="font-mono font-bold text-[#0E7C86] text-xs">{t.ticket_id}</p>
                        <p className="text-[10px] text-[#4A5961] truncate max-w-[140px]">{t.subject}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-semibold text-[#4A5961] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px]">{t.ticket_type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center text-[9px] font-bold shrink-0">
                        {t.raised_by_name?.split(" ").map(n=>n[0]).join("")}
                      </div>
                      <span className="text-xs font-bold text-[#10242A]">{t.raised_by_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {t.property_name
                      ? <span className="text-xs text-[#4A5961] flex items-center gap-1"><Building2 size={11} className="text-[#0E7C86]"/>{t.property_name}</span>
                      : <span className="text-xs text-[#4A5961]">—</span>
                    }
                  </td>
                  <td className="px-5 py-3"><PriorityDot priority={t.priority}/></td>
                  <td className="px-5 py-3"><Badge label={t.status} cfg={STATUS_CFG[t.status]}/></td>
                  <td className="px-5 py-3">
                    {t.assigned_admin_name
                      ? <span className="text-xs font-semibold text-[#10242A] flex items-center gap-1"><UserCheck size={11} className="text-emerald-600"/>{t.assigned_admin_name}</span>
                      : <button onClick={() => setAssignModal(t._id)} className="text-[11px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><Plus size={11}/>Assign</button>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setSelected(t)} className="p-1.5 text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] rounded-[6px] transition-all cursor-pointer" title="View"><Eye size={14}/></button>
                      {!t.assigned_admin_name && (
                        <button onClick={() => setAssignModal(t._id)} className="p-1.5 text-[#4A5961] hover:text-[#0E7C86] hover:bg-[#E6F4F5] rounded-[6px] transition-all cursor-pointer" title="Assign"><UserCheck size={14}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Panel */}
      {selected && <TicketDetailPanel ticket={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} employees={employees}/>}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl p-5 w-72 border border-[#E1E6EA] flex flex-col" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-bold text-[#10242A] mb-3 shrink-0">Assign Employee</h4>
            <div className="space-y-1.5 overflow-y-auto max-h-60 flex-1">
              {employees.length === 0 ? (
                <p className="text-xs text-[#4A5961] text-center py-4">No employees registered.</p>
              ) : (
                employees.map(emp => (
                  <button key={emp._id} onClick={() => handleAssign(assignModal, emp.loginId, emp.name)} className="w-full text-left px-3 py-2 text-xs font-semibold text-[#10242A] hover:bg-[#E6F4F5] hover:text-[#0E7C86] rounded-[8px] transition-all flex items-center gap-2 cursor-pointer">
                    <div className="w-6 h-6 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center text-[9px] font-bold shrink-0">
                      {emp.name?.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-[#10242A] leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-[#4A5961]">{emp.loginId}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Complaint Modal */}
      {registerModal && <RegisterComplaintModal onClose={() => setRegisterModal(false)} onSubmit={handleRegister} />}
    </div>
  );
}
