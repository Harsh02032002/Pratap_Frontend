import React, { useEffect, useState } from "react";
import OwnerLayout from "../../components/OwnerLayout";
import { 
  IndianRupee, 
  Users, 
  Home, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { getOwnerSession } from "../../utils/ownerSession";
import { fetchJson } from "../../utils/api";

export default function OwnerDashboard() {
  const owner = getOwnerSession();
  const [changeRequests, setChangeRequests] = useState([]);
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => {
    if (owner?.loginId) {
      loadChangeRequests(owner.loginId);
    }
  }, [owner?.loginId]);

  const loadChangeRequests = async (loginId) => {
    try {
      const data = await fetchJson(`/api/owner-change-requests?ownerLoginId=${encodeURIComponent(loginId)}`);
      setChangeRequests(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error('Failed to load change requests:', err);
    }
  };

  const getRelativeTime = (date) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <OwnerLayout 
      title="Dashboard" 
      subtitle="Welcome! Here's how your hostels are performing today."
    >
      <div className="space-y-10">
        {/* Refined Financial Hero Section - Lighter & Even More Compact */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
           <div className="xl:col-span-2 relative overflow-hidden rounded-[2rem] bg-indigo-50/30 border border-indigo-100 p-6 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1.5 bg-indigo-600 rounded text-white shadow-sm">
                          <Sparkles size={14} />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic">Portfolio Pulse</span>
                    </div>
                    <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Monthly Revenue</h2>
                     <div className="flex items-baseline gap-3 mb-4">
                        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900">₹12.8L</h1>
                       <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 text-[10px] font-black italic shadow-sm">
                          <ArrowUpRight size={14} /> +14.5%
                       </div>
                    </div>
                    <div className="flex gap-6">
                       <HeroMetricSmall label="Properties" value="12" />
                       <HeroMetricSmall label="Occupancy" value="94%" />
                       <HeroMetricSmall label="Growth" value="+2.1L" />
                    </div>
                 </div>
                 <div className="w-full md:w-40 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white flex flex-col justify-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 text-center italic">Net Profit</p>
                    <p className="text-xl font-black text-slate-900 text-center tracking-tighter italic">₹8.4L</p>
                    <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 w-[65%]" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-[2rem] p-6 border border-indigo-100 flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                 <div className="flex justify-between items-start">
                    <h3 className="text-base font-black text-slate-900 italic">Elite Growth</h3>
                    <TrendingUp size={16} className="text-indigo-600" />
                 </div>
                 <p className="text-slate-500 text-[9px] font-bold mt-1 leading-tight uppercase tracking-widest italic opacity-70">Value up by ₹12.4L</p>
              </div>
              <div className="mt-4 space-y-3 relative z-10">
                 <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 italic">
                    <span>Yearly Target</span>
                    <span className="text-indigo-600 italic">₹1.5Cr</span>
                 </div>
                 <div className="h-1 w-full bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full w-[84%]" />
                 </div>
                 <button className="w-full py-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 font-black text-[8px] uppercase tracking-widest rounded-xl transition-all border border-indigo-100 shadow-sm flex items-center justify-center gap-1.5 italic">
                    Reports <ArrowRight size={12} />
                 </button>
              </div>
           </div>
        </div>

        {/* Smaller Metric Cards - Modern Light Shade */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricSmall label="Total Revenue" value="₹12.8L" change="+14%" icon={IndianRupee} color="indigo" />
          <MetricSmall label="Residents" value="482" change="+3%" icon={Users} color="emerald" />
          <MetricSmall label="Occupancy" value="94%" change="+2%" icon={Home} color="blue" />
          <MetricSmall label="Pending" value="₹1.2L" change="-5%" icon={Activity} color="rose" />
        </div>

        {/* Analytics & Mini-Portfolio */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-900 italic">Revenue Analytics</h3>
              <div className="flex gap-2 bg-slate-50 p-1 rounded-lg">
                 <button className="px-3 py-1.5 bg-white shadow-sm rounded text-[8px] font-black uppercase tracking-widest text-slate-900">Revenue</button>
                 <button className="px-3 py-1.5 text-slate-400 text-[8px] font-black uppercase tracking-widest">Expenses</button>
              </div>
            </div>
            <div className="h-32 flex items-end gap-2 px-2">
              {[35, 50, 45, 85, 60, 100, 75, 90, 55, 110, 80, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-50 hover:bg-indigo-600 rounded-t-md transition-all duration-500 cursor-pointer" style={{ height: `${h*0.7}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
               <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
            </div>
          </div>

          {/* Elite Portfolio Card - Lighter Version */}
          <div className="bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm relative overflow-hidden group">
            <h3 className="text-base font-black mb-6 italic text-slate-900">Elite Portfolio</h3>
            <div className="space-y-4">
              <MiniProperty name="Roomhy Residency" value="98%" />
              <MiniProperty name="Blue Heights" value="92%" />
              <MiniProperty name="The Urban Stay" value="88%" />
              <MiniProperty name="Green Villa" value="85%" />
            </div>
            <button className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-black text-[8px] uppercase tracking-widest shadow-md shadow-indigo-100 hover:scale-[1.02] transition-all italic">
               Full Portfolio Report
            </button>
          </div>
        </div>

        {/* Admin Update Requests Section */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 italic">Admin Update Requests</h3>
            <button 
              onClick={() => window.location.href = '/propertyowner/update-requests'}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All
            </button>
          </div>
          {changeRequests.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No update requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequests.slice(0, 5).map(req => {
                const status = req.status || "Pending";
                const isApproved = status === "Approved";
                const isRejected = status === "Rejected";
                const badgeClass = isApproved
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : isRejected
                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100";
                const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock;
                return (
                  <div key={req._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${req.requestType === 'bank_details' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{(req.requestType || "profile").replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500">{getRelativeTime(req.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                        <Icon size={11} /> {status}
                      </span>
                      <button 
                        onClick={() => setViewModal(req)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Change Request Detail Modal */}
      {viewModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setViewModal(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Requested Changes</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {new Date(viewModal.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                viewModal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                viewModal.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {viewModal.status}
              </span>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[28%]">Field</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[36%]">Previous</th>
                      <th className="px-4 py-2.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">You Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(viewModal.requestedChanges || {})
                      .filter(([key]) => key !== 'checkinBankProofName')
                      .map(([key, newValue]) => {
                      const oldValue = viewModal.previousValues ? viewModal.previousValues[key] : (viewModal.currentValues ? viewModal.currentValues[key] : undefined);
                      const hasOldValue = oldValue !== undefined && oldValue !== null && oldValue !== "";
                      const isDoc = key === 'checkinBankProof';
                      return (
                        <tr key={key}>
                          <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase align-top">{isDoc ? "Bank Proof" : key}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 align-top break-words">
                            {isDoc
                              ? (hasOldValue ? <a href={oldValue} target="_blank" rel="noreferrer" className="text-indigo-600 underline">View previous</a> : <span className="italic text-slate-300">not set</span>)
                              : (hasOldValue ? String(oldValue) : <span className="italic text-slate-300">not set</span>)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-emerald-700 bg-emerald-50/40 align-top break-words">
                            {String(newValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {viewModal.status === "Rejected" && viewModal.rejectionReason && (
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Rejection reason</span>
                  <p className="text-sm text-rose-700 mt-1">{viewModal.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="py-2 px-4 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}

function HeroMetricSmall({ label, value }) {
   return (
      <div className="flex flex-col">
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-0.5">{label}</span>
         <span className="text-xl font-black text-slate-900 italic tracking-tighter">{value}</span>
      </div>
   );
}

function MetricSmall({ label, value, change, icon: Icon, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="flex items-center gap-4">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]} shrink-0 transition-transform group-hover:scale-110 shadow-sm`}>
            <Icon size={18} />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate italic mb-0.5">{label}</p>
            <div className="flex items-baseline justify-between">
               <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">{value}</h3>
               <span className="text-[10px] font-black text-emerald-500 italic">{change}</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function MiniProperty({ name, value }) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
               <Home size={14} />
            </div>
            <span className="text-xs font-bold text-slate-700">{name}</span>
         </div>
         <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{value}</span>
      </div>
   );
}
