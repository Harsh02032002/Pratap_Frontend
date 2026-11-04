import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, Building2, ClipboardList, CheckCircle2, 
  Clock, XCircle, ChevronRight, FileText, ArrowUpRight
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";

const cn = (...classes) => classes.filter(Boolean).join(" ");

function StatCard({ label, value, subtitle, loading }) {
  return (
    <div className="bg-white rounded-[16px] p-6 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <div className="text-[13px] font-medium text-[#4A5961]">{label}</div>
      <div className="text-[32px] font-bold text-[#10242A] tracking-tight my-1">
        {loading ? "..." : (value ?? "0")}
      </div>
      {subtitle && <div className="text-[12px] text-[#708088]">{subtitle}</div>}
    </div>
  );
}

export default function UserOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [employees, setEmployees] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [subscriptionsData, setSubscriptionsData] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [empRes, ownRes, tenRes, reqRes, subRes] = await Promise.allSettled([
          fetchJson("/api/employees"),
          fetchJson("/api/owners"),
          fetchJson("/api/tenants"),
          fetchJson("/api/owner-change-requests?status=Pending"),
          fetchJson("/api/superadmin/owner-subscriptions")
        ]);

        if (empRes.status === "fulfilled" && empRes.value) {
          const list = Array.isArray(empRes.value) ? empRes.value : (empRes.value.employees || []);
          setEmployees(list);
        }
        if (ownRes.status === "fulfilled" && ownRes.value) {
          const list = Array.isArray(ownRes.value) ? ownRes.value : (ownRes.value.owners || []);
          setOwners(list);
        }
        if (tenRes.status === "fulfilled" && tenRes.value) {
          const list = Array.isArray(tenRes.value) ? tenRes.value : (tenRes.value.tenants || []);
          setTenants(list);
        }
        if (reqRes.status === "fulfilled" && reqRes.value) {
          const list = Array.isArray(reqRes.value?.data) ? reqRes.value.data : [];
          setOwnerRequests(list);
        }
        if (subRes.status === "fulfilled" && subRes.value) {
          setSubscriptionsData(subRes.value);
        }
      } catch (err) {
        console.error("UserOverview fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Computed metrics
  const totalStaffCount = employees.length;
  const approvedOwners = useMemo(() => owners.filter(o => o.status === "approved" || o.isApproved), [owners]);
  const approvedOwnersCount = approvedOwners.length;

  const pendingOwners = useMemo(() => owners.filter(o => o.status === "pending" || !o.isApproved || o.kycStatus === "pending"), [owners]);

  const pendingKycCount = useMemo(() => {
    const pendingOwnerKyc = owners.filter(o => (o.kycStatus || "pending") === "pending").length;
    const pendingTenantKyc = tenants.filter(t => ["submitted", "pending"].includes(t.kycStatus || t.kyc?.status || "pending")).length;
    return pendingOwnerKyc + pendingTenantKyc;
  }, [owners, tenants]);

  const openOwnerRequestsCount = ownerRequests.length;

  // Subscriptions counts
  const activeSubs = subscriptionsData?.summary?.subscribedCount || subscriptionsData?.summary?.activeCount || 0;
  const expiringSubs = subscriptionsData?.summary?.expiringCount || 0;

  return (
    <div className="max-w-[1440px] text-[#10242A] space-y-3" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* ── Page Header (PDF Page 2 Exact Match) ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-normal text-[#4A5961] mb-0.5">User Management</div>
          <h1 className="text-[26px] font-bold text-[#10242A] tracking-tight leading-tight">Overview</h1>
        </div>
        <button 
          onClick={() => navigate('/superadmin/owner?view=add')}
          className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors cursor-pointer shadow-xs"
        >
          + Add Owner
        </button>
      </div>

      {/* ── 4 Stat Cards Header ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          label="Total Staff" 
          value={String(totalStaffCount).padStart(2, '0')} 
          subtitle="All departments" 
        />
        <StatCard 
          label="Property Owners" 
          value={String(approvedOwnersCount).padStart(2, '0')} 
          subtitle="Approved owners" 
        />
        <StatCard 
          label="Pending KYC" 
          value={String(pendingKycCount).padStart(2, '0')} 
          subtitle="Awaiting review" 
        />
        <StatCard 
          label="Open Owner Requests" 
          value={String(openOwnerRequestsCount).padStart(2, '0')} 
          subtitle="Need a response" 
        />
      </div>

      {/* ── Middle Grid - Today's attendance & Owners pending approval ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Box: Today's attendance */}
        <div className="lg:col-span-5 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#10242A] mb-3">Today's attendance</h2>
            {/* Horizontal progress bar matching PDF design */}
            <div className="w-full bg-[#E1E6EA] h-2 rounded-full overflow-hidden mb-3 flex">
              <div className="bg-[#0E7C86] h-full" style={{ width: '70%' }} />
              <div className="bg-[#F5B041] h-full" style={{ width: '15%' }} />
              <div className="bg-[#E74C3C] h-full" style={{ width: '15%' }} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Present</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">On leave</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Absent</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Shifts running now</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Owners pending approval */}
        <div className="lg:col-span-7 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#10242A] mb-2.5">Owners pending approval</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E1E6EA]">
                    <th className="pb-1.5 text-[12px] font-semibold text-[#4A5961]">Owner</th>
                    <th className="pb-1.5 text-[12px] font-semibold text-[#4A5961]">Submitted</th>
                    <th className="pb-1.5 text-[12px] font-semibold text-[#4A5961]">KYC</th>
                    <th className="pb-1.5 text-[12px] font-semibold text-[#4A5961] text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                  {pendingOwners.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#4A5961] text-[13px]">
                        No pending owners
                      </td>
                    </tr>
                  ) : (
                    pendingOwners.slice(0, 3).map((o, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-[#10242A] font-normal">{o.name || "Owner"}</td>
                        <td className="py-2 text-[#4A5961]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : "�"}</td>
                        <td className="py-2">
                          <span className={cn(
                            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                            o.kycStatus === "docs_missing" ? "bg-[#FADBD8] text-[#78281F]" : "bg-[#FDEBD0] text-[#7A3E00]"
                          )}>
                            {o.kycStatus === "docs_missing" ? "Docs missing" : "Pending"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={() => navigate('/superadmin/kyc_verification')} className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-[12px] font-semibold px-3 py-0.5 rounded-[6px] transition-colors cursor-pointer">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid - Owner subscriptions & Agreements and requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Box: Owner subscriptions */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#10242A] mb-3">Owner subscriptions</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Active plans</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Expiring in 7 days</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Expired</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Box: Agreements and requests */}
        <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#10242A] mb-3">Agreements and requests</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Agreements awaiting signature</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">New owner requests</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#4A5961]">Documents to verify</span>
                <span className="font-bold text-[#10242A]">00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
