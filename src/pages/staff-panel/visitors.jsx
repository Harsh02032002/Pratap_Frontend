import React, { useState } from "react";
import StaffLayout from "../../components/StaffLayout";
import { UserPlus, Search, ChevronRight, LogOut, CheckCircle2, X } from "lucide-react";
import { useOwnerVisitors, useCreateVisitor, useUpdateVisitorStatus } from "../../hooks/useVisitors";

function getStaffSession() {
  try {
    const raw = sessionStorage.getItem("staff_session") || localStorage.getItem("staff_session");
    if (raw) return JSON.parse(raw);
    const empRaw = sessionStorage.getItem("employee_session") || localStorage.getItem("employee_session");
    if (empRaw) return JSON.parse(empRaw);
  } catch (_) {}
  return null;
}

export default function StaffVisitors() {
  const staff = getStaffSession();
  const parentLoginId = staff?.parentLoginId || "";
  const activePropertyId = (() => {
    try {
      const raw = localStorage.getItem("owner_active_property");
      return raw && raw !== "all" ? raw : "";
    } catch {
      return "";
    }
  })();

  // ── Server state: React Query ──
  const { data: visitors = [], isLoading: loading } = useOwnerVisitors(parentLoginId);
  const createVisitorMut = useCreateVisitor(parentLoginId);
  const updateVisitorMut = useUpdateVisitorStatus(parentLoginId);
  const submitting = createVisitorMut.isPending;

  // ── UI-only local state ──
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vHost, setVHost] = useState("");
  const [vRoom, setVRoom] = useState("");
  const [vPurpose, setVPurpose] = useState("Social");

  const handleAddVisitor = (e) => {
    e.preventDefault();
    if (!parentLoginId || !vName || !vPhone || !vHost || !vRoom) return;
    const activePropertyId = (() => {
      try {
        const raw = localStorage.getItem("owner_active_property");
        return raw && raw !== "all" ? raw : "";
      } catch {
        return "";
      }
    })();
    createVisitorMut.mutate(
      {
        ownerLoginId: parentLoginId,
        propertyId: activePropertyId,
        name: vName,
        phone: vPhone,
        hostName: vHost,
        hostRoom: vRoom,
        purpose: vPurpose,
        status: 'Inside',
      },
      {
        onSuccess: (data) => {
          if (data?.success) {
            setShowAddModal(false);
            setVName(""); setVPhone(""); setVHost(""); setVRoom("");
          } else {
            alert("Failed to add visitor");
          }
        },
        onError: () => alert("Error adding visitor"),
      }
    );
  };

  const handleCheckout = (id) => {
    if (!window.confirm("Check out this visitor?")) return;
    updateVisitorMut.mutate({ id, status: 'Exited' }, { onError: () => alert("Error checking out visitor") });
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesProperty = !activePropertyId || String(v.propertyId || v.property_id || "") === String(activePropertyId);
    const q = search.toLowerCase();
    const matchesSearch =
      v.name?.toLowerCase().includes(q) ||
      v.hostName?.toLowerCase().includes(q) ||
      v.hostRoom?.toLowerCase().includes(q);
    return matchesProperty && matchesSearch;
  });

  return (
    <StaffLayout title="Visitors Log">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 w-full md:w-96 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search visitors, host, room..." 
            className="bg-transparent border-none outline-none text-sm w-full" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <UserPlus size={20} />
          New Entry
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Visitor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Host & Room</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-400">Loading visitors...</td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-400">No visitors found.</td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900">{v.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.purpose} • {v.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-700">{v.hostName}</span>
                        <span className="text-xs text-slate-500">Room {v.hostRoom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      <div className="text-[10px]">{v.entryTime ? new Date(v.entryTime).toLocaleDateString() : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        v.status === 'Inside' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        v.status === 'Exited' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.status === 'Inside' && (
                        <button 
                          onClick={() => handleCheckout(v._id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                        >
                          <LogOut size={12} /> Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Visitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[22px] text-slate-800">New Visitor Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Visitor Name</label>
                <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. Rahul Kumar" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input type="tel" value={vPhone} onChange={(e) => setVPhone(e.target.value)} placeholder="e.g. 9876543210" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Host Name</label>
                  <input type="text" value={vHost} onChange={(e) => setVHost(e.target.value)} placeholder="e.g. Amit" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Room No.</label>
                  <input type="text" value={vRoom} onChange={(e) => setVRoom(e.target.value)} placeholder="e.g. 101" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Purpose</label>
                <select value={vPurpose} onChange={(e) => setVPurpose(e.target.value)} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="Social">Social / Personal</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Official">Official</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? "Checking In..." : <><CheckCircle2 size={16} /> Check-In Visitor</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
