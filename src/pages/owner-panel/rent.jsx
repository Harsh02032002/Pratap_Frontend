import React, { useEffect, useState } from "react";
import OwnerLayout from "../../components/OwnerLayout";
import { IndianRupee, Search, Filter, ArrowUpRight, Download, CheckCircle2, AlertCircle, CreditCard, PieChart, Sparkles } from "lucide-react";
import { getApiBase, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerRent() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentCollections = async () => {
      try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/api/rents/owner/me`, {
          headers: getAuthHeader()
        });
        const data = await response.json();
        if (data?.success && data?.invoices) {
          const formatted = data.invoices.map(inv => ({
            tenant: inv.tenantName || "Unknown",
            room: inv.roomNo || "-",
            amount: `₹${Number(inv.totalDue || inv.rentAmount || 0).toLocaleString("en-IN")}`,
            date: inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            status: inv.paymentStatus === "paid" ? "Collected" : "Overdue",
            method: inv.paymentMethod === "razorpay" ? "UPI" : inv.paymentMethod === "cash" ? "Cash" : inv.paymentMethod === "already_paid" ? "Already Paid" : inv.paymentMethod || "-",
            id: inv._id ? `#REC-${String(inv._id).slice(-6).toUpperCase()}` : "#REC-000",
            _id: inv._id,
            receiptAvailable: inv.paymentStatus === "paid"
          }));
          setCollections(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch rent collections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRentCollections();
  }, []);

  return (
    <OwnerLayout 
      title="Rent Collections"
      subtitle="Track monthly rent payments and pending dues."
    >
      <div className="space-y-12">
        {/* Collection Intelligence Cards */}
        {/* Collection Intelligence Cards - Smaller */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           <CollectionMetric label="Collected" value="₹8.4L" color="emerald" icon={CheckCircle2} />
           <CollectionMetric label="Pending" value="₹1.2L" color="rose" icon={AlertCircle} />
           <CollectionMetric label="Advance" value="₹45k" color="indigo" icon={CreditCard} />
           <CollectionMetric label="Effort" value="92%" color="blue" icon={Sparkles} />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
           <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[2rem] border border-slate-100 w-full md:w-[500px] shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
              <Search size={20} className="text-slate-400" />
              <input type="text" placeholder="Search collections..." className="bg-transparent border-none outline-none text-sm font-bold w-full text-slate-900" />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-slate-100 shadow-sm">
                <Download size={16} /> Export Data
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95">
                Bulk Reminders
              </button>
           </div>
        </div>

        {/* Collection Ledger - Premium High-End Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading rent collections...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100/50">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic border-r border-slate-100/50">Transaction / Resident</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center italic border-r border-slate-100/50">Room Unit</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center italic border-r border-slate-100/50">Value</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center italic border-r border-slate-100/50">Instrument</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right italic">Current Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center italic">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {collections.map((c, i) => (
                    <tr key={i} className="group hover:bg-slate-50/80 transition-all duration-300 cursor-pointer">
                      <td className="px-8 py-7 border-r border-slate-50/50">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 italic shadow-sm">
                                {c.tenant.split(' ').map(n => n[0]).join('')}
                             </div>
                             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-sm">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                             </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 italic tracking-tight text-base leading-none mb-1.5 group-hover:text-indigo-600 transition-colors">{c.tenant}</span>
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{c.id}</span>
                               <span className="w-1 h-1 bg-slate-200 rounded-full" />
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{c.date}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center border-r border-slate-50/50">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-black text-slate-700 italic tracking-tighter">
                           <IndianRupee size={10} className="text-indigo-500" /> {c.room}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center border-r border-slate-50/50">
                        <span className="font-black text-slate-900 italic tracking-tighter text-xl">{c.amount}</span>
                      </td>
                      <td className="px-8 py-7 text-center border-r border-slate-50/50">
                        <div className="flex flex-col items-center gap-1">
                           <span className="px-3 py-1.5 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm italic flex items-center gap-1.5">
                              <CreditCard size={12} className="text-indigo-400" /> {c.method}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                           <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all duration-500 ${
                             c.status === 'Collected' 
                               ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600' 
                               : 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600'
                           }`}>
                             <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${c.status === 'Collected' ? 'bg-emerald-500 group-hover:bg-white' : 'bg-rose-500 group-hover:bg-white'}`} />
                             {c.status}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                        {c.receiptAvailable ? (
                          <button
                            onClick={() => window.open(`${getApiBase()}/api/rents/receipt/${c._id}`, '_blank')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 transition-all"
                          >
                            <Download size={12} /> View
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {collections.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-8 py-12 text-center text-slate-500">
                        No rent collections found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}

function CollectionMetric({ label, value, color, icon: Icon }) {
  const colors = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100'
  };
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
         <Icon size={16} />
      </div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">{label}</p>
      <h3 className={`text-xl font-black tracking-tighter italic ${colors[color].split(' ')[0]}`}>{value}</h3>
    </div>
  );
}
