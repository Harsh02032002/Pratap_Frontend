import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Building2, UserPlus, 
  ArrowUpRight, ArrowDownRight, ChevronRight, 
  MoreVertical, Search, Calendar, ShieldCheck,
  CheckCircle2, Clock, XCircle, Activity,
  Briefcase, UserCircle, ClipboardList, Mail,
  UserMinus, UserMinus2, UserX
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { fetchUserOverviewStats } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { StatCard } from "../../components/superadmin/StatCard";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const iconMap = {
  Building2,
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle
};

const COLORS = {
  blue: "bg-info-soft text-info",
  green: "bg-success-soft text-success",
  yellow: "bg-warning-soft text-warning",
  red: "bg-rose-50 text-rose-600",
};

export default function UserOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, team: 0, owners: 0, tenants: 0, activeToday: 0 });
  const [loading, setLoading] = useState(true);

  const [userDistributionData, setUserDistributionData] = useState([
    { name: "Team Members", value: 0, color: "#6366F1", percent: "0%" },
    { name: "Property Owners", value: 0, color: "#10B981", percent: "0%" },
    { name: "Tenants", value: 0, color: "#3B82F6", percent: "0%" },
  ]);

  const [recentUsersData, setRecentUsersData] = useState([]);

  const [pendingApprovals, setPendingApprovals] = useState([
    { label: "Property Owners", count: 0, icon: Building2, color: "green" },
    { label: "Tenants", count: 0, icon: Users, color: "blue" },
    { label: "Documents", count: 0, icon: ClipboardList, color: "yellow" },
  ]);

  const [kycStatus, setKycStatus] = useState([
    { label: "Verified", count: 0, icon: CheckCircle2, color: "green" },
    { label: "Pending", count: 0, icon: Clock, color: "yellow" },
    { label: "Rejected", count: 0, icon: XCircle, color: "red" },
  ]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await fetchUserOverviewStats();
        if (res.success) {
          if (res.summary) {
            setStats({
              total: res.summary.total || 0,
              team: res.summary.team || 0,
              owners: res.summary.owners || 0,
              tenants: res.summary.tenants || 0,
              activeToday: res.summary.activeToday || 0
            });
          }
          if (res.userDistributionData) {
            setUserDistributionData(res.userDistributionData);
          }
          if (res.recentUsersData) {
            setRecentUsersData(res.recentUsersData);
          }
          if (res.pendingApprovals) {
            setPendingApprovals(res.pendingApprovals.map(item => ({
              ...item,
              icon: iconMap[item.icon] || ClipboardList
            })));
          }
          if (res.kycStatus) {
            setKycStatus(res.kycStatus.map(item => ({
              ...item,
              icon: iconMap[item.icon] || Clock
            })));
          }
        }
      } catch (error) {
        console.error("User Stats Error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        subtitle="Manage your team, property owners, and tenants all in one place."
        actions={
          <div className="flex items-center gap-3 bg-white border border-border/60 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Live Database Metrics</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
         <StatCard label="Total Users" value={stats.total.toLocaleString()} delta="+12.5%" trend="up" icon={Users} iconColor="blue" loading={loading} />
         <StatCard label="Team Members" value={stats.team.toLocaleString()} delta="+2.4%" trend="up" icon={Briefcase} iconColor="indigo" loading={loading} />
         <StatCard label="Owners" value={stats.owners.toLocaleString()} delta="+8.3%" trend="up" icon={Building2} iconColor="green" loading={loading} />
         <StatCard label="Tenants" value={stats.tenants.toLocaleString()} delta="+15.1%" trend="up" icon={UserCircle} iconColor="purple" loading={loading} />
         <StatCard label="Active Today" value={stats.activeToday.toLocaleString()} delta="+5.2%" trend="up" icon={Activity} iconColor="emerald" loading={loading} />
      </div>

      <div className="grid grid-cols-12 gap-6">
         <div className="col-span-12 lg:col-span-7 panel">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-bold text-slate-900">User Distribution</h3>
               <select className="h-9 px-3 rounded-xl border border-border bg-slate-50 text-xs font-bold text-slate-500 outline-none">
                  <option>This Month</option>
               </select>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="relative h-56 w-56 flex items-center justify-center shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie 
                           data={[
                             { name: "Team Members", value: stats.team, color: "#6366F1" },
                             { name: "Property Owners", value: stats.owners, color: "#10B981" },
                             { name: "Tenants", value: stats.tenants, color: "#3B82F6" },
                           ]} 
                           innerRadius={70} 
                           outerRadius={95} 
                           paddingAngle={5} 
                           dataKey="value" 
                           stroke="none"
                        >
                           {[
                             { name: "Team Members", value: stats.team, color: "#6366F1" },
                             { name: "Property Owners", value: stats.owners, color: "#10B981" },
                             { name: "Tenants", value: stats.tenants, color: "#3B82F6" },
                           ].map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <p className="text-3xl font-black text-slate-900">{stats.total.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Users</p>
                  </div>
               </div>
               <div className="flex-1 space-y-5 w-full">
                  {[
                    { name: "Team Members", value: stats.team, color: "#6366F1", total: stats.total },
                    { name: "Property Owners", value: stats.owners, color: "#10B981", total: stats.total },
                    { name: "Tenants", value: stats.tenants, color: "#3B82F6", total: stats.total },
                  ].map((item) => (
                     <div key={item.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                           <span className="text-sm font-bold text-slate-500">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-black text-slate-900">{item.value.toLocaleString()}</span>
                           <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">{item.total > 0 ? ((item.value / item.total) * 100).toFixed(1) : 0}%</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="col-span-12 lg:col-span-5 panel">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold text-slate-900">Recent Signups</h3>
               <button onClick={() => navigate('/superadmin/new_signups')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
               {recentUsersData.map((user, i) => (
                  <div key={i} className="flex items-center gap-4 group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-transform group-hover:scale-105">
                        {user.initial}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-[13px] font-bold text-slate-900 truncate leading-none">{user.name}</h4>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-[11px] text-slate-400 font-medium truncate">{user.email}</p>
                           <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{user.status}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="panel">
            <h3 className="text-lg font-bold text-slate-900 mb-8">Approvals Queue</h3>
            <div className="space-y-5">
               {pendingApprovals.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                     <div className="flex items-center gap-4">
                        <div className={cn("icon-bubble !h-10 !w-10 shadow-sm", COLORS[item.color])}>
                           <item.icon size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">{item.label}</span>
                     </div>
                     <p className="text-lg font-black text-slate-900 tracking-tight">{item.count}</p>
                  </div>
               ))}
            </div>
         </div>

         <div className="panel">
            <h3 className="text-lg font-bold text-slate-900 mb-8">KYC Status</h3>
            <div className="space-y-5">
               {kycStatus.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                     <div className="flex items-center gap-4">
                        <div className={cn("icon-bubble !h-10 !w-10 shadow-sm", COLORS[item.color])}>
                           <item.icon size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-500">{item.label}</span>
                     </div>
                     <p className="text-lg font-black text-slate-900 tracking-tight">{item.count}</p>
                  </div>
               ))}
            </div>
         </div>

         <div className="panel bg-slate-900 text-white border-none shadow-xl">
            <h3 className="text-lg font-bold mb-8">System Health</h3>
            <div className="space-y-6">
               {[
                 { label: "Active Sessions", value: "1,240", percent: "98%" },
                 { label: "KYC Completion", value: "842", percent: "74%" },
                 { label: "Support Response", value: "< 2h", percent: "95%" },
               ].map((item, i) => (
                  <div key={i}>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
                        <span className="text-xs font-black">{item.percent}</span>
                     </div>
                     <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: item.percent}} />
                     </div>
                  </div>
               ))}
            </div>
            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl font-bold text-sm transition-all">
               View Logs
            </button>
         </div>
      </div>
    </div>
  );
}
