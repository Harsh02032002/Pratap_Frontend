import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { 
  FileText, Search, Printer, Mail, IndianRupee, 
  ArrowUpRight, ArrowDownRight, ClipboardList, Plus
} from "lucide-react";

export default function TenantLedgerPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [tenants, setTenants] = useState([]);
  const [selectedTenantLoginId, setSelectedTenantLoginId] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryDetails, setEntryDetails] = useState("");
  const [entryAmount, setEntryAmount] = useState(0);
  const [entryType, setEntryType] = useState("debit");

  // Fetch tenants
  useEffect(() => {
    let active = true;
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const list = await fetchOwnerTenants(owner.loginId);
        if (active) {
          const tenantList = list || [];
          setTenants(tenantList);
          if (tenantList.length > 0) setSelectedTenantLoginId(tenantList[0].loginId);
        }
      } catch (err) {
        console.error("Error fetching tenants for ledger:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTenants();
    return () => { active = false; };
  }, [owner.loginId]);

  // Fetch ledger entries when selected tenant changes
  const fetchLedger = async (tLoginId) => {
    if (!tLoginId) return;
    try {
      setLedgerLoading(true);
      const res = await apiFetch(`/api/tenants/ledger/${encodeURIComponent(tLoginId)}`);
      if (res?.success) {
        setLedgerEntries(res.ledger || []);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenantLoginId) {
      fetchLedger(selectedTenantLoginId);
    }
  }, [selectedTenantLoginId]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!entryDetails || entryAmount <= 0 || !selectedTenantLoginId) return;
    
    try {
      const isDebit = entryType === "debit";
      await apiFetch("/api/tenants/ledger", {
        method: "POST",
        body: JSON.stringify({
          tenantLoginId: selectedTenantLoginId,
          details: entryDetails,
          debit: isDebit ? entryAmount : 0,
          credit: !isDebit ? entryAmount : 0
        })
      });
      setEntryDetails("");
      setEntryAmount(0);
      setShowAddEntryModal(false);
      // Reload ledger
      fetchLedger(selectedTenantLoginId);
    } catch (err) {
      console.error("Error adding ledger entry:", err);
      toast.error(err.message || "Failed to post entry");
    }
  };

  const totalDebits = ledgerEntries.reduce((acc, e) => acc + (e.debit || 0), 0);
  const totalCredits = ledgerEntries.reduce((acc, e) => acc + (e.credit || 0), 0);
  const runningBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Resident Ledgers" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Resident Ledgers</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Audit running balances, debit logs, rent invoices, and credit receipts for residents.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <button 
            onClick={() => setShowAddEntryModal(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
            disabled={!selectedTenantLoginId}
          >
            <Plus className="size-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Selector and Statement Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Select Resident:</span>
          <select 
            value={selectedTenantLoginId}
            onChange={(e) => setSelectedTenantLoginId(e.target.value)}
            className="h-10 px-3 border border-border bg-card rounded-xl text-xs font-semibold focus:outline-none"
          >
            {loading ? (
              <option>Loading tenants...</option>
            ) : tenants.length === 0 ? (
              <option>No tenants found</option>
            ) : (
              tenants.map(t => (
                <option key={t.loginId} value={t.loginId}>
                  {t.name} ({t.roomNo || t.room?.number ? `Room ${t.roomNo || t.room?.number}` : "No Room"}) - {t.loginId}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card text-[12.5px] font-semibold hover:bg-muted transition-colors">
            <Printer size={15} /> Print Statement
          </button>
          <button className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-card text-[12.5px] font-semibold hover:bg-muted transition-colors">
            <Mail size={15} /> Send PDF Statement
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total Charges (Debits)</span>
          <h3 className="text-[24px] font-bold text-foreground mt-1">₹{totalDebits.toLocaleString("en-IN")}</h3>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total Payments (Credits)</span>
          <h3 className="text-[24px] font-bold text-emerald-600 mt-1">₹{totalCredits.toLocaleString("en-IN")}</h3>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft bg-rose-50/20">
          <span className="text-[12px] font-semibold text-rose-600 uppercase tracking-wider">Net Outstanding Balance</span>
          <h3 className="text-[24px] font-bold text-rose-600 mt-1">₹{runningBalance.toLocaleString("en-IN")}</h3>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                <th className="px-6 py-3.5 font-semibold">Date</th>
                <th className="px-6 py-3.5 font-semibold">Description</th>
                <th className="px-6 py-3.5 font-semibold">Charges (Debit)</th>
                <th className="px-6 py-3.5 font-semibold">Payments (Credit)</th>
                <th className="px-6 py-3.5 font-semibold text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledgerLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading ledger data...
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No ledger entries recorded for this tenant.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((e) => (
                  <tr key={e.id || e._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{e.date}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{e.details}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">
                      {e.debit > 0 ? `₹${e.debit.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {e.credit > 0 ? `₹${e.credit.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground text-right">
                      ₹{e.balance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-serif text-[22px] text-foreground mb-4">Add Ledger Entry</h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Details / Description</label>
                <input 
                  type="text" 
                  value={entryDetails} 
                  onChange={(e) => setEntryDetails(e.target.value)}
                  placeholder="e.g. WiFi Bill Surcharge"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  value={entryAmount} 
                  onChange={(e) => setEntryAmount(parseInt(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Entry Type</label>
                <select 
                  value={entryType} 
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="debit">Debit (Charge Tenant)</option>
                  <option value="credit">Credit (Record Payment)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddEntryModal(false)}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
