import React from "react";
import { Building2, User, DollarSign, FileText, UserPlus, Wrench, TrendingUp, FileBarChart } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { DateRangePill } from "../../components/dashboard/DateRangePill";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const revenueData = [
  { name: "Jan", v: 5000 }, { name: "Feb", v: 10500 },
  { name: "Mar", v: 16000 }, { name: "Apr", v: 14500 }, { name: "May", v: 20000 },
];

const propertyStatus = [
  { name: "Occupied", value: 76, color: "hsl(var(--chart-1))" },
  { name: "Vacant", value: 34, color: "hsl(var(--chart-2))" },
  { name: "Maintenance", value: 12, color: "hsl(var(--chart-3))" },
  { name: "Blocked", value: 6, color: "hsl(var(--chart-4))" },
];

const activities = [
  { icon: UserPlus, color: "green", title: "New tenant Rahul Sharma added", sub: "2 BHK Apartment, Green Residency", time: "10:30 AM" },
  { icon: Building2, color: "blue", title: "Property Green Villa updated", sub: "Rent increased to ₹25,000", time: "Yesterday" },
  { icon: DollarSign, color: "yellow", title: "Payment received from Amit Verma", sub: "₹25,000 for May 2025", time: "Yesterday" },
  { icon: Wrench, color: "purple", title: "Maintenance request #MR-125 updated", sub: "Bathroom plumbing issue resolved", time: "19 May 2025" },
];

const colorMap = {
  green: "bg-success-soft text-success",
  blue: "bg-info-soft text-info",
  yellow: "bg-warning-soft text-warning",
  purple: "bg-brand-purple-soft text-brand-purple",
};

export default function Dashboard() {
  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Dashboard</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Welcome back, Aman! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
           <DateRangePill value="20 May 2025" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Stat Cards rendered inline to match the compact theme */}
        {[
          { label: "Total Properties", value: "128", delta: "+12 this month", trend: "up", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Tenants", value: "342", delta: "+18 this month", trend: "up", icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Revenue", value: "₹18,75,000", delta: "+15.6% this month", trend: "up", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Expenses", value: "₹6,45,000", delta: "-5.3% this month", trend: "down", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" }
        ].map((stat, i) => (
           <div key={i} className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#4A5961] uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${stat.bg} ${stat.color}`}>
                   <stat.icon size={16} />
                </div>
             </div>
             <div>
                <p className="text-[22px] font-bold text-[#10242A] leading-tight">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                   <TrendingUp size={14} className={stat.trend === "up" ? "text-emerald-500" : "text-rose-500 rotate-180"} />
                   <span className={cn("text-[11px] font-semibold", stat.trend === "up" ? "text-emerald-600" : "text-rose-600")}>{stat.delta}</span>
                </div>
             </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[14px] text-[#10242A]">Revenue Overview</h3>
            <select className="appearance-none h-8 px-2.5 rounded-[6px] border border-[#CBD3D9] bg-white text-[12px] font-semibold text-[#10242A] focus:outline-none focus:border-[#0E7C86] shadow-xs cursor-pointer">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E7C86" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0E7C86" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E6EA" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#4A5961", fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `${v / 1000}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E1E6EA', fontSize: '12px', fontWeight: 'bold', color: '#10242A' }} />
                <Area type="monotone" dataKey="v" stroke="#0E7C86" strokeWidth={2.5} fill="url(#rev)" dot={{ fill: "#0E7C86", r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <h3 className="font-bold text-[14px] text-[#10242A] mb-4">Property Status</h3>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={propertyStatus} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                  {propertyStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[20px] font-bold text-[#10242A]">128</div>
              <div className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Total</div>
            </div>
          </div>
          <div className="mt-4 space-y-2.5">
            {propertyStatus.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold text-[#10242A]">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#10242A]">{s.value}</span>
                  <span className="text-[#4A5961] w-8 text-right font-medium">{Math.round((s.value / 128) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[14px] text-[#10242A]">Recent Activities</h3>
            <button className="text-[12px] font-semibold text-[#0E7C86] hover:underline cursor-pointer">View All</button>
          </div>
          <div className="divide-y divide-[#F0F4F6]">
            {activities.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${colorMap[a.color]}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#10242A] truncate">{a.title}</p>
                    <p className="text-[12px] text-[#4A5961] mt-0.5 truncate">{a.sub}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#8C9BA5] shrink-0">{a.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-4 shadow-xs">
          <h3 className="font-bold text-[14px] text-[#10242A] mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            {[
              { icon: DollarSign, color: "green", label: "Total Revenue", value: "₹18,75,000", valColor: "text-emerald-600" },
              { icon: FileText, color: "red", label: "Total Expenses", value: "₹6,45,000", valColor: "text-rose-600" },
              { icon: TrendingUp, color: "blue", label: "Net Profit", value: "₹12,30,000", valColor: "text-blue-600" },
              { icon: FileBarChart, color: "yellow", label: "Outstanding", value: "₹3,25,000", valColor: "text-amber-600" },
            ].map((row, i) => {
              const Icon = row.icon;
              const cls = {
                green: "bg-emerald-50 text-emerald-600",
                red: "bg-rose-50 text-rose-600",
                blue: "bg-blue-50 text-blue-600",
                yellow: "bg-amber-50 text-amber-600",
              };
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${cls[row.color]}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-[13px] font-semibold text-[#4A5961]">{row.label}</span>
                  </div>
                  <span className={`font-bold text-[13px] ${row.valColor}`}>{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
