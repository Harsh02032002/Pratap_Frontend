import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import * as XLSX from "xlsx";
import {
  Building2, BedDouble, Users, IndianRupee, TrendingUp, TrendingDown,
  Award, AlertTriangle, Download, FileSpreadsheet, Printer, Plus,
  Calendar, RefreshCw, CheckSquare, Square, BarChart3, PieChart as PieIcon,
  Layers, ArrowUpRight, ArrowDownRight, Wallet, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

const DATE_PRESETS = [
  { id: "this_month", label: "This Month" },
  { id: "prev_month", label: "Previous Month" },
  { id: "last_3_months", label: "Last 3 Months" },
  { id: "last_6_months", label: "Last 6 Months" },
  { id: "custom", label: "Custom Date Range" }
];

const CHART_COLORS = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#e11d48", "#0891b2"];

export default function PropertyComparisonPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [period, setPeriod] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Quick Add Expense Modal state so owners can record property expenses directly
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    propertyId: "",
    category: "Maintenance",
    description: "",
    amount: "",
    paymentMethod: "UPI",
    expenseDate: new Date().toISOString().slice(0, 10)
  });

  const loadComparison = async (overrideIds = null) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      }
      const idsToUse = overrideIds !== null ? overrideIds : selectedPropertyIds;
      if (idsToUse.length > 0) {
        params.set("propertyIds", idsToUse.join(","));
      }
      const res = await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/property-comparison?${params.toString()}`
      );
      setData(res);
      if (selectedPropertyIds.length === 0 && Array.isArray(res?.availableProperties)) {
        setSelectedPropertyIds(res.availableProperties.map((p) => p.propertyId));
      }
    } catch (err) {
      setError(err?.body?.message || err?.message || "Failed to load property comparison data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "custom" || (startDate && endDate)) {
      loadComparison();
    }
  }, [period]);

  const togglePropertySelection = (propId) => {
    setSelectedPropertyIds((prev) => {
      const exists = prev.includes(propId);
      const next = exists ? prev.filter((id) => id !== propId) : [...prev, propId];
      return next;
    });
  };

  const applyPropertySelection = () => {
    loadComparison(selectedPropertyIds);
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !(Number(expenseForm.amount) > 0)) return;
    try {
      setSavingExpense(true);
      await apiFetch(`/api/owner-analytics/${encodeURIComponent(owner.loginId)}/expenses`, {
        method: "POST",
        body: expenseForm
      });
      setShowExpenseModal(false);
      setExpenseForm({
        propertyId: "",
        category: "Maintenance",
        description: "",
        amount: "",
        paymentMethod: "UPI",
        expenseDate: new Date().toISOString().slice(0, 10)
      });
      await loadComparison();
    } catch (err) {
      alert(err?.body?.message || err?.message || "Could not save expense");
    } finally {
      setSavingExpense(false);
    }
  };

  const properties = data?.properties || [];
  const availableProperties = data?.availableProperties || [];
  const totals = data?.totals || {};
  const bestProp = data?.bestPerformingProperty;
  const lowestProp = data?.lowestPerformingProperty;
  const trends = data?.trends || [];

  const comparisonChartData = useMemo(() => {
    return properties.map((p) => ({
      name: p.propertyName.length > 18 ? p.propertyName.slice(0, 16) + "…" : p.propertyName,
      fullName: p.propertyName,
      Revenue: p.monthlyRevenue,
      Expenses: p.monthlyExpenses,
      "Net Profit": p.netProfit,
      "Pending Rent": p.pendingRent,
      "Occupancy %": p.occupancyPercentage,
      "Occupied Beds": p.occupiedBeds,
      "Vacant Beds": p.vacantBeds
    }));
  }, [properties]);

  const exportToExcel = () => {
    if (!properties.length) return;
    const rows = properties.map((p) => ({
      "Property Name": p.propertyName,
      "City / Area": [p.area, p.city].filter(Boolean).join(", ") || "-",
      "Total Rooms": p.totalRooms,
      "Total Beds": p.totalBeds,
      "Occupied Beds": p.occupiedBeds,
      "Vacant Beds": p.vacantBeds,
      "Occupancy (%)": `${p.occupancyPercentage}%`,
      "Revenue (INR)": p.monthlyRevenue,
      "Pending Rent (INR)": p.pendingRent,
      "Expenses (INR)": p.monthlyExpenses,
      "Net Profit (INR)": p.netProfit,
      "Profit Margin (%)": `${p.profitMargin}%`
    }));

    rows.push({
      "Property Name": "PORTFOLIO TOTAL",
      "City / Area": "-",
      "Total Rooms": totals.totalRooms || 0,
      "Total Beds": totals.totalBeds || 0,
      "Occupied Beds": totals.occupiedBeds || 0,
      "Vacant Beds": totals.vacantBeds || 0,
      "Occupancy (%)": `${totals.occupancyPercentage || 0}%`,
      "Revenue (INR)": totals.monthlyRevenue || 0,
      "Pending Rent (INR)": totals.pendingRent || 0,
      "Expenses (INR)": totals.monthlyExpenses || 0,
      "Net Profit (INR)": totals.netProfit || 0,
      "Profit Margin (%)": "-"
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Property Comparison");
    XLSX.writeFile(wb, `Roomhy_Property_Comparison_${period}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPdf = () => {
    window.print();
  };

  const fmtCurrency = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Property Performance Comparison"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-12 print:p-0">
        {/* Header & Action Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4" /> Multi-Property Analytics
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Property Comparison</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Compare occupancy, actual revenue collections, pending rent, expenses, and net profit across your properties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              onClick={() => {
                setExpenseForm((f) => ({
                  ...f,
                  propertyId: availableProperties[0]?.propertyId || ""
                }));
                setShowExpenseModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4 text-teal-700" /> Record Expense
            </button>
            <button
              onClick={exportToExcel}
              disabled={!properties.length}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={exportToPdf}
              disabled={!properties.length}
              className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 disabled:opacity-50 text-teal-900 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={() => loadComparison()}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Date Filter & Multi-Property Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
                <Calendar className="w-4 h-4 text-slate-400" /> Period:
              </span>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setPeriod(preset.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    period === preset.id
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  onClick={() => loadComparison()}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold"
                >
                  Apply Dates
                </button>
              </div>
            )}
          </div>

          {/* Multi-Property Selection Chips */}
          {availableProperties.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 mr-1">
                  Select Properties ({selectedPropertyIds.length}/{availableProperties.length}):
                </span>
                {availableProperties.map((p) => {
                  const isChecked = selectedPropertyIds.includes(p.propertyId);
                  return (
                    <button
                      key={p.propertyId}
                      type="button"
                      onClick={() => togglePropertySelection(p.propertyId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                        isChecked
                          ? "bg-teal-50 border-teal-600 text-teal-900 font-semibold"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {p.propertyName}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = availableProperties.map((p) => p.propertyId);
                    setSelectedPropertyIds(allIds);
                    loadComparison(allIds);
                  }}
                  className="text-xs text-teal-700 hover:underline font-semibold"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={applyPropertySelection}
                  disabled={selectedPropertyIds.length === 0}
                  className="px-4 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 disabled:opacity-50 text-teal-900 text-xs font-semibold"
                >
                  Compare Selected ({selectedPropertyIds.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-teal-600" />
            <p className="text-sm font-medium">Calculating property-wise occupancy, revenue, and expenses…</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Properties Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add properties under your owner account to compare their financial and occupancy performance.
            </p>
          </div>
        ) : (
          <>
            {/* Portfolio Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Total Rooms / Beds</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {totals.totalRooms} <span className="text-xs font-normal text-slate-500">rooms</span> / {totals.totalBeds}{" "}
                  <span className="text-xs font-normal text-slate-500">beds</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {totals.occupiedBeds} occupied • {totals.vacantBeds} vacant
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Avg Occupancy</p>
                <p className="text-xl font-bold text-teal-700 mt-1">{totals.occupancyPercentage}%</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${Math.min(100, totals.occupancyPercentage || 0)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Total Revenue</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{fmtCurrency(totals.monthlyRevenue)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Actual collected payments</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Pending Rent</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{fmtCurrency(totals.pendingRent)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Unpaid tenant dues</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Total Expenses</p>
                <p className="text-xl font-bold text-rose-600 mt-1">{fmtCurrency(totals.monthlyExpenses)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Recorded property costs</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-slate-400">Net Profit</p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    (totals.netProfit || 0) >= 0 ? "text-slate-900" : "text-rose-600"
                  }`}
                >
                  {fmtCurrency(totals.netProfit)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Revenue minus Expenses</p>
              </div>
            </div>

            {/* Best Performing & Lowest Performing Highlight Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestProp && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                      <Award className="w-3.5 h-3.5" /> Best Performing Property
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 pt-1">{bestProp.propertyName}</h3>
                    <p className="text-xs text-slate-600">
                      Net Profit: <strong className="text-emerald-700">{fmtCurrency(bestProp.netProfit)}</strong> •{" "}
                      Occupancy: <strong>{bestProp.occupancyPercentage}%</strong> ({bestProp.occupiedBeds}/{bestProp.totalBeds} beds)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-base font-bold text-emerald-700">{fmtCurrency(bestProp.monthlyRevenue)}</p>
                  </div>
                </div>
              )}

              {lowestProp && lowestProp.propertyId !== bestProp?.propertyId && (
                <div className="bg-gradient-to-br from-amber-50 to-rose-50 border border-amber-200 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white">
                      <TrendingDown className="w-3.5 h-3.5" /> Needs Attention (Lowest Performing)
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 pt-1">{lowestProp.propertyName}</h3>
                    <p className="text-xs text-slate-600">
                      Net Profit: <strong className="text-rose-700">{fmtCurrency(lowestProp.netProfit)}</strong> •{" "}
                      Occupancy: <strong>{lowestProp.occupancyPercentage}%</strong> • Vacant Beds:{" "}
                      <strong>{lowestProp.vacantBeds}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">Pending Rent</p>
                    <p className="text-base font-bold text-amber-700">{fmtCurrency(lowestProp.pendingRent)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Property-wise KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((prop, idx) => {
                const isBest = bestProp?.propertyId === prop.propertyId && properties.length > 1;
                const isLowest = lowestProp?.propertyId === prop.propertyId && properties.length > 1;
                return (
                  <div
                    key={prop.propertyId}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                      isBest
                        ? "border-emerald-400 ring-1 ring-emerald-200"
                        : isLowest
                        ? "border-amber-300"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {prop.propertyName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {[prop.area, prop.city].filter(Boolean).join(", ") || prop.locationCode || "Active Property"}
                        </p>
                      </div>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          TOP #1
                        </span>
                      )}
                      {isLowest && !isBest && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          LOWEST
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Rooms</p>
                        <p className="text-sm font-bold text-slate-800">{prop.totalRooms}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Beds (Occ/Vac)</p>
                        <p className="text-sm font-bold text-slate-800">
                          {prop.occupiedBeds}/{prop.totalBeds}{" "}
                          <span className="text-[11px] font-normal text-slate-500">({prop.vacantBeds} free)</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Occupancy</p>
                        <p className="text-sm font-bold text-teal-700">{prop.occupancyPercentage}%</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly Revenue:</span>
                        <span className="font-bold text-emerald-700">{fmtCurrency(prop.monthlyRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pending Rent:</span>
                        <span className="font-semibold text-amber-600">{fmtCurrency(prop.pendingRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Monthly Expenses:</span>
                        <span className="font-semibold text-rose-600">{fmtCurrency(prop.monthlyExpenses)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Net Profit:</span>
                        <span
                          className={`font-bold text-sm ${
                            prop.netProfit >= 0 ? "text-slate-900" : "text-rose-600"
                          }`}
                        >
                          {fmtCurrency(prop.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Comparison Bar Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Revenue vs Expenses vs Net Profit (By Property)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Direct side-by-side financial comparison for the selected period
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => fmtCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Expenses" fill="#e11d48" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Net Profit" fill="#0f766e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Occupancy & Bed Utilization Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Occupancy Rate & Bed Availability Comparison
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Occupied beds vs vacant beds and occupancy percentage across properties
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Occupied Beds" stackId="beds" fill="#0f766e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Vacant Beds" stackId="beds" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Occupancy %" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Revenue & Occupancy Trends Over Time */}
            {trends.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Monthly Revenue & Net Profit Trend
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Month-over-month revenue performance across selected properties
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => fmtCurrency(value)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {properties.map((p, idx) => (
                        <Line
                          key={p.propertyId}
                          type="monotone"
                          dataKey={`${p.propertyName}_revenue`}
                          name={`${p.propertyName} (Rev)`}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Side-by-Side Detailed Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detailed Property Comparison Matrix</h3>
                  <p className="text-xs text-slate-500">All figures derived from live database records</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] border-b border-slate-200">
                      <th className="py-3.5 px-4 font-semibold">Property</th>
                      <th className="py-3.5 px-3 font-semibold text-right">Total Rooms</th>
                      <th className="py-3.5 px-3 font-semibold text-right">Total Beds</th>
                      <th className="py-3.5 px-3 font-semibold text-right">Occupied Beds</th>
                      <th className="py-3.5 px-3 font-semibold text-right">Vacant Beds</th>
                      <th className="py-3.5 px-3 font-semibold text-right">Occupancy %</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Monthly Revenue</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Pending Rent</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Monthly Expenses</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {properties.map((p) => (
                      <tr key={p.propertyId} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>{p.propertyName}</div>
                          <div className="text-[11px] font-normal text-slate-400">
                            {[p.area, p.city].filter(Boolean).join(", ")}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium text-slate-700">{p.totalRooms}</td>
                        <td className="py-3.5 px-3 text-right font-medium text-slate-700">{p.totalBeds}</td>
                        <td className="py-3.5 px-3 text-right font-semibold text-teal-700">{p.occupiedBeds}</td>
                        <td className="py-3.5 px-3 text-right text-slate-600">{p.vacantBeds}</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700">
                            {p.occupancyPercentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                          {fmtCurrency(p.monthlyRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                          {fmtCurrency(p.pendingRent)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                          {fmtCurrency(p.monthlyExpenses)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            p.netProfit >= 0 ? "text-slate-900" : "text-rose-600"
                          }`}
                        >
                          {fmtCurrency(p.netProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-teal-50/70 text-slate-900 font-bold text-xs border-t-2 border-teal-200">
                      <td className="py-3.5 px-4">PORTFOLIO TOTAL ({properties.length} Properties)</td>
                      <td className="py-3.5 px-3 text-right">{totals.totalRooms}</td>
                      <td className="py-3.5 px-3 text-right">{totals.totalBeds}</td>
                      <td className="py-3.5 px-3 text-right">{totals.occupiedBeds}</td>
                      <td className="py-3.5 px-3 text-right">{totals.vacantBeds}</td>
                      <td className="py-3.5 px-3 text-right">{totals.occupancyPercentage}%</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700">
                        {fmtCurrency(totals.monthlyRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-700">
                        {fmtCurrency(totals.pendingRent)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-700">
                        {fmtCurrency(totals.monthlyExpenses)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-teal-800">
                        {fmtCurrency(totals.netProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Property Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property</label>
                <select
                  value={expenseForm.propertyId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, propertyId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  required
                >
                  <option value="">Select Property</option>
                  {availableProperties.map((p) => (
                    <option key={p.propertyId} value={p.propertyId}>
                      {p.propertyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {["Maintenance", "Electricity", "Water", "Cleaning", "Internet", "Salary", "Repairs", "Other"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Plumbing & water motor servicing"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {["UPI", "Cash", "Bank Transfer", "Card"].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  {savingExpense ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
