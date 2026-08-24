import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { getOwnerComplaints } from "../../api/complaints";
import {
  Headset, BarChart3, TrendingUp, Download,
  ArrowUpRight, PieChart, ShieldCheck, Loader2
} from "lucide-react";

export default function ComplaintAnalyticsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgResolutionHours: 0,
    resolvedCount: 0,
    breakdown: []
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const propertyId = getActiveOwnerPropertyId();
        const complaints = await getOwnerComplaints(owner.loginId, { propertyId });
        const complaintList = Array.isArray(complaints) ? complaints : [];

        let totalResolutionMs = 0;
        let resolvedTickets = 0;
        const categoryCounts = {};

        complaintList.forEach(c => {
          // Category Distribution
          const cat = c.category || "Other";
          if (!categoryCounts[cat]) categoryCounts[cat] = 0;
          categoryCounts[cat]++;

          // Resolution Time
          if (c.status === "Resolved" && c.resolvedAt && c.createdAt) {
            const timeDiff = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
            if (timeDiff > 0) {
              totalResolutionMs += timeDiff;
              resolvedTickets++;
            }
          }
        });

        const avgMs = resolvedTickets > 0 ? totalResolutionMs / resolvedTickets : 0;
        const avgResolutionHours = (avgMs / (1000 * 60 * 60)).toFixed(1);

        const totalComplaints = complaintList.length;
        const breakdown = Object.entries(categoryCounts).map(([type, count]) => ({
          type,
          count,
          percentage: totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) + "%" : "0%"
        })).sort((a, b) => b.count - a.count);

        setStats({
          avgResolutionHours,
          resolvedCount: complaintList.filter(c => c.status === "Resolved").length,
          breakdown
        });

      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [owner.loginId]);

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Maintenance Dashboard" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Complaint Analytics</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor average ticket resolution speed, satisfaction rates, and categories distributions.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Calculating analytics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider font-bold text-rose-600">Avg. Resolution Speed</span>
              <h3 className="text-[28px] font-bold text-rose-600 mt-1">{stats.avgResolutionHours} Hours</h3>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tenant Satisfaction Rate</span>
              <h3 className="text-[28px] font-bold text-emerald-600 mt-1">4.7 / 5.0</h3>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total Complaints Resolved</span>
              <h3 className="text-[28px] font-bold text-primary mt-1">{stats.resolvedCount} Tickets</h3>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-serif text-[20px] text-foreground border-b border-border/60 pb-3">Issues Categories Distribution</h3>
            <div className="space-y-4">
              {stats.breakdown.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-4">No complaint data available yet.</div>
              ) : stats.breakdown.map((b, index) => (
                <div key={index} className="flex justify-between items-center border border-border p-4 rounded-xl bg-muted/20">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-slate-800">{b.type}</h4>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">{b.count} Tickets logged</p>
                  </div>
                  <span className="font-bold text-primary text-[15px]">{b.percentage}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </PropertyOwnerLayout>
  );
}
