import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { StatCard } from "../../components/dashboard/StatCard";
import { Home, Users, FileText, IndianRupee, Database, Eye, Download, Building2, MapPin } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import { fetchJson } from "../../utils/api";

const shortcuts = [
  { icon: Home, label: "Listings Report", color: "blue" },
  { icon: Users, label: "Users Report", color: "green" },
  { icon: FileText, label: "Leads / Bookings Report", color: "purple" },
  { icon: IndianRupee, label: "Revenue Report", color: "yellow" },
  { icon: Database, label: "Commission Report", color: "red" },
  { icon: FileText, label: "Subscriptions Report", color: "blue" },
  { icon: FileText, label: "Refunds Report", color: "purple" },
  { icon: Building2, label: "Performance Report", color: "blue" },
  { icon: MapPin, label: "Locations Report", color: "green" },
];

export default function ReportsCommission() {
  const [summary, setSummary] = useState({ totalProperties: 0, totalTenants: 0, monthlyRevenue: 0, netProfit: 0 });
  const [revStats, setRevStats] = useState({ totalRevenue: 0, commissionEarned: 0, refundsCount: 0, totalTransactions: 0 });
  const [perf, setPerf] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchJson("/api/superadmin/reports/overview").catch(() => null),
      fetchJson("/api/superadmin/revenue/stats?period=month").catch(() => null)
    ]).then(([repRes, revRes]) => {
      if (repRes?.summary) setSummary(repRes.summary);
      if (repRes?.charts?.revenueOverviewData) {
        setPerf(repRes.charts.revenueOverviewData.map(r => ({
          name: r.name,
          listings: repRes.summary?.totalProperties || 0,
          users: repRes.summary?.totalTenants || 0,
          leads: r.val || 0,
          revenue: r.rev || 0
        })));
      }
      if (revRes?.stats) setRevStats(revRes.stats);
    });
  }, []);

  const cats = [
    { name: "Listings", value: summary.totalProperties || 0, color: "hsl(var(--chart-1))" },
    { name: "Users", value: summary.totalTenants || 0, color: "hsl(var(--chart-2))" },
    { name: "Transactions", value: revStats.totalTransactions || 0, color: "hsl(var(--chart-5))" },
    { name: "Refunds", value: revStats.refundsCount || 0, color: "hsl(280 75% 60%)" },
  ];
  const totalCat = cats.reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader
        title="Commission Report"
        subtitle="Analysis of commission collected from bookings."
        actions={
          <button className="h-11 px-5 rounded-xl border border-border bg-card font-medium text-sm flex items-center gap-2 hover:bg-muted">
            <Download className="h-4 w-4" /> Export Report
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Listings" value={String(summary.totalProperties || 0)} delta="Scoped" trend="up" icon={Home} iconColor="blue" />
        <StatCard label="Total Tenants" value={String(summary.totalTenants || 0)} delta="Scoped" trend="up" icon={Users} iconColor="green" />
        <StatCard label="Transactions" value={String(revStats.totalTransactions || 0)} delta="Scoped" trend="up" icon={FileText} iconColor="purple" />
        <StatCard label="Total Revenue" value={`₹${Number(revStats.totalRevenue || 0).toLocaleString("en-IN")}`} delta="Scoped" trend="up" icon={IndianRupee} iconColor="yellow" />
        <StatCard label="Total Commission" value={`₹${Number(revStats.commissionEarned || 0).toLocaleString("en-IN")}`} delta="Scoped" trend="up" icon={Database} iconColor="red" />
        <StatCard label="Total Refunds" value={String(revStats.refundsCount || 0)} delta="Scoped" trend="down" icon={Eye} iconColor="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="panel xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Performance Summary</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={perf}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="listings" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="font-semibold mb-4">Distribution by Category</h3>
          <div className="flex items-center gap-4">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={cats} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {cats.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl font-bold">{totalCat}</div>
                <div className="text-[10px] text-muted-foreground">Records</div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-1.5 text-xs">
              {cats.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span>{c.name}</span>
                  </div>
                  <span className="text-muted-foreground">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="font-semibold mb-4">Report Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {shortcuts.map((s, i) => {
            const Icon = s.icon;
            const cls = {
              blue: "bg-info-soft text-info",
              green: "bg-success-soft text-success",
              purple: "bg-brand-purple-soft text-brand-purple",
              yellow: "bg-warning-soft text-warning",
              red: "bg-destructive/10 text-destructive",
            };
            return (
              <button key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 text-left">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${cls[s.color]}`}><Icon className="h-4 w-4" /></div>
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
