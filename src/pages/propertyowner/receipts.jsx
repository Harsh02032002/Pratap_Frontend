import React, { useEffect, useState, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, getActiveOwnerPropertyId } from "../../utils/propertyowner";
import { fetchPayments } from "../../utils/rentCollectionApi";
import { Search, Download, Eye, Calendar, ChevronDown } from "lucide-react";
import { RentReceiptModal, buildReceiptHtml } from "../../components/propertyowner/RentReceiptModal";

function billingLabel(billingMonth) {
  if (!billingMonth) return "—";
  const [yr, mo] = billingMonth.split("-");
  if (!yr || !mo) return billingMonth;
  return new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("en", { month: "long" }) + " " + yr;
}

export default function ReceiptsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);

  useEffect(() => {
    // Receipts must reflect what was actually just paid — a stale 60s cache surviving
    // across SPA navigations (no full reload) was hiding brand-new payments here.
    fetchPayments(owner.loginId, 300, getActiveOwnerPropertyId(), true)
      .then(d => setPayments(d?.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const receipts = useMemo(() => payments.map(p => ({
    id: p.invoiceNumber || p.transactionId || String(p._id).slice(-8).toUpperCase(),
    tenant: p.tenantName,
    room: p.roomNo,
    phone: p.tenantPhone,
    email: p.tenantEmail,
    date: new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    period: billingLabel(p.billingMonth),
    billingMonth: p.billingMonth,
    amount: p.rentAmount || p.amount,
    penalty: p.totalPenalty || 0,
    advanceChargeAmount: Number(p.advanceChargeAmount || p.advanceCharge || p.moveInCharges || p.invoiceId?.advanceChargeAmount || 0),
    electricity: p.electricityBill || 0,
    totalDue: (p.rentAmount || 0) + (p.totalPenalty || 0) + (p.electricityBill || 0) + Number(p.advanceChargeAmount || p.advanceCharge || p.invoiceId?.advanceChargeAmount || 0),
    // Prefer the invoice's cumulative paid-to-date over this single transaction's
    // amount — otherwise a receipt for a later top-up payment (e.g. electricity paid
    // after rent was already settled) shows a "balance remaining" that ignores the
    // earlier payment entirely.
    paid: p.paidAmount ?? p.amount,
    txnAmount: p.amount,
    paymentMethod: p.paymentMethod || p.invoiceId?.paymentMethod || '',
    invoiceStatus: p.invoiceStatus || '',   // PAID / PARTIAL / PENDING — from DB
    // A tenant's agreement can list an advance/move-in charge that's still outstanding —
    // that alone doesn't mean THIS payment included it. Only call it "Rent & Move-in" (or
    // Utility/Penalty) when the amount actually paid is more than plain rent, so a receipt
    // never claims to cover money that was never actually collected.
    type: ((p.advanceChargeAmount || p.advanceCharge) > 0 && (p.amount || 0) > (p.rentAmount || 0)) ? "Rent & Move-in"
      : (p.electricityBill > 0 && (p.amount || 0) > (p.rentAmount || 0)) ? "Rent & Utility"
      : (p.totalPenalty > 0 && (p.amount || 0) > (p.rentAmount || 0)) ? "Rent + Penalty"
      : "Rent Only",
    _raw: p,
  })), [payments]);

  // Distinct months that actually have receipts, most recent first — drives the
  // month picker instead of a hardcoded list.
  const availableMonths = useMemo(
    () => [...new Set(payments.map(p => p.billingMonth).filter(Boolean))].sort().reverse(),
    [payments]
  );

  const monthOptions = useMemo(() => {
    const rest = availableMonths.filter(m => m !== currentMonth);
    return [
      { value: currentMonth, label: `Current Month (${billingLabel(currentMonth)})` },
      ...rest.map(m => ({ value: m, label: billingLabel(m) })),
    ];
  }, [availableMonths, currentMonth]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return receipts.filter(r => {
      if (r.billingMonth !== monthFilter) return false;
      if (!q) return true;
      return (
        r.tenant.toLowerCase().includes(q) ||
        String(r.room).toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [receipts, debouncedSearch, monthFilter]);

  const handleDownload = (r) => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(buildReceiptHtml(r));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Issued Receipts"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Issued Receipts</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Search and download generated receipts for every recorded payment.</p>
        </div>
        {!loading && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 font-semibold self-start md:mt-2">
            {filtered.length} receipt{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt ID, tenant, or room..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMonthMenuOpen(o => !o)}
            className="h-10 pl-3.5 pr-3 rounded-xl bg-card border border-border text-[13px] inline-flex items-center gap-2 text-foreground hover:bg-muted/40 transition-colors"
          >
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-semibold whitespace-nowrap">{billingLabel(monthFilter)}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {monthMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMonthMenuOpen(false)} />
              <div className="absolute right-0 sm:left-0 top-full mt-2 w-64 rounded-xl border border-border bg-card shadow-soft z-20 overflow-hidden">
                {monthOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setMonthFilter(opt.value); setMonthMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-muted/50 transition-colors ${
                      opt.value === monthFilter ? "font-semibold text-foreground bg-muted/30" : "text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Receipt ID</th>
                <th className="px-6 py-3.5 font-semibold">Tenant Name</th>
                <th className="px-6 py-3.5 font-semibold">Room</th>
                <th className="px-6 py-3.5 font-semibold">Billing Period</th>
                <th className="px-6 py-3.5 font-semibold">Type</th>
                <th className="px-6 py-3.5 font-semibold">Amount Paid</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Loading receipts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">No receipts found.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r._raw._id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-foreground">{r.id}</td>
                  <td className="px-6 py-4 font-semibold text-foreground">{r.tenant}</td>
                  <td className="px-6 py-4 font-bold text-foreground">Room {r.room}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.period}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.type}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">₹{(r.txnAmount || r.amount).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setViewing(r)}
                      title="View receipt"
                      className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDownload(r)}
                      title="Print / Save PDF"
                      className="size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
                    >
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <RentReceiptModal
          receipt={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </PropertyOwnerLayout>
  );
}
