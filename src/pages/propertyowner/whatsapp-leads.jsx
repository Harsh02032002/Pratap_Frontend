import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { toast } from "react-hot-toast";
import { 
  MessageSquare, Search, Phone, ExternalLink, 
  UserCheck, AlertCircle, Clock, Zap, Loader2
} from "lucide-react";

export default function WhatsappLeadsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/owners/${owner.loginId}/enquiries`);
      if (data) {
        // filter for source WhatsApp
        setLeads(data.filter(e => e.source?.toLowerCase() === "whatsapp"));
      }
    } catch (err) {
      console.error("Error fetching WhatsApp leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [owner.loginId]);

  const handleAction = async (id) => {
    try {
      await apiFetch(`/api/owners/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" })
      });
      // Update local state status to completed
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status: "completed" } : l));
    } catch (err) {
      console.error("Error marking lead handled:", err);
      toast.error(`Action failed: ${err.message}`);
    }
  };

  const filteredLeads = leads.filter(l => 
    (l.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.notes || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.studentPhone || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="WhatsApp Integration Leads" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">WhatsApp Chat Leads</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Monitor automated chatbot captures, replies, templates, and human handoff states.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chat leads by sender name or content..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading chat leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <MessageSquare size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-serif text-[20px] font-bold text-foreground">No WhatsApp Leads</h3>
          <p className="text-[13px] text-muted-foreground mt-1">There are no leads generated via WhatsApp yet.</p>
        </div>
      ) : (
        /* Grid of WhatsApp Leads */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((item) => {
            const isHandled = ["completed", "handled", "accepted"].includes(item.status?.toLowerCase());
            const phoneDigits = (item.studentPhone || "").replace(/[^0-9]/g, "");
            
            return (
              <div key={item._id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <MessageSquare size={20} />
                    </div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      !isHandled 
                        ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" 
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {isHandled ? "Handled" : "Needs Response"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-[21px] font-bold text-foreground">{item.studentName || "Prospect"}</h3>
                    <p className="text-[12px] font-mono text-muted-foreground mt-0.5">
                      {item.studentPhone || "—"} • {item.ts ? new Date(item.ts).toLocaleDateString("en-IN") : "Recent"}
                    </p>
                    {item.propertyName && (
                      <p className="text-[11.5px] font-semibold text-slate-400 mt-1">
                        Property: {item.propertyName}
                      </p>
                    )}
                    {item.notes ? (
                      <p className="text-[12.5px] text-muted-foreground mt-3 italic bg-emerald-50/20 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/30">
                        " {item.notes} "
                      </p>
                    ) : (
                      <p className="text-[12px] text-slate-400 mt-3 italic">No conversation summary available.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border/60 mt-6 pt-4 flex gap-2">
                  {phoneDigits && (
                    <a 
                      href={`https://wa.me/${phoneDigits}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      Open WhatsApp <ExternalLink size={13} />
                    </a>
                  )}
                  {!isHandled && (
                    <button 
                      onClick={() => handleAction(item._id)}
                      className="px-4 h-10 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition"
                    >
                      Mark Handled
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PropertyOwnerLayout>
  );
}

