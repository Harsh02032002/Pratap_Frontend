import React, { useState, useEffect, useMemo } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerTenants, clearOwnerFetchCache } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import {
  Search, Download, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import { API_URL } from "../../utils/api";

const PAGE_SIZE = 12;

const resolveUrl = (val) => {
  if (!val) return null;
  const raw = typeof val === "object" ? (val.url || val.path || val.dataUrl || null) : val;
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${API_URL}${raw}`;
  return `${API_URL}/${raw}`;
};

const getFileUrl = (url) => resolveUrl(url) || "#";

const getStatusStyle = (status) => {
  if (status === "verified")  return { label: "Verified",             cls: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  if (status === "submitted") return { label: "Pending Verification", cls: "bg-amber-50 text-amber-600 border-amber-100" };
  if (status === "rejected")  return { label: "Rejected",             cls: "bg-red-50 text-red-600 border-red-100" };
  return                             { label: "Pending Upload",        cls: "bg-slate-50 text-slate-500 border-slate-200" };
};

export default function TenantDocsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch]   = useState("");
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState("all");

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const [all, kycReqRes] = await Promise.all([
        fetchOwnerTenants(owner.loginId),
        apiFetch(`/api/tenant-kyc-requests?ownerLoginId=${encodeURIComponent(owner.loginId)}`).catch(() => ({ data: [] })),
      ]);
      // Tenants added without Aadhaar upload an alternate proof (Voter ID / PAN / Passport /
      // Driving License) through a separate TenantKycRequest record, not onto tenant.kyc —
      // it must be looked up and merged in here or that document never shows up at all.
      const kycReqByTenant = new Map(
        (kycReqRes?.data || []).map(r => [String(r.tenantId?._id || r.tenantId), r])
      );

      const baseList = (all || []).filter(t =>
        t.kycStatus !== "pending" ||
        t.kyc?.aadhaarNumber ||
        t.kyc?.aadharFile ||
        t.kyc?.aadhaarFront ||
        t.agreementSigned ||
        t.digitalCheckin?.agreement?.pdfUrl ||
        kycReqByTenant.has(String(t._id)) ||
        t.photo
      );

      const merged = [];
      for (const t of baseList) {
        const altKycRequest = kycReqByTenant.get(String(t._id)) || null;
        try {
          const kycData = await apiFetch(`/api/tenants/${encodeURIComponent(t._id || t.loginId)}/kyc`);
          if (kycData?.success) {
            merged.push({ ...t, kyc: { ...(t.kyc || {}), ...(kycData.kyc || {}) }, kycStatus: kycData.kycStatus || t.kycStatus, altKycRequest });
          } else {
            merged.push({ ...t, altKycRequest });
          }
        } catch {
          merged.push({ ...t, altKycRequest });
        }
      }

      setTenants(merged);
    } catch (err) {
      console.error("Error fetching tenant docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [owner.loginId]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const handleVerify = async (tenantId) => {
    try {
      await apiFetch("/api/tenants/kyc/approve", {
        method: "POST",
        body: JSON.stringify({ tenantId })
      });
      clearOwnerFetchCache(owner.loginId);
      fetchDocs();
    } catch (err) {
      alert("Error verifying document: " + err.message);
    }
  };

  const filtered = useMemo(() => {
    let list = tenants;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(d =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.loginId || "").toLowerCase().includes(q) ||
        (d.kyc?.aadhaarNumber || "").toLowerCase().includes(q)
      );
    }
    if (filter === "aadhaar") {
      list = list.filter(d => d.kyc?.aadhaarFront || d.kyc?.aadhaarBack || d.kyc?.aadharFile || d.altKycRequest?.proofFileUrl);
    } else if (filter === "agreement") {
      list = list.filter(d => d.digitalCheckin?.agreement?.pdfUrl || d.agreementSigned);
    } else if (filter === "photo") {
      list = list.filter(d => d.photo || d.digitalCheckin?.kyc?.tenantPhoto);
    }
    return list;
  }, [tenants, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total:      tenants.length,
    kycDone:    tenants.filter(t => t.kycStatus === "verified" || t.kycStatus === "submitted").length,
    agreements: tenants.filter(t => t.digitalCheckin?.agreement?.pdfUrl || t.agreementSigned).length,
  }), [tenants]);

  const TABS = [
    { key: "all",       label: "All" },
    { key: "aadhaar",   label: "Aadhaar / ID" },
    { key: "agreement", label: "Agreements" },
    { key: "photo",     label: "Photos" },
  ];

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Residents KYC Archives"
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Tenant Documents</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Audit uploaded Aadhaar cards, tenant photos, and signed rental agreements.
          </p>
        </div>
        {!loading && (
          <div className="flex gap-2 flex-wrap shrink-0 md:mt-2">
            <span className="text-[11px] bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-3 py-1 font-semibold">
              {stats.total} Tenants
            </span>
            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1 font-semibold">
              {stats.kycDone} KYC Filed
            </span>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 font-semibold">
              {stats.agreements} Agreements Signed
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, login ID, or Aadhaar number..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`h-10 px-4 rounded-xl text-[12px] font-semibold border transition-all ${
                filter === key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-card text-muted-foreground border-border hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading documents...</div>
          ) : paginated.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tenant documents found.</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wider text-muted-foreground bg-muted/50">
                  <th className="px-6 py-3.5 font-semibold">Tenant</th>
                  <th className="px-6 py-3.5 font-semibold">Property &amp; Room</th>
                  <th className="px-6 py-3.5 font-semibold">Aadhaar / ID Proof</th>
                  <th className="px-6 py-3.5 font-semibold">Signed Agreement</th>
                  <th className="px-6 py-3.5 font-semibold">Tenant Photo</th>
                  <th className="px-6 py-3.5 font-semibold">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((d) => {
                  const aadhaarFrontUrl = resolveUrl(d.kyc?.aadhaarFront) || resolveUrl(d.digitalCheckin?.kyc?.aadhaarFront);
                  const aadhaarBackUrl  = resolveUrl(d.kyc?.aadhaarBack)  || resolveUrl(d.digitalCheckin?.kyc?.aadhaarBack);
                  const hasAadharFile   = !!d.kyc?.aadharFile;
                  const aadhaarNumber   = d.kyc?.aadhaarNumber || d.digitalCheckin?.kyc?.aadhaarNumber || "";
                  // Tenants added without Aadhaar (e.g. by superadmin) upload an alternate ID
                  // proof instead (Voter ID / Passport / Driving License) — this must show up
                  // in place of the Aadhaar image, not leave the column blank.
                  const hasAadhaar      = aadhaarFrontUrl || aadhaarBackUrl || hasAadharFile;
                  const altIdProofUrl   = !hasAadhaar ? resolveUrl(d.altKycRequest?.proofFileUrl) : null;
                  const altIdProofType  = d.altKycRequest?.proofType || "ID Proof";
                  const photoUrl        = resolveUrl(d.photo) || resolveUrl(d.digitalCheckin?.kyc?.tenantPhoto);
                  const agreementPdfUrl = d.digitalCheckin?.agreement?.pdfUrl || null;
                  const agreementSigned = !!(d.agreementSigned || agreementPdfUrl);
                  const signedAt        = d.agreementSignedAt || d.digitalCheckin?.agreement?.acceptedAt;
                  const agreementHref   = agreementPdfUrl
                    ? getFileUrl(agreementPdfUrl)
                    : `${API_URL}/api/checkin/tenant/agreement/pdf/${encodeURIComponent(d.loginId || "")}`;
                  const statusObj       = getStatusStyle(d.kycStatus);

                  return (
                    <tr key={d._id} className="hover:bg-muted/40 transition-colors">

                      {/* Tenant */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {(d.name || "T").charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground leading-snug">{d.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{d.loginId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Property & Room */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground text-[12.5px]">{d.propertyTitle || "—"}</p>
                        <p className="text-[11.5px] text-muted-foreground">
                          {d.roomNo ? `Room ${d.roomNo}` : "—"}
                          {d.bedNo ? ` / Bed ${d.bedNo}` : ""}
                        </p>
                      </td>

                      {/* Aadhaar */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-2">
                             {aadhaarFrontUrl ? (
                               <a href={aadhaarFrontUrl} target="_blank" rel="noopener noreferrer" title="View Aadhaar Front">
                                 <img src={aadhaarFrontUrl} alt="Aadhaar Front"
                                   className="w-14 h-9 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                                   onError={(e) => { e.currentTarget.style.display = "none"; }}
                                 />
                               </a>
                             ) : null}
                             {aadhaarBackUrl ? (
                               <a href={aadhaarBackUrl} target="_blank" rel="noopener noreferrer" title="View Aadhaar Back">
                                 <img src={aadhaarBackUrl} alt="Aadhaar Back"
                                   className="w-14 h-9 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                                   onError={(e) => { e.currentTarget.style.display = "none"; }}
                                 />
                               </a>
                             ) : null}
                            {hasAadharFile && (
                              <a href={getFileUrl(d.kyc.aadharFile)} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11.5px] text-blue-600 hover:underline font-medium">
                                <Download size={11} /> PDF
                              </a>
                            )}
                            {altIdProofUrl ? (
                              <a href={altIdProofUrl} target="_blank" rel="noopener noreferrer" title={`View ${altIdProofType}`}>
                                <img src={altIdProofUrl} alt={altIdProofType}
                                  className="w-14 h-9 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                              </a>
                            ) : null}
                          </div>
                          {!hasAadhaar && !altIdProofUrl && (
                            <span className="text-[11.5px] text-muted-foreground">—</span>
                          )}
                          {altIdProofUrl && (
                            <span className="text-[10.5px] text-muted-foreground font-medium">
                              {altIdProofType}
                            </span>
                          )}
                          {aadhaarNumber && (
                            <span className="text-[10.5px] text-muted-foreground font-mono">
                              {aadhaarNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Signed Agreement */}
                      <td className="px-6 py-4">
                        {agreementSigned ? (
                          <div className="flex flex-col gap-1">
                            <a
                              href={agreementHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11.5px] text-emerald-700 hover:underline font-semibold"
                            >
                              <Download size={11} /> Download
                            </a>
                            {signedAt && (
                              <span className="text-[10.5px] text-muted-foreground">
                                {new Date(signedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-muted-foreground italic">Not signed</span>
                        )}
                      </td>

                      {/* Tenant Photo */}
                      <td className="px-6 py-4">
                        {photoUrl ? (
                          <a href={photoUrl} target="_blank" rel="noopener noreferrer" title="View Tenant Photo">
                            <img
                              src={photoUrl}
                              alt="Tenant"
                              className="w-10 h-10 rounded-full object-cover border border-border hover:opacity-80 transition-opacity"
                              onError={e => { e.currentTarget.style.display = "none"; }}
                            />
                          </a>
                        ) : (
                          <span className="text-[11.5px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* KYC Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusObj.cls}`}>
                          {statusObj.label}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <span className="text-[13px] text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-[13px]">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-8 w-8 rounded-lg text-[13px] font-semibold border transition-all ${
                      page === n
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-card border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {n}
                  </button>
                )
              )
            }
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
