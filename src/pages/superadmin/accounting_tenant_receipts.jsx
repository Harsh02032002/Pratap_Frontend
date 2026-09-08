import React, { useState, useEffect } from "react";
import { Search, Download, Eye, FileText, Printer, CheckCircle2, RotateCcw, Calendar, RefreshCw } from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function billingLabel(billingMonth) {
  if (!billingMonth) return "—";
  const [yr, mo] = billingMonth.split("-");
  return new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString("en", { month: "long" }) + " " + yr;
}

export default function TenantReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const res = await fetchJson("/api/superadmin/finance/tenant/receipts");
      if (res.success) {
        setReceipts(res.receipts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handlePrint = (r) => {
    const win = window.open("", "_blank", "width=860,height=960");
    win.document.write(`<html><head><title>Receipt ${r.invoiceNumber}</title></head><body><h1>Receipt Preview</h1><p>Invoice No: ${r.invoiceNumber}</p><p>Tenant: ${r.tenantName}</p><p>Rent Paid: ₹${r.paidAmount}</p></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const filtered = receipts.filter(r => 
    r.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.tenantName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tenant receipts</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tenant Rent Payment Receipts Ledger</p>
         </div>
         <button onClick={loadReceipts} className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
         </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Receipt Records</h3>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt..." className="bg-slate-50 border-none rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" />
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4">Invoice No</th>
                     <th className="pb-4">Tenant</th>
                     <th className="pb-4 text-center">Billing Period</th>
                     <th className="pb-4 text-center">Paid (₹)</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4 text-right">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">Loading receipts...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold">No Receipts Found</td></tr>
                  ) : filtered.map((r, i) => (
                    <tr key={i} className="group hover:bg-slate-50 transition-colors">
                       <td className="py-3 font-mono font-bold text-blue-600">{r.invoiceNumber}</td>
                       <td className="py-3 font-bold text-slate-800">{r.tenantName || "N/A"}</td>
                       <td className="py-3 text-center text-slate-600 font-medium">{billingLabel(r.billingMonth)}</td>
                       <td className="py-3 text-center font-bold text-slate-800">₹{r.paidAmount?.toLocaleString('en-IN') || 0}</td>
                       <td className="py-3 text-center">
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase">{r.status}</span>
                       </td>
                       <td className="py-3 text-right">
                          <button onClick={() => handlePrint(r)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm" title="Print"><Printer className="w-3.5 h-3.5" /></button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
