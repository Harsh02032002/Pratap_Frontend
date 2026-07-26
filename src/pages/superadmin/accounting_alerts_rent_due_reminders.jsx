import React, { useState, useEffect } from "react";
import { 
  RotateCcw, Download, Search, Bell, Mail, PhoneCall, 
  CheckCircle2, AlertCircle, RefreshCw, Send, HelpCircle
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import useSEO from "../../hooks/useSEO";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function RentDueRemindersAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all"); // all, sent, failed, queued

  useSEO({
    title: "Rent Due Reminders - Roomhy Superadmin",
    description: "Audit trail of auto-escalated rent due reminders sent to tenants.",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/alerts/rent-due-reminders");
      if (res && res.success) {
        setAlerts(res.alerts || []);
      }
    } catch (e) {
      console.error("RentDueRemindersAlerts load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = alerts.filter(a => {
    const matchesSearch = 
      (a.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.propertyName || "").toLowerCase().includes(search.toLowerCase());
    
    if (statusTab === "all") return matchesSearch;
    return matchesSearch && String(a.status).toLowerCase() === statusTab;
  });

  const countSent = alerts.filter(a => a.status === 'sent').length;
  const countFailed = alerts.filter(a => a.status === 'failed').length;
  const countQueued = alerts.filter(a => a.status === 'queued' || a.status === 'processing').length;

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = "Tenant Name,Phone,Email,Property,Channel,Phase,Status,Attempts,Delivered At,Failure Reason\n";
    const rows = filtered.map(a => 
      `"${a.tenantName}","${a.tenantPhone}","${a.tenantEmail}","${a.propertyName}","${a.channel}",${a.phase || 'N/A'},"${a.status}",${a.attempts || 0},"${a.deliveredAt ? a.deliveredAt.split('T')[0] : 'N/A'}","${a.failureReason || ''}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Rent_Due_Reminders_Logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      <PageHeader
        title="Rent Due Reminders"
        subtitle="Chronological audit log of automated and manual rent reminders dispatched via WhatsApp and Email."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RotateCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10"
            >
              <Download className="w-3.5 h-3.5" /> Export Logs
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reminders Dispatched</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{alerts.length} Logs</h3>
            <p className="text-[9px] text-slate-400 mt-1">Total reminders in queue & history</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Successfully Delivered</p>
            <h3 className="text-xl font-bold text-emerald-600 leading-tight">{countSent} Sent</h3>
            <p className="text-[9px] text-slate-400 mt-1">Confirmed API delivery logs</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Failed Deliveries</p>
            <h3 className="text-xl font-bold text-rose-700 leading-tight">{countFailed} Failed</h3>
            <p className="text-[9px] text-slate-400 mt-1">Wrong phone numbers or mail config</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Queued / Retrying</p>
            <h3 className="text-xl font-bold text-slate-800 leading-tight">{countQueued} Queued</h3>
            <p className="text-[9px] text-slate-400 mt-1">Scheduled for auto-retransmission</p>
          </div>
        </div>
      </div>

      {/* Main Registry */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl self-start">
            {[
              { id: "all", label: "All Reminders" },
              { id: "sent", label: "Sent" },
              { id: "failed", label: "Failed" },
              { id: "queued", label: "Queued" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                  statusTab === tab.id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Tenant or Property..."
              className="w-full bg-slate-50 border border-transparent rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Channel</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Phase</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Attempts</th>
                <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sent Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">Loading reminder dispatches...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">No reminders matched current filters</td>
                </tr>
              ) : filtered.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 text-xs font-bold text-slate-800">
                    <p className="font-bold text-slate-800">{row.tenantName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1 font-mono">{row.tenantPhone || row.tenantEmail}</p>
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-600">
                    {row.propertyName}
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full",
                      (row.channel || '').toLowerCase().includes('whatsapp') ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      (row.channel || '').toLowerCase().includes('email') ? "bg-blue-50 text-blue-700 border border-blue-100" :
                      "bg-purple-50 text-purple-700 border border-purple-100"
                    )}>
                      {(row.channel || '').toLowerCase().includes('whatsapp') ? <PhoneCall className="w-3 h-3" /> :
                       (row.channel || '').toLowerCase().includes('email') ? <Mail className="w-3 h-3" /> :
                       <Bell className="w-3 h-3" />}
                      {(row.channel || '').toLowerCase() === 'dashboard' || (row.channel || '').toLowerCase() === 'system' ? 'WHATSAPP' : row.channel}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-xs font-bold text-slate-700">Phase {row.phase || 1}</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border",
                      row.status === 'sent' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      row.status === 'failed' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {row.status}
                    </span>
                    {row.status === 'failed' && row.failureReason && (
                      <p className="text-[9px] text-rose-500 font-medium mt-1 max-w-[200px] mx-auto truncate" title={row.failureReason}>
                        {row.failureReason}
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-xs font-bold text-slate-600 text-right">
                    {row.attempts || 0}
                  </td>
                  <td className="py-4 text-xs font-semibold text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
