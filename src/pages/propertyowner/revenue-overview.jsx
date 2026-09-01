import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import {
  IndianRupee, TrendingUp, TrendingDown, ArrowUpRight,
  Calendar, CheckCircle, Clock, AlertTriangle, FileText, Download, Wallet
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fetchJson } from "../../utils/api";

export default function RevenueOverviewPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  // Helper: compute YYYY-MM for offset from current month (0 = this month, -1 = last month…)
  const computeMonth = (offset = 0) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const buildOptions = () => {
    const opts = [];
    for (let i = 0; i >= -5; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() + i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  };

  const monthOptions = buildOptions();

  // Revenue is read per property: the sidebar's active property scopes every
  // figure below, so two properties owned by the same account never share totals.
  const activePropertyId = getActiveOwnerPropertyId();
  const [selectedMonth, setSelectedMonth] = useState(computeMonth(0));
  const [activeTab, setActiveTab] = useState("tenants");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summaryMetrics: {
      tenantCollected: 0,
      ownerPayouts: 0,
      pendingPayouts: 0,
      tenantDues: 0
    },
    recentPayments: [],
    recentPayouts: [],
    revenueChartData: [],
    collectionBreakdown: { rent: { amount: 0, percent: 0 }, penalty: { amount: 0, percent: 0 }, electricity: { amount: 0, percent: 0 } },
    scope: null
  });

  useEffect(() => {
    if (!owner?.loginId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const propertyParam = activePropertyId ? `&propertyId=${encodeURIComponent(activePropertyId)}` : "";
        const res = await fetchJson(`/api/owners/${owner.loginId}/revenue-dashboard?month=${selectedMonth}${propertyParam}`);
        if (res.success || res.summaryMetrics) {
          setDashboardData({
            summaryMetrics: res.summaryMetrics || { tenantCollected: 0, ownerPayouts: 0, pendingPayouts: 0, tenantDues: 0 },
            recentPayments: res.recentPayments || [],
            recentPayouts: res.recentPayouts || [],
            revenueChartData: res.revenueChartData || [],
            collectionBreakdown: res.collectionBreakdown || { rent: { amount: 0, percent: 0 }, penalty: { amount: 0, percent: 0 }, electricity: { amount: 0, percent: 0 } },
            scope: res.scope || null
          });
        } else {
          setError(res.error || "Failed to load dashboard data");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [owner?.loginId, selectedMonth, activePropertyId]);

  const { summaryMetrics, recentPayments, recentPayouts, revenueChartData, collectionBreakdown, scope } = dashboardData;

  // ── Statement download ─────────────────────────────────────────────────────
  // Built from the data already on screen, so the file always matches what the
  // page shows — same month, same property scope — with no second round trip.
  const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvRow = (cells) => cells.map(csvCell).join(",");

  const triggerCsvDownload = (csvString, fileName) => {
    // \uFEFF = UTF-8 BOM so Excel opens the rupee amounts correctly
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  };

  const handleDownloadStatement = () => {
    const monthLabel = monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth;
    const scopeLabel = activePropertyId ? (scope?.propertyName || "Selected property") : "All properties";

    const lines = [
      csvRow(["Revenue Statement"]),
      csvRow(["Owner", owner?.name || owner?.loginId || ""]),
      csvRow(["Owner ID", owner?.loginId || ""]),
      csvRow(["Property", scopeLabel]),
      csvRow(["Month", monthLabel]),
      csvRow(["Generated", new Date().toLocaleString("en-IN")]),
      "",
      csvRow(["Summary", "Amount (INR)", "Scope"]),
      csvRow(["Tenant Collections", summaryMetrics.tenantCollected, scopeLabel]),
      // Payouts have no property reference in the ledger — say so in the file too,
      // so a property-scoped statement can't be misread as property-level payouts.
      csvRow(["Owner Payouts (Net)", summaryMetrics.ownerPayouts, "All properties"]),
      csvRow(["Pending Payouts", summaryMetrics.pendingPayouts, "All properties"]),
      csvRow(["Outstanding Dues", summaryMetrics.tenantDues, scopeLabel]),
      "",
      csvRow(["Collection Breakdown", "Amount (INR)", "Share"]),
      csvRow(["Rent", collectionBreakdown.rent?.amount ?? 0, `${collectionBreakdown.rent?.percent ?? 0}%`]),
      csvRow(["Electricity", collectionBreakdown.electricity?.amount ?? 0, `${collectionBreakdown.electricity?.percent ?? 0}%`]),
      csvRow(["Late Fines & Penalties", collectionBreakdown.penalty?.amount ?? 0, `${collectionBreakdown.penalty?.percent ?? 0}%`]),
      "",
      csvRow(["Recent Payments"]),
      csvRow(["Reference", "Tenant", "Room", "Category", "Date", "Status", "Amount (INR)"]),
      ...(recentPayments.length
        ? recentPayments.map(p => csvRow([p.id, p.tenant, p.room, p.category, p.date, p.status, p.amount]))
        : [csvRow(["No payments recorded for this period"])]),
      "",
      csvRow(["Recent Payouts (all properties)"]),
      csvRow(["Reference", "Title", "Method", "Date", "Status", "Amount (INR)"]),
      ...(recentPayouts.length
        ? recentPayouts.map(p => csvRow([p.id, p.title, p.method, p.date, p.status, p.amount]))
        : [csvRow(["No payouts recorded for this period"])]),
    ];

    const scopeSlug = (scopeLabel || "statement").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    triggerCsvDownload(lines.join("\n"), `Revenue_Statement_${scopeSlug}_${selectedMonth}.csv`);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid":
      case "Processed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-rose-50 text-rose-600 border-rose-100";
    }
  };

  if (loading) {
    return (
      <PropertyOwnerLayout
        owner={owner}
        title="Revenue Overview"
        onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
      >
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading Revenue Overview...</p>
        </div>
      </PropertyOwnerLayout>
    );
  }

  if (error) {
    return (
      <PropertyOwnerLayout
        owner={owner}
        title="Revenue Overview"
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
      title="Revenue Overview"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Revenue Overview</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Monitor collections from tenants and payouts settled to your account.
            {activePropertyId && scope?.propertyName ? ` Showing ${scope.propertyName}.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 border border-border bg-card rounded-xl text-xs font-semibold focus:outline-none"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button onClick={handleDownloadStatement} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Download className="size-4" /> Download Statement
          </button>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
            <span className="text-[11.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={12} /> Tenant Rent
            </span>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tenant collections</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">₹{summaryMetrics.tenantCollected.toLocaleString("en-IN")}</h3>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Wallet size={20} />
            </div>
            <span className="text-[11.5px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Received</span>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Owner Payouts (Net)</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">₹{summaryMetrics.ownerPayouts.toLocaleString("en-IN")}</h3>
          {activePropertyId && (
            <p className="text-[11px] text-muted-foreground mt-1">All properties — payouts settle to your account, not per property</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-[11.5px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Transit</span>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Payouts</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">₹{summaryMetrics.pendingPayouts.toLocaleString("en-IN")}</h3>
          {activePropertyId && (
            <p className="text-[11px] text-muted-foreground mt-1">All properties — payouts settle to your account, not per property</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[11.5px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Due</span>
          </div>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Dues</span>
          <h3 className="text-[28px] font-bold text-foreground mt-1">₹{summaryMetrics.tenantDues.toLocaleString("en-IN")}</h3>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-serif text-[20px] text-foreground mb-6">Tenant Rent vs Owner Payouts (MoM)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Area type="monotone" dataKey="tenantRent" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRent)" name="Tenant Rent Collected" />
                <Area type="monotone" dataKey="ownerPayout" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPayout)" name="Owner Payout Settled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown sidebar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-serif text-[20px] text-foreground mb-4">Collection Breakdown</h3>
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Rent Collections</span>
                <span>₹{(collectionBreakdown?.rent?.amount || 0).toLocaleString('en-IN')} ({collectionBreakdown?.rent?.percent || 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${collectionBreakdown?.rent?.percent || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Electricity</span>
                <span>₹{(collectionBreakdown?.electricity?.amount || 0).toLocaleString('en-IN')} ({collectionBreakdown?.electricity?.percent || 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${collectionBreakdown?.electricity?.percent || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Late Fines & Penalties</span>
                <span>₹{(collectionBreakdown?.penalty?.amount || 0).toLocaleString('en-IN')} ({collectionBreakdown?.penalty?.percent || 0}%)</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${collectionBreakdown?.penalty?.percent || 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details (Tabbed View) */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-serif text-[20px] text-foreground">Recent Transactions</h3>
          <div className="flex bg-muted/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("tenants")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "tenants" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Tenant Payments
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "payouts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Owner Payouts
            </button>
          </div>
        </div>

        {activeTab === "tenants" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3 font-semibold">Transaction ID</th>
                  <th className="px-6 py-3 font-semibold">Tenant Name</th>
                  <th className="px-6 py-3 font-semibold">Room</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-muted-foreground">{p.id}</td>
                    <td className="px-6 py-3 font-medium text-foreground">{p.tenant}</td>
                    <td className="px-6 py-3 text-muted-foreground">Room {p.room}</td>
                    <td className="px-6 py-3 font-bold text-foreground">₹{p.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3 font-semibold">Payout ID</th>
                  <th className="px-6 py-3 font-semibold">Payout Title</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-muted-foreground">{p.id}</td>
                    <td className="px-6 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.method}</td>
                    <td className="px-6 py-3 font-bold text-foreground">₹{p.amount.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PropertyOwnerLayout>
  );
}
