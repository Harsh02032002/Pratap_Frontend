import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import toast from "react-hot-toast";
import { 
  Bell, Search, Plus, Trash2, Edit3, 
  CheckCircle2, AlertCircle, Pin, Loader2, Radio, X
} from "lucide-react";

export default function AnnouncementsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [priorityInput, setPriorityInput] = useState("Normal");
  const [isBusy, setIsBusy] = useState(false);

  // ── Bulk Broadcast state ──────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkBroadcast = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Broadcast ${selectedIds.size} announcement(s) to all active tenants? They will receive push notifications.`)) return;
    setIsBroadcasting(true);
    try {
      const res = await apiFetch('/api/announcements/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          announcementIds: [...selectedIds],
          ownerLoginId: owner.loginId,
          channels: ['push']
        })
      });
      if (res?.success) {
        toast.success(res.message || 'Broadcast sent to all tenants!');
        setSelectedIds(new Set());
      } else {
        toast.error(res?.message || 'Broadcast failed');
      }
    } catch (err) {
      toast.error(err?.message || 'Broadcast failed');
    } finally {
      setIsBroadcasting(false);
    }
  };

  React.useEffect(() => {
    fetchAnnouncements();
  }, [owner.loginId]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/announcements/owner/${owner.loginId}`);
      if (res && res.success) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!titleInput || !contentInput) return;
    setIsBusy(true);
    try {
      const res = await apiFetch("/api/announcements", {
        method: "POST",
        body: JSON.stringify({
          ownerLoginId: owner.loginId,
          title: titleInput,
          content: contentInput,
          priority: priorityInput
        })
      });
      if (res && res.success) {
        setAnnouncements([res.announcement, ...announcements]);
        setTitleInput("");
        setContentInput("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await apiFetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res && res.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Hostel Announcements Board" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* ── Floating Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 mb-5">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background text-xs font-black">{selectedIds.size}</span>
              <span className="text-sm font-semibold text-foreground">
                announcement{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkBroadcast}
                disabled={isBroadcasting}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-muted transition-all disabled:opacity-50 active:scale-95"
              >
                {isBroadcasting ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast to All Tenants'}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-all active:scale-95"
                title="Deselect all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Announcements</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Publish general messages, lift servicing notices, or festival celebrations on the resident portal notice board.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" /> Create Announcement
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements by keyword..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Grid of Announcements */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 flex flex-col items-center">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No announcements found. Click "Create Announcement" to post one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((a) => (
            <div key={a._id} className={`rounded-2xl border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between relative ${
              selectedIds.has(a._id) ? 'border-blue-400 ring-2 ring-blue-200' : 'border-border'
            }`}>
              {/* Checkbox */}
              <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  checked={selectedIds.has(a._id)}
                  onChange={() => toggleSelect(a._id)}
                />
              </div>
              <div className="space-y-4 pl-2">
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    a.priority === "Important" 
                      ? "bg-rose-50 text-rose-600 border-rose-100" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {a.priority}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-[21px] font-bold text-foreground leading-tight">{a.title}</h3>
                  <p className="text-[13px] text-slate-700 mt-3 font-medium bg-muted/40 p-3 rounded-xl border border-border/40">
                    {a.content}
                  </p>
                </div>

                <div className="border-t border-border/60 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Published:</span>
                  <span className="font-bold text-slate-800">{a.date}</span>
                </div>
              </div>

              <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                <button
                  onClick={() => toggleSelect(a._id)}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-all ${
                    selectedIds.has(a._id)
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {selectedIds.has(a._id) ? '✓ Selected' : 'Select to Broadcast'}
                </button>
                <button 
                  onClick={() => handleDelete(a._id)}
                  className="h-10 px-3 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-serif text-[22px] text-foreground mb-4">New Announcement</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Title</label>
                <input 
                  type="text" 
                  value={titleInput} 
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Festival celebration"
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Content Details</label>
                <textarea 
                  rows={4}
                  value={contentInput} 
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder="Type notice details..."
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-700 block mb-1">Priority</label>
                <select 
                  value={priorityInput} 
                  onChange={(e) => setPriorityInput(e.target.value)}
                  className="w-full h-10 px-3 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isBusy}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  {isBusy ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
