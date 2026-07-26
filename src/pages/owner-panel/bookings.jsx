import React from "react";
import OwnerLayout from "../../components/OwnerLayout";
import { Calendar, User, Home, Clock, Check, X, MoreHorizontal, ArrowRight, Sparkles, MapPin, Trash2 } from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerBookings() {
  const requests = [
    { name: "Vikram Singh", roomType: "Single Elite", property: "Roomhy Residency", moveIn: "01 June, 2026", status: "Pending Approval", budget: "₹12,000" },
    { name: "Sneha Reddy", roomType: "Double Classic", property: "Blue Heights", moveIn: "25 May, 2026", status: "Documents Pending", budget: "₹8,500" },
    { name: "Karan Johar", roomType: "Triple Budget", property: "Roomhy Residency", moveIn: "10 June, 2026", status: "Pending Approval", budget: "₹6,500" },
  ];

  return (
    <OwnerLayout 
      title="Booking Requests"
      subtitle="View and manage new room booking applications."
    >
      <div className="space-y-12">

        {/* Requests Cards - Compact & Premium */}
        <div className="space-y-4">
          {requests.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col xl:flex-row xl:items-center justify-between gap-6 group">
              <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 p-0.5 border-4 border-white shadow-lg flex items-center justify-center text-white font-black text-xl group-hover:rotate-3 transition-transform italic">
                    {item.name[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-md border border-slate-50">
                    <User size={12} className="text-indigo-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      item.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>{item.status}</span>
                    <span className="text-xs font-black text-slate-900 italic tracking-tighter">Budget: {item.budget}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 truncate italic tracking-tighter mb-3">{item.name}</h4>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      <Home size={14} className="text-indigo-500" /> {item.property}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      <Calendar size={14} className="text-indigo-500" /> Move-in: {item.moveIn}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                      <MapPin size={14} className="text-indigo-500" /> {item.roomType}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-100 active:scale-95">
                  <Check size={16} /> Approve
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95">
                  <X size={16} /> Decline
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95">
                  <Trash2 size={16} /> Delete
                </button>
                <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all text-slate-400 hover:text-slate-900">
                   <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline Analytics Widget - Light Theme */}
        <div className="bg-indigo-50/50 rounded-[2.5rem] p-10 border border-indigo-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-150 rotate-12 transition-transform duration-1000 group-hover:scale-125 pointer-events-none">
              <Calendar size={200} />
           </div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Conversion Rate</p>
                 <h4 className="text-4xl font-black italic tracking-tighter mb-2 text-slate-900">78%</h4>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic uppercase tracking-widest">Faster than 85% of other owners.</p>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Projected Revenue</p>
                 <h4 className="text-4xl font-black italic tracking-tighter mb-2 text-slate-900">₹2.4L</h4>
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic uppercase tracking-widest">Estimated revenue from current pipeline.</p>
              </div>
              <div className="flex flex-col justify-center">
                 <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 italic">
                    Full Analytics <ArrowRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
