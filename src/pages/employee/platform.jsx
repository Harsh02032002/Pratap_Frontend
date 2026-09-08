import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { fetchJson } from "../../utils/api";

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
  useHtmlPage({
    title: "Roomhy - Platform Commissions",
    bodyClass: "text-slate-800",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "stylesheet", href: "/superadmin/assets/css/platform.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCommission = async () => {
    try {
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
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err?.message || "Failed to load commission data");
    }
  };

  useEffect(() => {
    loadCommission();
  }, []);

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, [rows]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.commission + r.serviceFee;
        acc.pending += r.status === "paid" ? 0 : r.toBePaid;
        return acc;
      },
      { revenue: 0, pending: 0 }
    );
  }, [rows]);

  return (
    <div className="html-page">
      <div className="flex h-screen overflow-hidden">
        <aside className="sidebar w-72 flex-shrink-0 hidden md:flex flex-col z-20 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center px-6 border-b border-gray-800 sticky top-0 bg-[#111827] z-10">
            <div className="flex items-center gap-3">
              <div>
                <img src="/website/images/whitelogo.jpeg" alt="Roomhy Logo" className="h-16 w-auto" />
                <span className="text-[10px] text-gray-500">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <nav id="dynamicSidebarNav" className="flex-1 py-6 space-y-1"></nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
          <header className="bg-white h-16 flex items-center justify-between px-6 shadow-sm z-10">
            <h2 className="text-lg font-semibold text-slate-800">Platform Commissions</h2>
            <button onClick={loadCommission} className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <i data-lucide="refresh-cw" className="w-3 h-3"></i> Refresh
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-2xl font-bold">₹{totals.revenue.toLocaleString("en-IN")}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="text-sm text-gray-500">Pending Payout</div>
                <div className="text-2xl font-bold">₹{totals.pending.toLocaleString("en-IN")}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3">Rent</th>
                      <th className="px-4 py-3">Commission</th>
                      <th className="px-4 py-3">Service Fee</th>
                      <th className="px-4 py-3">To Be Paid</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading && (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">Loading...</td></tr>
                    )}
                    {!loading && errorMsg && (
                      <tr><td colSpan={8} className="py-8 text-center text-red-500">{errorMsg}</td></tr>
                    )}
                    {!loading && !errorMsg && rows.length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">No commission data available.</td></tr>
                    )}
                    {rows.map((row, idx) => (
                      <tr key={`${row.ownerId}-${idx}`}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{row.ownerName}</div>
                          <div className="text-xs text-gray-500">{row.ownerId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.propertyName}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-800">{row.tenantName}</div>
                          <div className="text-xs text-gray-500">{row.tenantId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{row.rent.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm text-purple-700 font-semibold">₹{row.commission.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm text-blue-700 font-semibold">₹{row.serviceFee.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm text-green-700 font-bold">₹{row.toBePaid.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-sm">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}




