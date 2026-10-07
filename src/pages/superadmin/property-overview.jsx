import React, { useState, useEffect } from "react";
import { 
  Building2, CheckCircle2, Clock,
  ChevronRight, Calendar,
  ClipboardCheck,
  Users, MessageSquare, List
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { fetchPropertyOverviewStats, fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { StatCard } from "../../components/superadmin/StatCard";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const COLORS = {
  blue: "bg-info-soft text-info",
  green: "bg-success-soft text-success",
  yellow: "bg-warning-soft text-warning",
  purple: "bg-purple-soft text-purple",
  cyan: "bg-cyan-50 text-cyan-600",
};

export default function PropertyOverview() {
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, leads: 0 });
  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, propsRes] = await Promise.all([
          fetchPropertyOverviewStats().catch(() => null),
          fetchJson("/api/properties?limit=5&sort=-createdAt").catch(() => null)
        ]);

        if (statsRes?.success && statsRes.summary) {
          setStats({
            total: statsRes.summary.total || statsRes.summary.totalProperties || 0,
            active: statsRes.summary.approved || statsRes.summary.activeProperties || statsRes.summary.approvedProperties || 0,
            pending: statsRes.summary.pending || statsRes.summary.pendingReview || statsRes.summary.pendingProperties || 0,
            rejected: statsRes.summary.rejected || statsRes.summary.rejectedProperties || 0,
            leads: statsRes.summary.newThisMonth || statsRes.summary.totalLeads || 0
          });
        }

        if (propsRes) {
          const propList = Array.isArray(propsRes) ? propsRes : (propsRes.properties || propsRes.data || []);
          setRecentProperties(propList.slice(0, 5).map(p => ({
            name: p.title || p.propertyName || p.name || "Unnamed Property",
            owner: p.ownerName || p.owner?.name || "—",
            location: p.city || p.locationCode || "—",
            status: p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending",
            date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"
          })));
        }
      } catch (error) {
        console.error("Property Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const propertyStatusData = [
    { name: "Approved", value: stats.active || 0, color: "#10B981" },
    { name: "Pending", value: stats.pending || 0, color: "#F59E0B" },
    { name: "Rejected", value: stats.rejected || 0, color: "#EF4444" },
  ];

  const actionCards = [
    { title: "Add Properties", desc: "Add new properties to the platform", count: stats.total, sub: "Total properties", btn: "Add New Property", icon: Building2, color: "blue" },
    { title: "Approve / Reject", desc: "Review and take action on submitted properties", count: stats.pending, sub: "Pending review", btn: "Review Now", icon: ClipboardCheck, color: "green" },
    { title: "Pending Properties", desc: "Properties waiting for approval", count: stats.pending, sub: "Pending approval", btn: "View Pending", icon: Clock, color: "yellow" },
    { title: "All Properties List", desc: "View and manage all properties", count: stats.total, sub: "Total properties", btn: "View All Properties", icon: List, color: "purple" },
    { title: "Online Leads", desc: "Manage all incoming online leads", count: stats.leads, sub: "This month", btn: "View Online Leads", icon: Users, color: "cyan" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Property Management" 
        subtitle="Manage and oversee all platform property listings."
        actions={
          <div className="flex items-center gap-3 bg-white border border-border/60 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
         <StatCard label="Total Properties" value={stats.total.toLocaleString()} delta="" trend="up" icon={Building2} iconColor="blue" loading={loading} />
         <StatCard label="Approved" value={stats.active.toLocaleString()} delta="" trend="up" icon={CheckCircle2} iconColor="green" loading={loading} />
         <StatCard label="Pending Review" value={stats.pending.toLocaleString()} delta="" trend="up" icon={Clock} iconColor="yellow" loading={loading} />
         <StatCard label="Incoming Leads" value={stats.leads.toLocaleString()} delta="" trend="up" icon={MessageSquare} iconColor="purple" loading={loading} />
      </div>

      <div className="grid grid-cols-12 gap-6">
         <div className="col-span-12 lg:col-span-5 panel">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-bold text-slate-900">Status Overview</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
               <div className="relative h-56 w-56 flex items-center justify-center mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={propertyStatusData} innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                           {propertyStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-3xl font-black text-slate-900">{loading ? "—" : stats.total.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</p>
                  </div>
               </div>
               <div className="w-full space-y-4">
                  {propertyStatusData.map((item) => (
                     <div key={item.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                           <span className="text-sm font-bold text-slate-500">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-black text-slate-900">{item.value.toLocaleString()}</span>
                           <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">
                             {stats.total > 0 ? `${((item.value / stats.total) * 100).toFixed(1)}%` : "0%"}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="col-span-12 lg:col-span-7 panel">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900">Recent Listings</h3>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Database</span>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-slate-200/80 bg-white">
                        <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                        <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                        <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                     {loading ? (
                       <tr><td colSpan="4" className="py-10 text-center text-xs font-semibold text-slate-400">Loading...</td></tr>
                     ) : recentProperties.length === 0 ? (
                       <tr><td colSpan="4" className="py-10 text-center text-xs font-semibold text-slate-400">No properties found</td></tr>
                     ) : recentProperties.map((prop, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors duration-150">
                           <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-full bg-slate-200/70 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 font-semibold text-xs">
                                    <Building2 size={16} className="text-slate-600" />
                                 </div>
                                 <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 text-sm truncate">{prop.name}</div>
                                    <div className="text-xs text-slate-500">{prop.location}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="py-4 px-6 text-sm text-slate-700 font-medium">{prop.owner}</td>
                           <td className="py-4 px-6">
                              <span className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                                prop.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                                prop.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              )}>{prop.status}</span>
                           </td>
                           <td className="py-4 px-6 text-xs text-slate-500 font-medium">{prop.date}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
         {actionCards.map((card, i) => (
            <div key={i} className="panel !p-6 flex flex-col items-center text-center group hover:translate-y-[-4px] transition-all">
               <div className={cn("icon-bubble mb-5 transition-transform group-hover:scale-110", COLORS[card.color])}>
                  <card.icon size={22} />
               </div>
               <h4 className="text-sm font-bold text-slate-900 mb-2 leading-tight">{card.title}</h4>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-5">{card.desc}</p>
               
               <div className="mb-6 mt-auto">
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {loading ? "—" : card.count.toLocaleString()}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.sub}</p>
               </div>

               <button className={cn(
                 "w-full py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                 card.color === "blue" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700" :
                 "bg-slate-100 text-slate-600 hover:bg-slate-200"
               )}>
                  {card.btn}
               </button>
            </div>
         ))}
      </div>
    </div>
  );
}
