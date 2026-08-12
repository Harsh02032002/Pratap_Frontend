import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchPayments } from "../../utils/rentCollectionApi";
import { CheckCircle, Search, IndianRupee, TrendingUp, Calendar } from "lucide-react";

const fmt = (n) => "₹" + (n || 0).toLocaleString("en-IN");

const getTenantName  = (r) => r.tenantName  || r.tenant?.name  || r.name  || "—";
const getRoomNo      = (r) => r.roomNo       || r.room?.roomNo  || r.room  || r.roomNumber || "—";
const getAmount      = (r) => r.paidAmount   || r.amount        || r.rentAmount || r.rent || 0;
const getMethod      = (r) => r.paymentMethod || r.method       || r.paymentMode || "—";
const getTxnRef      = (r) => r.transactionId || r.referenceId  || r.razorpayPaymentId || (r._id ? r._id.slice(-8).toUpperCase() : "—");
const getPaidAt      = (r) => r.paidAt        || r.paidDate     || r.paymentDate || r.updatedAt || r.createdAt;

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const monthLabel = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function PaymentReceivedPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    fetchPayments(owner.loginId, 300, getActiveOwnerPropertyId())
      .then(data => setPayments(data?.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Build unique month options from data
  const monthOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    payments.forEach(r => {
      const lbl = monthLabel(getPaidAt(r));
      if (lbl && !seen.has(lbl)) { seen.add(lbl); opts.push(lbl); }
    });
    return opts.sort((a, b) => new Date(b) - new Date(a));
  }, [payments]);

  const filtered = useMemo(() => {
    let list = payments;
    if (monthFilter !== "all") {
      list = list.filter(r => monthLabel(getPaidAt(r)) === monthFilter);
    }
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        getTenantName(r).toLowerCase().includes(q) ||
        String(getRoomNo(r)).toLowerCase().includes(q) ||
        getTxnRef(r).toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, debouncedSearch, monthFilter]);

  const totalAmount   = filtered.reduce((s, r) => s + getAmount(r), 0);
  const thisMonthAmt  = useMemo(() => {
    const now = new Date();
    return payments
      .filter(r => {
        const d = new Date(getPaidAt(r));
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, r) => s + getAmount(r), 0);
  }, [payments]);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Payment Log"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Received Payments</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Historical ledger of all confirmed tenant payments and deposit confirmations.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2 flex-wrap shrink-0">
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 font-semibold">
              {payments.length} Payments Received
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1 font-semibold">
              This month: {fmt(thisMonthAmt)}
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground font-medium">Total Collected</span>
              <IndianRupee className="size-4 text-muted-foreground" />
            </div>
            <div className="font-serif text-[26px] leading-none text-foreground">{fmt(payments.reduce((s, r) => s + getAmount(r), 0))}</div>
          </div>
          <div className="rounded-2xl border border-border bg-emerald-50 p-4 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-emerald-700 font-medium">This Month</span>
              <Calendar className="size-4 text-emerald-600" />
            </div>
            <div className="font-serif text-[26px] leading-none text-emerald-700">{fmt(thisMonthAmt)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground font-medium">Filtered Total</span>
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
            <div className="font-serif text-[26px] leading-none text-foreground">{fmt(totalAmount)}</div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant, room, or transaction reference..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        {monthOptions.length > 0 && (
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Months</option>
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Txn Reference</th>
                <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                <th className="px-6 py-3.5 font-semibold">Room</th>
                <th className="px-6 py-3.5 font-semibold">Received Date</th>
                <th className="px-6 py-3.5 font-semibold">Payment Channel</th>
                <th className="px-6 py-3.5 font-semibold">Net Paid</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">Loading payments...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <CheckCircle className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No payment records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => (
                  <tr key={r._id || idx} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-foreground">{getTxnRef(r)}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{getTenantName(r)}</td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {getRoomNo(r) !== "—" ? `Room ${getRoomNo(r)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(getPaidAt(r))}</td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">{getMethod(r)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{fmt(getAmount(r))}</td>
                    <td className="px-6 py-4">
                      {r.status === "pending_payout" ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          Pending Payout
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Received
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 flex justify-between items-center">
            <span className="text-[12px] text-muted-foreground">{filtered.length} transactions</span>
            <span className="text-[12px] font-semibold text-foreground">Total: {fmt(totalAmount)}</span>
          </div>
        )}
      </div>
    </PropertyOwnerLayout>
  );
}
