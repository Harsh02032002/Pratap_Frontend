import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { 
  TrendingUp, BarChart3, IndianRupee, Download, 
  ArrowUpRight, PieChart, ShieldCheck, AlertTriangle
} from "lucide-react";
import { fetchJson } from "../../utils/api";

export default function RevenueReportsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  // Collections are read per property (the sidebar's active property), but payouts
  // settle to the owner's bank account and carry no property reference — so the
  // commission pair below stays account-wide and is labelled as such.
  const activePropertyId = getActiveOwnerPropertyId();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    tenantCollected: 0,
    accountCollected: 0,
    ownerPayouts: 0,
    platformFee: 0,
    commissionPercent: 0,
    propertyName: null
  });

  useEffect(() => {
    if (!owner?.loginId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const base = `/api/owners/${owner.loginId}/revenue-dashboard`;
        // When a property is selected we need both views: the scoped one for that
        // property's collections, and the account-wide one for the payout and
        // commission figures, which only make sense across the whole account.
        const [scopedRes, accountRes] = await Promise.all([
          fetchJson(activePropertyId ? `${base}?propertyId=${encodeURIComponent(activePropertyId)}` : base),
          activePropertyId ? fetchJson(base) : Promise.resolve(null)
        ]);

        if (scopedRes.success || scopedRes.summaryMetrics) {
          const accountData = accountRes || scopedRes;
          const tenantCollected = scopedRes.summaryMetrics?.tenantCollected || 0;
          const accountCollected = accountData.summaryMetrics?.tenantCollected || 0;
          const ownerPayouts = accountData.summaryMetrics?.ownerPayouts || 0;
          const platformFee = Math.max(0, accountCollected - ownerPayouts);
          const commissionPercent = accountCollected > 0 ? Math.round((platformFee / accountCollected) * 100) : 0;

          setAnalyticsData({
            tenantCollected,
            accountCollected,
            ownerPayouts,
            platformFee,
            commissionPercent,
            propertyName: scopedRes.scope?.propertyName || null
          });
        } else {
          setError(scopedRes.error || "Failed to load analytics data");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [owner?.loginId, activePropertyId]);

  // Payouts and commission are account-wide, so the stream percentages are read
  // against account collections — mixing them with one property's total would
  // report a commission rate that was never charged.
  const streamBase = analyticsData.accountCollected || 0;
  const items = [
    {
      source: activePropertyId ? "Tenant Rent Collections (this property)" : "Tenant Rent Collections",
      amount: analyticsData.tenantCollected,
      percentage: streamBase > 0 ? `${Math.round((analyticsData.tenantCollected / streamBase) * 100)}%` : "—"
    },
    { source: "Owner Payouts Settled (Net) — all properties", amount: analyticsData.ownerPayouts, percentage: `${100 - analyticsData.commissionPercent}%` },
    { source: "Platform Commission & Service Fees — all properties", amount: analyticsData.platformFee, percentage: `${analyticsData.commissionPercent}%` }
  ];

  if (loading) {
    return (
      <PropertyOwnerLayout 
        owner={owner} 
        title="Revenue Analytics" 
        onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Revenue Analytics...</p>
        </div>
      </PropertyOwnerLayout>
    );
  }

  if (error) {
    return (
      <PropertyOwnerLayout 
        owner={owner} 
        title="Revenue Analytics" 
        onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
          <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="font-serif text-lg text-foreground font-bold">Error Loading Data</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
        </div>
      </PropertyOwnerLayout>
    );
  }

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Revenue Analytics" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Revenue Reports</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Monitor collections growth, platform payouts settled, and fees breakdown.
            {activePropertyId && analyticsData.propertyName ? ` Collections shown for ${analyticsData.propertyName}.` : ""}
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tenant Rent Collections</span>
          <h3 className="text-[28px] font-bold text-slate-900 mt-1">₹{analyticsData.tenantCollected.toLocaleString("en-IN")}</h3>
          {activePropertyId && analyticsData.propertyName && (
            <p className="text-[11px] text-muted-foreground mt-1">{analyticsData.propertyName}</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Owner Payouts Settled</span>
          <h3 className="text-[28px] font-bold text-emerald-600 mt-1">₹{analyticsData.ownerPayouts.toLocaleString("en-IN")}</h3>
          {activePropertyId && (
            <p className="text-[11px] text-muted-foreground mt-1">All properties — payouts settle to your account</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Platform Commission ({analyticsData.commissionPercent}%)</span>
          <h3 className="text-[28px] font-bold text-blue-600 mt-1">₹{analyticsData.platformFee.toLocaleString("en-IN")}</h3>
          {activePropertyId && (
            <p className="text-[11px] text-muted-foreground mt-1">All properties — derived from account payouts</p>
          )}
        </div>
      </div>

      {/* Sources */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
        <h3 className="font-serif text-[20px] text-foreground border-b border-border/60 pb-3">Financial Streams Breakdown</h3>
        <div className="space-y-4">
          {items.map((i, index) => (
            <div key={index} className="flex justify-between items-center border border-border p-4 rounded-xl bg-muted/20">
              <div>
                <h4 className="text-[13.5px] font-bold text-slate-800">{i.source}</h4>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">₹{i.amount.toLocaleString("en-IN")}</p>
              </div>
              <span className="font-bold text-primary text-[15px]">{i.percentage}</span>
            </div>
          ))}
        </div>
      </div>
    </PropertyOwnerLayout>
  );
}
