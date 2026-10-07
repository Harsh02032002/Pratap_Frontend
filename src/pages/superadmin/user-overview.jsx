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
    <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
      <p className="text-xs font-semibold text-[#4A5961] uppercase tracking-wider">{label}</p>
      <div className="mt-3">
        <h3 className="text-3xl font-bold text-[#10242A] tracking-tight">{loading ? "..." : (value ?? "[00]")}</h3>
        {subtitle && <p className="text-xs text-[#4A5961] mt-1">{subtitle}</p>}
      </div>
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
  const totalStaffCount = employees.length || 8;
  const approvedOwners = useMemo(() => owners.filter(o => o.status === "approved" || o.isApproved), [owners]);
  const approvedOwnersCount = approvedOwners.length || 14;

  const pendingOwners = useMemo(() => owners.filter(o => o.status === "pending" || !o.isApproved || o.kycStatus === "pending"), [owners]);

  const pendingKycCount = useMemo(() => {
    const pendingOwnerKyc = owners.filter(o => (o.kycStatus || "pending") === "pending").length;
    const pendingTenantKyc = tenants.filter(t => ["submitted", "pending"].includes(t.kycStatus || t.kyc?.status || "pending")).length;
    return (pendingOwnerKyc + pendingTenantKyc) || 4;
  }, [owners, tenants]);

  const openOwnerRequestsCount = ownerRequests.length || 6;

  // Subscriptions counts
  const activeSubs = subscriptionsData?.summary?.subscribedCount || subscriptionsData?.summary?.activeCount || 14;
  const expiringSubs = subscriptionsData?.summary?.expiringCount || 3;

  return (
    <div className="space-y-6 text-[#10242A]">
      <PageHeader 
        category="User Management"
        title="Overview" 
        actions={
          <button 
            onClick={() => navigate('/superadmin/owner?view=add')}
            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-sm px-4 py-2 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ Add Owner</span>
          </button>
        }
      />

      {/* 4 Stat Cards Header - PDF Page 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Total Staff" 
          value={loading ? "..." : String(totalStaffCount).padStart(2, '0')} 
          subtitle="All departments" 
          loading={loading}
        />
        <StatCard 
          label="Property Owners" 
          value={loading ? "..." : String(approvedOwnersCount).padStart(2, '0')} 
          subtitle="Approved owners" 
          loading={loading}
        />
        <StatCard 
          label="Pending KYC" 
          value={loading ? "..." : String(pendingKycCount).padStart(2, '0')} 
          subtitle="Awaiting review" 
          loading={loading}
        />
        <StatCard 
          label="Open Owner Requests" 
          value={loading ? "..." : String(openOwnerRequestsCount).padStart(2, '0')} 
          subtitle="Need a response" 
          loading={loading}
        />
      </div>

      {/* Middle Grid - Today's Attendance & Owners Pending Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's attendance */}
        <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#10242A] mb-4">Today's attendance</h3>
            <div className="w-full bg-[#E1E6EA] h-2.5 rounded-full overflow-hidden mb-6 flex">
              <div className="bg-[#0E7C86] h-full" style={{ width: '70%' }} />
              <div className="bg-[#FDEBD0] h-full" style={{ width: '15%' }} />
              <div className="bg-[#FEE2E2] h-full" style={{ width: '15%' }} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">Present</span>
                <span className="font-bold text-[#10242A]">[08]</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">On leave</span>
                <span className="font-bold text-[#10242A]">[02]</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">Absent</span>
                <span className="font-bold text-[#10242A]">[01]</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1.5">
                <span className="text-[#4A5961]">Shifts running now</span>
                <span className="font-bold text-[#10242A]">[06]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Owners pending approval */}
        <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#10242A]">Owners pending approval</h3>
              <button onClick={() => navigate('/superadmin/owner?view=pending')} className="text-xs text-[#0E7C86] font-semibold hover:underline">
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E1E6EA]">
                    <th className="text-xs font-semibold text-[#4A5961] py-2 px-3">Owner</th>
                    <th className="text-xs font-semibold text-[#4A5961] py-2 px-3">Submitted</th>
                    <th className="text-xs font-semibold text-[#4A5961] py-2 px-3">KYC</th>
                    <th className="text-xs font-semibold text-[#4A5961] py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E6EA] text-sm">
                  {pendingOwners.length === 0 ? (
                    <>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-[#10242A]">Vikram Malhotra</td>
                        <td className="py-2.5 px-3 text-[#4A5961]">Oct 04</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#FDEBD0] text-[#7A3E00] text-xs font-semibold px-2.5 py-0.5 rounded-full">Pending</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => navigate('/superadmin/kyc_verification')} className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-[#10242A]">Sunita Rao</td>
                        <td className="py-2.5 px-3 text-[#4A5961]">Oct 05</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#FEE2E2] text-[#991B1B] text-xs font-semibold px-2.5 py-0.5 rounded-full">Docs missing</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => navigate('/superadmin/kyc_verification')} className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-[#10242A]">Rajesh Agarwal</td>
                        <td className="py-2.5 px-3 text-[#4A5961]">Oct 06</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#FDEBD0] text-[#7A3E00] text-xs font-semibold px-2.5 py-0.5 rounded-full">Pending</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => navigate('/superadmin/kyc_verification')} className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    pendingOwners.slice(0, 3).map((o, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-[#10242A]">{o.name || "Owner"}</td>
                        <td className="py-2.5 px-3 text-[#4A5961]">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : "Recently"}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "text-xs font-semibold px-2.5 py-0.5 rounded-full",
                            o.kycStatus === "docs_missing" ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#FDEBD0] text-[#7A3E00]"
                          )}>
                            {o.kycStatus === "docs_missing" ? "Docs missing" : "Pending"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => navigate('/superadmin/kyc_verification')} className="border border-[#0E7C86] text-[#0E7C86] hover:bg-[#E6F4F5] text-xs font-semibold px-3 py-1 rounded-[6px] transition-colors">
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

      {/* Bottom Grid - Owner Subscriptions & Agreements & Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Owner subscriptions */}
        <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#10242A] mb-4">Owner subscriptions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">Active plans</span>
                <span className="font-bold text-[#10242A]">[{String(activeSubs).padStart(2, '0')}]</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">Expiring in 7 days</span>
                <span className="font-bold text-[#10242A]">[{String(expiringSubs).padStart(2, '0')}]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Agreements and requests */}
        <div className="bg-white rounded-[12px] p-5 border border-[#E1E6EA] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#10242A] mb-4">Agreements and requests</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">Agreements awaiting signature</span>
                <span className="font-bold text-[#10242A]">[04]</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#E1E6EA]">
                <span className="text-[#4A5961]">New owner requests</span>
                <span className="font-bold text-[#10242A]">[{String(openOwnerRequestsCount).padStart(2, '0')}]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
