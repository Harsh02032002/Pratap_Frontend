import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, RefreshCw,
  Sparkles, Layers, Box, Globe2, IndianRupee,
  Plus, Loader2, Save, Inbox, CreditCard, Tag
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { DateRangePill } from "../../components/dashboard/DateRangePill";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const monthKey = (dateLike) => {
  const d = new Date(dateLike || Date.now());
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
  return d.toISOString().slice(0, 7);
};

const calcToBePaid = (rentAmount, isFirstMonth) => {
  const rent = Number(rentAmount || 0);
  const commission = isFirstMonth ? rent * 0.1 : 0;
  const serviceFee = 50;
  const toBePaid = Math.max(rent - commission - serviceFee, 0);
  return { rent, commission, serviceFee, toBePaid };
};

export default function Platform() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCommission = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [tenantRes, ownerRes, rentRes] = await Promise.all([
        fetchJson("/api/tenants").catch(() => ({ tenants: [] })),
        fetchJson("/api/owners").catch(() => ({ owners: [] })),
        fetchJson("/api/rents").catch(() => ({ rents: [] }))
      ]);

      const tenants = Array.isArray(tenantRes) ? tenantRes : (tenantRes.tenants || []);
      const owners = Array.isArray(ownerRes) ? ownerRes : (ownerRes.owners || ownerRes.data || []);
      const rents = Array.isArray(rentRes) ? rentRes : (rentRes.rents || []);

      const ownerMap = {};
      owners.forEach((o) => {
        const key = String(o.loginId || o.ownerLoginId || o._id || "").trim().toUpperCase();
        if (key) ownerMap[key] = o;
      });

      const currentMonth = new Date().toISOString().slice(0, 7);

      const rowsData = tenants.map((tenant) => {
        const tenantLoginId = String(tenant.loginId || "").trim().toUpperCase();
        const rent = rents.find((r) => String(r.tenantLoginId || "").trim().toUpperCase() === tenantLoginId) || null;
        const ownerId = String(tenant.ownerLoginId || tenant.ownerId || (rent && rent.ownerLoginId) || "").trim().toUpperCase();
        if (!rent || !ownerId) return null;

        const owner = ownerMap[ownerId] || {};
        const ownerName = owner.name || owner.ownerName || owner.profile?.name || ownerId || "Unknown Owner";
        const propertyName = rent.propertyName || tenant.property?.title || tenant.property?.name || "Unknown Property";
        const tenantName = tenant.name || "Tenant";
        const tenantId = tenant.loginId || "-";

        const moveInMonth = monthKey(tenant.moveInDate || tenant.createdAt || Date.now());
        const isFirstMonth = moveInMonth === currentMonth;
        const rentAmount = Number(rent.rentAmount || rent.totalDue || tenant.agreedRent || 0);
        const calc = calcToBePaid(rentAmount, isFirstMonth);
        const status = String(rent.ownerPayoutStatus || "pending").toLowerCase();

        return {
          ownerName,
          ownerId,
          propertyName,
          tenantName,
          tenantId,
          firstMonth: isFirstMonth,
          rent: calc.rent,
          commission: calc.commission,
          serviceFee: calc.serviceFee,
          toBePaid: calc.toBePaid,
          status
        };
      }).filter(Boolean);

      setRows(rowsData);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to load commission data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCommission(); }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.commission + r.serviceFee;
        acc.pending += r.status === "paid" ? 0 : r.toBePaid;
        acc.activeContracts += 1;
        return acc;
      },
      { revenue: 0, pending: 0, activeContracts: 0 }
    );
  }, [rows]);

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex flex-col gap-2">
         <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-none">Commercial Intelligence Hub</h1>
         <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase mt-2">
            <span>Fiscal Management</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600">Platform Commissions & Owner Payouts</span>
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <p className="text-sm font-bold text-slate-400 max-w-2xl">Track system-wide revenue velocity, audit platform commissions and manage owner payout liquidity with audit-ready precision.</p>
         <button onClick={loadCommission} className="bg-slate-800 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase shadow-xl shadow-slate-800/20 hover:bg-slate-900 transition-all flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Fiscal Feed
         </button>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCardLarge label="System Revenue" value={`₹${totals.revenue.toLocaleString()}`} trend="+ 15.2% Yield" up icon={Zap} color="blue" />
        <StatCardLarge label="Pending Payouts" value={`₹${totals.pending.toLocaleString()}`} trend="Market Liquidity" up={false} icon={IndianRupee} color="orange" />
        <StatCardLarge label="Active Yields" value={totals.activeContracts} trend="Growth Engine" up icon={Activity} color="green" />
        <StatCardLarge label="Platform Fee" value="₹50" trend="Static Protocol" up icon={Tag} color="indigo" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Yield & Commission Portfolio</h3>
            <div className="flex items-center gap-4">
               <div className="relative group w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input placeholder="Search fiscal records..." className="bg-slate-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold shadow-sm w-full outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
               </div>
               <button className="flex items-center gap-2 bg-slate-50 text-slate-400 px-6 py-3.5 rounded-2xl text-[10px] font-bold uppercase hover:bg-slate-100 transition-all border border-slate-100">
                  <Sheet className="w-4 h-4" /> Export Ledger
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1400px]">
               <thead>
                  <tr className="text-slate-400 text-[10px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-6">Owner Intelligence</th>
                     <th className="pb-6">Asset Context</th>
                     <th className="pb-6">Resident Profile</th>
                     <th className="pb-6 text-center">Gross Rent</th>
                     <th className="pb-6 text-center">Commission Hub</th>
                     <th className="pb-6 text-center">Platform Fee</th>
                     <th className="pb-6 text-center">Net Payout Index</th>
                     <th className="pb-6 text-right">Payout Status Hub</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="8" className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Fiscal Vault...</p>
                       </div>
                    </td></tr>
                  ) : errorMsg ? (
                    <tr><td colSpan="8" className="py-20 text-center text-rose-500 font-bold uppercase text-[10px]">{errorMsg}</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan="8" className="py-20 text-center text-slate-400 font-bold uppercase text-[10px]">No commercial yields indexed.</td></tr>
                  ) : rows.map((row, idx) => (
                    <tr key={`${row.ownerId}-${idx}`} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                       <td className="py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-xl transition-all">
                                {row.ownerName?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{row.ownerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest opacity-60">ID: {row.ownerId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6 text-xs font-bold text-slate-500 uppercase tracking-tighter">{row.propertyName}</td>
                       <td className="py-6">
                          <p className="text-sm font-bold text-slate-800">{row.tenantName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest opacity-60">ID: {row.tenantId}</p>
                       </td>
                       <td className="py-6 text-center text-sm font-bold text-slate-800">₹{row.rent.toLocaleString()}</td>
                       <td className="py-6 text-center">
                          <div className="inline-flex flex-col items-center">
                             <p className="text-sm font-bold text-indigo-600">₹{row.commission.toLocaleString()}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 opacity-60">{row.firstMonth ? "Move-in Delta" : "Static Flow"}</p>
                          </div>
                       </td>
                       <td className="py-6 text-center text-sm font-bold text-slate-400">₹{row.serviceFee}</td>
                       <td className="py-6 text-center">
                          <p className="text-sm font-bold text-emerald-600 shadow-emerald-50 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-block">₹{row.toBePaid.toLocaleString()}</p>
                       </td>
                       <td className="py-6 text-right">
                          <span className={cn(
                             "text-[9px] font-bold px-3.5 py-1.5 rounded-full border shadow-sm uppercase tracking-widest",
                             row.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50" : "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50"
                          )}>
                             {row.status} Hub
                          </span>
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

function StatCardLarge({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-600 shadow-blue-200", 
    indigo: "bg-indigo-600 shadow-indigo-200", 
    green: "bg-emerald-600 shadow-emerald-200", 
    orange: "bg-amber-600 shadow-amber-200" 
  };
  
  return (
    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-8 group hover:translate-y-[-8px] transition-all duration-500">
      <div className={cn("w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-6", bgColors[color])}>
         <Icon className="w-10 h-10" />
      </div>
      <div>
         <p className="text-[11px] font-bold text-slate-400 uppercase mb-4 leading-none truncate tracking-widest">{label}</p>
         <p className="text-5xl font-bold text-slate-800 tracking-tighter leading-none">{value}</p>
      </div>
      <div className={cn(
        "flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-2xl w-fit shadow-sm border",
        up ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
      )}>
         {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
         {trend}
      </div>
    </div>
  );
}
