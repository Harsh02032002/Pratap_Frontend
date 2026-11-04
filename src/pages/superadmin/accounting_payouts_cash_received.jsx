import React, { useState, useEffect } from "react";
import {
  RefreshCw, Search, CheckCircle2, User, Home
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const cn = (...c) => c.filter(Boolean).join(" ");
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function PayoutsCashReceived() {
  const [cashList, setCashList] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);

  useSEO({ title: "Cash Received Details – Roomhy Admin", description: "Reconciliation of offline cash rent payments by tenants" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/payouts/cash-received");
      if (res.success) setCashList(res.cashReceived || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = cashList.filter(c =>
    (c.tenantName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.propertyName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.tenantPhone || "").includes(search)
  );

  const totalCash = cashList.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const totalCount = cashList.length;
  const avgAmt = totalCount ? Math.round(totalCash / totalCount) : 0;

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Cash Received Details</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Offline cash rent payments collected directly from tenants — reconciliation ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] text-[13px] font-semibold px-4 py-1.5 rounded-[8px] transition-all shadow-xs cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#0E7C86]", loading && "animate-spin")} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Cash Entries", val: totalCount, fmt: v => v },
          { label: "Total Cash Received", val: totalCash, fmt: fmt },
          { label: "Average per Entry",  val: avgAmt,     fmt: fmt },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{card.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">
                {loading ? "..." : card.fmt(card.val)}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Outside Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tenant / property..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
        <span className="text-[12px] font-medium text-[#4A5961]">
          {loading ? "Loading..." : `${filtered.length} entries found`}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Table */}
        <div className="xl:col-span-2 bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Tenant</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Month</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Cash</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Date</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-center">Status</th>
                  <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-[13px] text-[#4A5961]">Loading records...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <p className="text-[13px] font-semibold text-[#10242A]">No cash entries found</p>
                      <p className="text-[12px] text-[#4A5961] mt-0.5">Cash collections will appear here</p>
                    </td>
                  </tr>
                ) : filtered.map((c, i) => (
                  <tr key={i} className="hover:bg-[#F9FAFB] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="py-2.5">
                      <p className="font-medium text-[#10242A]">{c.tenantName || "N/A"}</p>
                      <p className="text-[11px] text-[#708088]">{c.tenantPhone || ""}</p>
                    </td>
                    <td className="py-2.5">
                      <p className="text-[#4A5961]">{c.propertyName || "N/A"}</p>
                      <p className="text-[11px] text-[#708088]">{c.roomNumber ? `Room ${c.roomNumber}` : ""}</p>
                    </td>
                    <td className="py-2.5 text-center text-[#4A5961]">{c.collectionMonth || "N/A"}</td>
                    <td className="py-2.5 text-center font-semibold text-[#10242A]">{fmt(c.paidAmount)}</td>
                    <td className="py-2.5 text-center text-[#4A5961]">
                      {c.paymentDate ? new Date(c.paymentDate).toLocaleDateString("en-IN") : "N/A"}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DDF3E4] text-[#14532D]">
                        <CheckCircle2 size={11} /> {c.paymentStatus || "Received"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button className="text-[12px] font-semibold text-[#0E7C86] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="xl:col-span-1">
          {selected ? (
            <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-4 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#10242A]">Cash Entry Detail</h4>
                <button onClick={() => setSelected(null)} className="text-[#4A5961] hover:text-[#10242A] transition-colors">×</button>
              </div>

              {/* Tenant Info */}
              <div className="bg-[#F9FAFB] rounded-[8px] p-3 space-y-2 border border-[#E1E6EA]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#E1ECF4] flex items-center justify-center">
                    <User size={14} className="text-[#1E3A5F]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#10242A]">{selected.tenantName || "N/A"}</p>
                    <p className="text-[11px] text-[#708088]">Tenant</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-[12px]">
                  {[
                    { label: "Phone", val: selected.tenantPhone || "N/A" },
                    { label: "Email", val: selected.tenantEmail || "N/A" },
                    { label: "Move-In", val: selected.moveInDate ? new Date(selected.moveInDate).toLocaleDateString("en-IN") : "N/A" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-[#4A5961]">{r.label}</span>
                      <span className="font-semibold text-[#10242A]">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Info */}
              <div className="bg-[#F9FAFB] rounded-[8px] p-3 space-y-2 border border-[#E1E6EA]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#DDF3E4] flex items-center justify-center">
                    <Home size={14} className="text-[#14532D]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#10242A]">{selected.propertyName || "N/A"}</p>
                    <p className="text-[11px] text-[#708088]">Property</p>
                  </div>
                </div>
                {selected.roomNumber && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#4A5961]">Room</span>
                    <span className="font-semibold text-[#10242A]">{selected.roomNumber}</span>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-[#DDF3E4]/40 rounded-[8px] p-3 border border-[#DDF3E4]">
                <p className="text-[11px] font-semibold text-[#14532D] uppercase tracking-wider mb-2">Payment Summary</p>
                <div className="space-y-1.5 text-[12px]">
                  {[
                    { label: "Month", val: selected.collectionMonth || "N/A" },
                    { label: "Amount Paid", val: fmt(selected.paidAmount) },
                    { label: "Date Received", val: selected.paymentDate ? new Date(selected.paymentDate).toLocaleDateString("en-IN") : "N/A" },
                    { label: "Method", val: "Cash" },
                    { label: "Status", val: selected.paymentStatus || "Received" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-[#14532D]">{r.label}</span>
                      <span className="font-bold text-[#10242A]">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[12px] border border-[#E1E6EA] shadow-xs p-6 text-center h-48 flex flex-col items-center justify-center">
              <p className="text-[13px] font-medium text-[#4A5961]">Click a row to see tenant details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
