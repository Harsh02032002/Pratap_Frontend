import React, { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Settings, X, Loader2 } from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...c) => c.filter(Boolean).join(" ");

export default function OwnerSubscriptions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showSettings, setShowSettings] = useState(false);
  const [trialDaysInput, setTrialDaysInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [selectedOwnerModal, setSelectedOwnerModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchJson("/api/superadmin/owner-subscriptions", { headers: getAuthHeader() });
      if (res.success) {
        setData(res);
        setTrialDaysInput(res.settings?.ownerTrialDays ?? "");
        setPriceInput(res.settings?.ownerSubscriptionPrice ?? "");
      }
    } catch (err) {
      console.error("Failed to load owner subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const ownersList = data?.owners || [];

  const filteredOwners = useMemo(() => {
    return ownersList.filter(o => {
      const q = search.toLowerCase();
      const matchQ = !q || (o.name || "").toLowerCase().includes(q) || (o.loginId || "").toLowerCase().includes(q);

      const plan = (o.subscriptionPlan || "Standard").toLowerCase();
      const matchPlan = planFilter === "all" || plan === planFilter.toLowerCase();

      const st = (o.trialStatus?.status || "trial_active").toLowerCase();
      const matchStatus = statusFilter === "all" ||
        (statusFilter === "active" && (st === "trial_active" || st === "subscribed")) ||
        (statusFilter === "expiring" && st === "trial_active" && o.trialStatus?.daysRemaining <= 7) ||
        (statusFilter === "expired" && st === "expired");

      return matchQ && matchPlan && matchStatus;
    });
  }, [ownersList, search, planFilter, statusFilter]);

  const totalRecords = filteredOwners.length;
  const totalPages = Math.ceil(totalRecords / LIMIT) || 1;
  const paginatedOwners = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredOwners.slice(start, start + LIMIT);
  }, [filteredOwners, currentPage]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetchJson("/api/superadmin/subscription-settings", {
        method: "PUT",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerTrialDays: trialDaysInput !== "" ? Number(trialDaysInput) : undefined,
          ownerSubscriptionPrice: priceInput !== "" ? Number(priceInput) : undefined,
        })
      });
      setShowSettings(false);
      loadData();
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 text-[#10242A]">
      {/* Page Header - PDF Page 14 Spec */}
      <PageHeader
        title="Owner Subscriptions"
        subtitle="Plans and owner billing status"
        actions={
          <button
            onClick={() => setShowSettings(true)}
            className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-sm px-4 py-2 rounded-[8px] transition-colors cursor-pointer"
          >
            Manage Plans
          </button>
        }
      />

      {/* 3 Top Plan Cards - PDF Page 14 Spec */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Basic Plan Card */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm space-y-3">
          <p className="text-base font-bold text-[#10242A]">Basic</p>
          <p className="text-2xl font-bold text-[#10242A]">[Price]<span className="text-xs font-normal text-[#4A5961]">/month</span></p>
          <div className="text-xs text-[#4A5961] space-y-1">
            <p>[Feature one]</p>
            <p>[Feature two]</p>
            <p>[Feature three]</p>
          </div>
          <p className="text-xs font-semibold text-[#10242A] pt-2 border-t border-[#E1E6EA]">
            [{ownersList.filter(o => (o.subscriptionPlan || "").toLowerCase() === "basic").length}] owners
          </p>
        </div>

        {/* Standard Plan Card (Active Highlighted) */}
        <div className="bg-white rounded-[12px] border-2 border-[#0E7C86] p-5 shadow-sm space-y-3 relative">
          <p className="text-base font-bold text-[#10242A]">Standard</p>
          <p className="text-2xl font-bold text-[#10242A]">[Price]<span className="text-xs font-normal text-[#4A5961]">/month</span></p>
          <div className="text-xs text-[#4A5961] space-y-1">
            <p>[Feature one]</p>
            <p>[Feature two]</p>
            <p>[Feature three]</p>
          </div>
          <p className="text-xs font-semibold text-[#10242A] pt-2 border-t border-[#E1E6EA]">
            [{ownersList.filter(o => !(o.subscriptionPlan) || (o.subscriptionPlan || "").toLowerCase() === "standard").length}] owners
          </p>
        </div>

        {/* Premium Plan Card */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm space-y-3">
          <p className="text-base font-bold text-[#10242A]">Premium</p>
          <p className="text-2xl font-bold text-[#10242A]">[Price]<span className="text-xs font-normal text-[#4A5961]">/month</span></p>
          <div className="text-xs text-[#4A5961] space-y-1">
            <p>[Feature one]</p>
            <p>[Feature two]</p>
            <p>[Feature three]</p>
          </div>
          <p className="text-xs font-semibold text-[#10242A] pt-2 border-t border-[#E1E6EA]">
            [{ownersList.filter(o => (o.subscriptionPlan || "").toLowerCase() === "premium").length}] owners
          </p>
        </div>
      </div>

      {/* Table Card - PDF Page 14 Spec */}
      <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm">
        {/* Filter Bar (Search, Plan ▾, Status ▾) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5961]" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search"
              className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] pl-10 pr-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
            />
          </div>
          <select
            value={planFilter} onChange={e => { setPlanFilter(e.target.value); setCurrentPage(1); }}
            className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36"
          >
            <option value="all">Plan ▾</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
          <select
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] w-full sm:w-36"
          >
            <option value="all">Status ▾</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA] text-xs font-semibold text-[#4A5961]">
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">Renewal</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA] text-sm">
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-[#4A5961]">Loading owner subscriptions...</td></tr>
              ) : filteredOwners.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-[#4A5961]">No subscription records found.</td></tr>
              ) : paginatedOwners.map((o, i) => {
                const ts = o.trialStatus || {};
                const isExp = ts.status === "expired";
                const isExpiring = ts.status === "trial_active" && ts.daysRemaining <= 7;
                const planName = o.subscriptionPlan || "Standard";

                const startDateStr = ts.startDate ? new Date(ts.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "[Date]";
                const renewalDateStr = ts.endDate ? new Date(ts.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "[Date]";

                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    {/* Owner Identity */}
                    <td className="py-3.5 px-4 font-medium text-[#10242A]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#CBD3D9] flex items-center justify-center font-bold text-xs text-[#10242A]">
                          {(o.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#10242A]">{o.name || "[Name]"}</span>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4 text-[#10242A] font-medium">{planName}</td>

                    {/* Start */}
                    <td className="py-3.5 px-4 text-[#4A5961]">{startDateStr}</td>

                    {/* Renewal */}
                    <td className="py-3.5 px-4 text-[#4A5961]">{renewalDateStr}</td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-[#10242A] font-medium">[Amount]</td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center",
                        isExp ? "bg-[#FEE2E2] text-[#991B1B]" : isExpiring ? "bg-[#FDEBD0] text-[#7A3E00]" : "bg-[#DDF3E4] text-[#14532D]"
                      )}>
                        {isExp ? "Expired" : isExpiring ? "Expiring" : "Active"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOwnerModal(o)}
                        className="border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E1E6EA]">
            <p className="text-xs text-[#4A5961]">
              Showing {((currentPage - 1) * LIMIT) + 1} to {Math.min(currentPage * LIMIT, totalRecords)} of{" "}
              <span className="font-semibold text-[#10242A]">{totalRecords}</span> subscriptions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="flex items-center gap-1 px-3 py-1 rounded-[6px] border border-[#CBD3D9] text-xs font-semibold text-[#10242A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-xs text-[#4A5961] font-semibold px-2">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex items-center gap-1 px-3 py-1 rounded-[6px] border border-[#CBD3D9] text-xs font-semibold text-[#10242A] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal (Manage Plans) */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[12px] shadow-xl border border-[#E1E6EA] overflow-hidden">
            <div className="p-5 border-b border-[#E1E6EA] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#10242A]">Manage Subscription Plans</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 rounded-[6px] hover:bg-slate-100 transition-colors">
                <X size={18} className="text-[#4A5961]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#10242A]">Free Trial Days</label>
                <input
                  type="number"
                  value={trialDaysInput}
                  onChange={e => setTrialDaysInput(e.target.value)}
                  className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none focus:border-[#0E7C86]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#10242A]">Subscription Price (₹/month)</label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] outline-none focus:border-[#0E7C86]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-xs px-4 py-2 rounded-[6px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-xs px-5 py-2 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings && <Loader2 size={14} className="animate-spin" />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Detail View Modal */}
      {selectedOwnerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[12px] shadow-xl border border-[#E1E6EA] p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#10242A]">{selectedOwnerModal.name || "Owner"} Subscription</h3>
            <div className="text-xs text-[#4A5961] space-y-2">
              <p>ID: <span className="font-semibold text-[#10242A]">{selectedOwnerModal.loginId}</span></p>
              <p>Plan: <span className="font-semibold text-[#10242A]">{selectedOwnerModal.subscriptionPlan || "Standard"}</span></p>
              <p>Status: <span className="font-semibold text-[#10242A]">{selectedOwnerModal.trialStatus?.status || "Active"}</span></p>
              <p>Days Remaining: <span className="font-semibold text-[#10242A]">{selectedOwnerModal.trialStatus?.daysRemaining ?? "—"}</span></p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOwnerModal(null)}
                className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-xs px-4 py-2 rounded-[6px] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
