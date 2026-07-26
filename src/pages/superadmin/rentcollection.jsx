import React, { useEffect, useMemo, useState } from "react";
import { 
  Wallet, Clock, CheckCircle2, AlertCircle, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Search, Filter, 
  MoreVertical, Download, Plus, Calendar, DollarSign,
  FileText, Activity, ShieldCheck, CreditCard,
  Sparkles, Layers, Box, Globe2, IndianRupee,
  Inbox, ImageIcon, Save, RefreshCw, Info,
  Smartphone, Monitor, Banknote, Bell, Sheet, Loader2
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function RentHistory() {
  const [tenants, setTenants] = useState([]);
  const [rents, setRents] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantRes, rentRes, ownerRes] = await Promise.all([
        fetchJson("/api/tenants"),
        fetchJson("/api/rents"),
        fetchJson("/api/owners")
      ]);
      
      const tList = Array.isArray(tenantRes) ? tenantRes : (tenantRes.tenants || []);
      const rList = Array.isArray(rentRes) ? rentRes : (rentRes.rents || []);
      const oList = Array.isArray(ownerRes) ? ownerRes : (ownerRes.owners || []);
      
      setTenants(tList);
      setRents(rList);
      setOwners(oList);
    } catch (err) { console.error("Failed to load rent data:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const mergedData = useMemo(() => {
    const ownerMap = {};
    owners.forEach(o => { ownerMap[o.loginId] = o; });

    const tenantMap = {};
    tenants.filter(t => !t.isDeleted && t.status !== 'inactive' && t.status !== 'suspended').forEach(t => {
      if (t.loginId) tenantMap[t.loginId] = t;
      if (t._id) tenantMap[String(t._id)] = t;
    });

    return rents.map(r => {
      const tenant = tenantMap[r.tenantLoginId] || tenantMap[String(r.tenantId || "")];
      if (!tenant) return null;
      const owner = ownerMap[r.ownerLoginId];
      return {
        ...r,
        tenant,
        owner,
        bankInfo: owner?.bankDetails || owner?.checkinBankName || "Not Linked"
      };
    }).filter(Boolean);
  }, [rents, tenants, owners]);

  const filteredData = useMemo(() => {
    let list = mergedData;
    if (filterStatus !== "all") {
      list = list.filter(r => r.paymentStatus === filterStatus);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => 
        (r.tenantName || "").toLowerCase().includes(q) ||
        (r.propertyName || "").toLowerCase().includes(q) ||
        (r.tenantLoginId || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [mergedData, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const activeRents = mergedData;
    const total = activeRents.reduce((acc, r) => acc + (Number(r.totalDue || r.rentAmount) || 0), 0);
    const collected = activeRents.reduce((acc, r) => acc + (Number(r.paidAmount) || 0), 0);
    const pending = Math.max(0, total - collected);
    const rate = total > 0 ? Math.round((collected / total) * 100) : 0;
    
    return { total, collected, pending, rate };
  }, [mergedData]);

  const formatMoney = (n) => {
    const v = Number(n) || 0;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const chartData = [
    { name: "Collected", value: stats.collected || 1, color: "#10B981" },
    { name: "Pending", value: stats.pending || 0, color: "#F59E0B" }
  ];

  const handleSendReminders = async () => {
    const toastId = toast.loading("Sending rent reminders to all unpaid tenants...");
    try {
      await fetchJson("/api/rents/reminders/send", { method: "POST", headers: getAuthHeader() });
      toast.success("Reminders dispatched successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to send reminders", { id: toastId });
    }
  };

  const exportToExcel = () => {
    const data = filteredData.map(r => ({
      "Tenant ID": r.tenant?.loginId || r.tenantLoginId || r.tenant?._id || "N/A",
      "Tenant": r.tenantName || r.tenant?.name || "N/A",
      "Property": r.propertyName,
      "Month": r.collectionMonth,
      "Total Due": r.totalDue || r.rentAmount,
      "Paid": r.paidAmount,
      "Status": r.paymentStatus,
      "Method": r.paymentMethod,
      "Owner ID": r.ownerLoginId
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RentHistory");
    XLSX.writeFile(wb, `Roomhy_Rent_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Standard Page Header */}
      <PageHeader
        title="Rent History"
        subtitle="Track rents collected, pending dues, and view payment logs."
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToExcel}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Sheet className="w-4 h-4" /> Export Excel
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardHorizontal label="Expected Rent" value={formatMoney(stats.total)} trend="Expected" up icon={IndianRupee} color="blue" />
        <StatCardHorizontal label="Rent Collected" value={formatMoney(stats.collected)} trend="Received" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Pending Rent" value={formatMoney(stats.pending)} trend="Pending" up={false} icon={AlertCircle} color="amber" />
        <StatCardHorizontal label="Collection Rate" value={`${stats.rate}%`} trend="Percentage" up icon={Activity} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collection Summary Donut */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
           <div className="flex items-center justify-between w-full mb-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Collection Summary</h3>
              <button onClick={loadData} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                 <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
           </div>

           <div className="relative w-44 h-44 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={52} outerRadius={70} paddingAngle={6} stroke="none">
                       {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, ""]} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-xl font-black text-slate-900 leading-none">{formatMoney(stats.collected)}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Collected</p>
              </div>
           </div>

           <div className="w-full space-y-3">
              <HealthItem label="Collected Rent" value={`₹${stats.collected.toLocaleString()}`} color="#10B981" percent={`${stats.rate}%`} />
              <HealthItem label="Pending Rent" value={`₹${stats.pending.toLocaleString()}`} color="#F59E0B" percent={`${100 - stats.rate}%`} />
           </div>
        </div>

        {/* Rent Payment Logs Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                    <Layers size={18} />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-slate-800">Rent Payment Logs</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Detailed records of all rent payments</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <Filter size={12} className="text-slate-400" />
                    <select 
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none p-0 cursor-pointer"
                    >
                       <option value="all">All Payments</option>
                       <option value="paid">Paid</option>
                       <option value="pending">Pending</option>
                       <option value="partially_paid">Partial</option>
                    </select>
                 </div>
                 
                 <div className="relative group w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input 
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search tenant or property..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                    />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                       <th className="px-5 py-3.5">Tenant &amp; Property</th>
                       <th className="px-4 py-3.5">Month</th>
                       <th className="px-4 py-3.5 text-center">Amount Due</th>
                       <th className="px-4 py-3.5 text-center">Status</th>
                       <th className="px-5 py-3.5 text-right">Payment Method</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="5" className="py-24 text-center">
                         <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading rent records...</p>
                      </td></tr>
                    ) : filteredData.length === 0 ? (
                      <tr><td colSpan="5" className="py-24 text-center">
                         <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                            <Wallet size={24} />
                         </div>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No rent payments found</p>
                      </td></tr>
                    ) : filteredData.map((r, i) => (
                      <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                         <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                  {(r.tenantName || "T").charAt(0).toUpperCase()}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[180px]">{r.tenantName || r.tenant?.name || "Unknown Resident"}</p>
                                  <p className="text-[10px] font-bold text-blue-600 mt-1">
                                    ID: {r.tenant?.loginId || r.tenantLoginId || "—"}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[180px]">{r.propertyName}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-4 py-3.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-600">
                               <Calendar size={12} className="text-slate-400" />
                               <span>{r.collectionMonth}</span>
                            </div>
                         </td>
                         <td className="px-4 py-3.5 text-center font-black text-slate-900 text-xs">
                            ₹{(Number(r.totalDue || r.rentAmount) || 0).toLocaleString('en-IN')}
                         </td>
                         <td className="px-4 py-3.5 text-center">
                            <span className={cn(
                               "text-[9px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm",
                               r.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               r.paymentStatus === "partially_paid" ? "bg-amber-50 text-amber-600 border-amber-100" :
                               "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                               {r.paymentStatus || "pending"}
                            </span>
                         </td>
                         <td className="px-5 py-3.5 text-right font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                            {r.paymentMethod || "Awaiting"}
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, value, color, percent }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white group transition-all">
       <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: color}} />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
       </div>
       <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">{value}</span>
          <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-white rounded-md border border-slate-200">{percent}</span>
       </div>
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100" 
  };
  
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{value}</p>
         <div className={cn(
           "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider",
           up ? "text-emerald-600" : "text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
