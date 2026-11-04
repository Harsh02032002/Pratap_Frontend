import React, { useState, useEffect } from "react";
import { 
  Building2, CheckCircle2, Clock,
  Calendar,
  ClipboardCheck,
  Users, MessageSquare, List
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { fetchPropertyOverviewStats, fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

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
    { title: "Add Properties", desc: "Add new properties to the platform", count: stats.total, sub: "Total properties", btn: "Add New Property", color: "blue" },
    { title: "Approve / Reject", desc: "Review and take action on submitted properties", count: stats.pending, sub: "Pending review", btn: "Review Now", color: "green" },
    { title: "Pending Properties", desc: "Properties waiting for approval", count: stats.pending, sub: "Pending approval", btn: "View Pending", color: "yellow" },
    { title: "All Properties List", desc: "View and manage all properties", count: stats.total, sub: "Total properties", btn: "View All Properties", color: "purple" },
    { title: "Online Leads", desc: "Manage all incoming online leads", count: stats.leads, sub: "This month", btn: "View Online Leads", color: "cyan" },
  ];

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Property Management</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Manage and oversee all platform property listings.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] shadow-xs text-[13px] font-semibold text-[#10242A]">
          <Calendar className="w-4 h-4 text-[#4A5961]" />
          <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: loading ? "..." : stats.total.toLocaleString() },
          { label: "Approved", value: loading ? "..." : stats.active.toLocaleString() },
          { label: "Pending Review", value: loading ? "..." : stats.pending.toLocaleString() },
          { label: "Incoming Leads", value: loading ? "..." : stats.leads.toLocaleString() },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{item.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{item.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-[#10242A]">Status Overview</h3>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-48 w-48 flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propertyStatusData} innerRadius={60} outerRadius={82} paddingAngle={5} dataKey="value" stroke="none">
                    {propertyStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[24px] font-bold text-[#10242A]">{loading ? "—" : stats.total.toLocaleString()}</p>
                <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider mt-0.5">Total</p>
              </div>
            </div>
            <div className="w-full space-y-2.5">
              {propertyStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[13px] font-medium text-[#4A5961]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-bold text-[#10242A]">{item.value.toLocaleString()}</span>
                    <span className="text-[11px] font-semibold text-[#4A5961] px-2 py-0.5 bg-[#F4F6F8] rounded-md">
                      {stats.total > 0 ? `${((item.value / stats.total) * 100).toFixed(1)}%` : "0%"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#10242A]">Recent Listings</h3>
            <span className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">Live Database</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pl-2">Property</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider pr-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {loading ? (
                  <tr><td colSpan="4" className="py-6 text-center text-[13px] text-[#4A5961]">Loading...</td></tr>
                ) : recentProperties.length === 0 ? (
                  <tr><td colSpan="4" className="py-6 text-center text-[13px] text-[#4A5961]">No properties found</td></tr>
                ) : recentProperties.map((prop, i) => (
                  <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 pl-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#D9E1E7] shrink-0 flex items-center justify-center text-[#4A5961] font-bold text-[11px]">
                          {(prop.name || "P").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#10242A] text-[13px] truncate">{prop.name}</div>
                          <div className="text-[12px] text-[#4A5961]">{prop.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-[13px] text-[#10242A] font-medium">{prop.owner}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
                        prop.status === "Approved" ? "bg-[#DDF3E4] text-[#14532D]" :
                        prop.status === "Pending" ? "bg-[#FDEBD0] text-[#7A3E00]" : "bg-[#FDE8E8] text-[#991B1B]"
                      )}>{prop.status}</span>
                    </td>
                    <td className="py-2.5 pr-2 text-[13px] text-[#4A5961]">{prop.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {actionCards.map((card, i) => (
          <div key={i} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-[14px] font-bold text-[#10242A] mb-1 leading-tight">{card.title}</h4>
              <p className="text-[12px] text-[#4A5961] leading-relaxed mb-3">{card.desc}</p>
            </div>
            
            <div className="mb-3 mt-auto">
              <p className="text-[22px] font-bold text-[#10242A] tracking-tight leading-none mb-1">
                {loading ? "—" : card.count.toLocaleString()}
              </p>
              <p className="text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider">{card.sub}</p>
            </div>

            <button className={cn(
              "w-full py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer",
              card.color === "blue" ? "bg-[#0E7C86] text-white hover:bg-[#0B666E]" :
              "bg-white border border-[#CBD3D9] text-[#10242A] hover:bg-gray-50"
            )}>
              {card.btn}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
