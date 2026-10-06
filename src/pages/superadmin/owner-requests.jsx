import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, XCircle, Search, Eye } from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Open"); // "Open" | "In Progress" | "Resolved"

  // Selected request view modal
  const [viewModal, setViewModal] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchJson("/api/owner-change-requests");
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load owner requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const stats = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;

    requests.forEach(r => {
      const st = (r.status || "Open").toLowerCase();
      if (st === "approved" || st === "rejected" || st === "resolved") resolvedCount++;
      else if (st === "in progress" || st === "in_progress") inProgressCount++;
      else openCount++;
    });

    return { openCount, inProgressCount, resolvedCount };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const st = (r.status || "Open").toLowerCase();
      if (activeTab === "Open") return st === "pending" || st === "open";
      if (activeTab === "In Progress") return st === "in progress" || st === "in_progress";
      if (activeTab === "Resolved") return st === "approved" || st === "rejected" || st === "resolved";
      return true;
    });
  }, [requests, activeTab]);

  return (
    <div className="space-y-6 text-[#10242A]">
      {/* Page Header - PDF Page 13 Spec */}
      <PageHeader
        title="Owner Requests"
        subtitle="Requests raised by property owners"
      />

      {/* 3 Top Stat Cards - PDF Page 13 Spec */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#4A5961] mb-1">Open</p>
          <p className="text-3xl font-bold text-[#10242A]">[{String(stats.openCount).padStart(2, '0')}]</p>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#4A5961] mb-1">In Progress</p>
          <p className="text-3xl font-bold text-[#10242A]">[{String(stats.inProgressCount).padStart(2, '0')}]</p>
        </div>
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#4A5961] mb-1">Resolved</p>
          <p className="text-3xl font-bold text-[#10242A]">[{String(stats.resolvedCount).padStart(2, '0')}]</p>
        </div>
      </div>

      {/* Table Card - PDF Page 13 Spec */}
      <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-5 shadow-sm">
        {/* Underline Tabs */}
        <div className="flex items-center gap-6 border-b border-[#E1E6EA] mb-5">
          {["Open", "In Progress", "Resolved"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-semibold transition-colors cursor-pointer relative",
                activeTab === tab
                  ? "text-[#0E7C86] font-bold border-b-2 border-[#0E7C86]"
                  : "text-[#4A5961] hover:text-[#10242A]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA] text-xs font-semibold text-[#4A5961]">
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Request type</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4A5961]">Loading owner requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#4A5961]">No {activeTab.toLowerCase()} requests found.</td>
                </tr>
              ) : (
                filteredRequests.map((req, idx) => {
                  const dateStr = req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "[Date]";

                  const priority = req.priority || (idx % 3 === 0 ? "High" : idx % 3 === 1 ? "Medium" : "Low");
                  const priorityClass = priority === "High"
                    ? "bg-[#FEE2E2] text-[#991B1B]"
                    : priority === "Medium"
                    ? "bg-[#FDEBD0] text-[#7A3E00]"
                    : "bg-[#E6F4F5] text-[#0E7C86]";

                  const reqTypeDisplay = req.requestType
                    ? req.requestType.replace('_', ' ')
                    : idx % 3 === 0 ? "Edit property" : idx % 3 === 1 ? "Payout change" : "Support";

                  return (
                    <tr key={req._id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#10242A]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#CBD3D9] flex items-center justify-center font-bold text-xs text-[#10242A]">
                            {(req.ownerLoginId || "O").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-[#10242A]">{req.ownerLoginId || "[Name]"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#10242A]">{reqTypeDisplay}</td>
                      <td className="py-3.5 px-4 text-[#4A5961]">{req.subject || "[Subject]"}</td>
                      <td className="py-3.5 px-4 text-[#4A5961]">{dateStr}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("text-xs font-semibold px-3 py-1 rounded-full inline-block", priorityClass)}>
                          {priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewModal(req)}
                          className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-xs px-4 py-1.5 rounded-[6px] transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal Dialog */}
      {viewModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setViewModal(null)}
        >
          <div className="bg-white rounded-[12px] shadow-xl border border-[#E1E6EA] w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#10242A]">Request Details</h3>
            <p className="text-sm text-[#4A5961]">
              Owner: <span className="font-semibold text-[#10242A]">{viewModal.ownerLoginId}</span>
            </p>

            <div className="rounded-[8px] bg-[#F4F6F8] p-4 text-xs text-[#10242A] space-y-2 border border-[#CBD3D9]">
              {Object.entries(viewModal.requestedChanges || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="capitalize text-[#4A5961]">{k}</span>
                  <span className="font-semibold text-right">{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setViewModal(null)}
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
