import React from "react";
import { FileText, CheckCircle2, ShieldCheck, Printer, X, Building2, User, Phone, Mail, Banknote, Calendar } from "lucide-react";

export default function TenantAgreementModal({ tenant, onClose }) {
  if (!tenant) return null;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const agreementDate = formatDate(tenant.agreementSignedAt || tenant.digitalCheckin?.submittedAt || tenant.createdAt);
  const moveInDate = formatDate(tenant.moveInDate);
  const maskAadhaar = (v) => v ? `XXXX XXXX ${String(v).slice(-4)}` : "Verified Aadhaar";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 text-slate-800">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Tenant Licence & Rental Agreement</h3>
              <p className="text-xs text-slate-400">Official Tenancy Contract — RoomHy Digital Records</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs leading-relaxed custom-scrollbar print:p-0 print:overflow-visible">
          
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-5 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2">
              <ShieldCheck size={14} /> E-Signed Tenancy Document
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">ROOMHY LICENCE & SUBSCRIPTION AGREEMENT</h1>
            <p className="text-xs text-slate-500 font-medium">Entered into between Property Owner Management & Tenant per Information Technology Act, 2000</p>
          </div>

          {/* Schedule / Particulars Box */}
          <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-purple-200/60 pb-2">
              Annexure A — Schedule of Tenancy Particulars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Name of Tenant:</span>
                <strong className="text-slate-900 text-sm">{tenant.name || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Tenant Login ID:</span>
                <code className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono font-bold">{tenant.loginId || "N/A"}</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Tenant Contact:</span>
                <span className="text-slate-900 font-semibold">{tenant.phone || "N/A"} | {tenant.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Property & Room / Bed:</span>
                <span className="text-slate-900 font-semibold">{tenant.propertyTitle || tenant.propertyName || "Property"} — Room {tenant.roomNo || tenant.room || "N/A"} (Bed {tenant.bedNo || "A"})</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Monthly Rent / License Fee:</span>
                <span className="text-slate-900 font-bold text-sm">₹ {tenant.agreedRent || tenant.baseRoomRent || 0} / month</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Security Deposit:</span>
                <span className="text-slate-900 font-semibold">₹ {tenant.securityDepositTotal || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Move-in / Start Date:</span>
                <span className="text-slate-900 font-semibold">{moveInDate}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Minimum Stay Duration:</span>
                <span className="text-slate-900 font-semibold">3 Months</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Verified Aadhaar Number:</span>
                <span className="text-slate-900 font-semibold">{maskAadhaar(tenant.aadhaarNumber || tenant.kyc?.aadhaarNumber)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Agreement E-Signed On:</span>
                <span className="text-emerald-700 font-bold">{agreementDate}</span>
              </div>
            </div>
          </div>

          {/* Key Agreement Terms & Conditions */}
          <div className="space-y-4 text-slate-700 border-t border-slate-200 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Key Terms &amp; Conditions</h2>

            <div className="space-y-3">
              <p>
                <strong className="text-slate-900">1. LICENCE TO OCCUPY:</strong><br />
                The Tenant is granted a revocable, non-exclusive licence to occupy the designated room/bed. This agreement does not create tenancy or leasehold rights under the Transfer of Property Act.
              </p>

              <p>
                <strong className="text-slate-900">2. MONTHLY FEE PAYMENT &amp; DUE DATES:</strong><br />
                Monthly rent/license fee must be paid on or before the due date (5th of every month) via RoomHy portal. Late fees apply beyond grace period.
              </p>

              <p>
                <strong className="text-slate-900">3. SECURITY DEPOSIT &amp; REFUND:</strong><br />
                Security deposit is refundable upon vacating premises after deducting unpaid dues, utility charges, or damages beyond normal wear and tear.
              </p>

              <p>
                <strong className="text-slate-900">4. NOTICE PERIOD &amp; VACATING:</strong><br />
                A 30-day prior notice is required before vacating. Premature exit without required notice results in forfeiture of security deposit.
              </p>

              <p>
                <strong className="text-slate-900">5. COMMUNITY &amp; PROPERTY CONDUCT:</strong><br />
                Sub-letting, non-registered overnight visitors, illegal activities, and disturbance to co-residents are strictly prohibited and grounds for immediate termination.
              </p>
            </div>
          </div>

          {/* E-Signature Verification Box */}
          <div className="mt-6 p-4 bg-purple-50/80 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-xs uppercase tracking-wide">E-Signature Digitally Verified</h3>
                <p className="text-[11px] text-purple-700 font-medium">E-signed by {tenant.agreementESignName || tenant.name} ({tenant.loginId})</p>
              </div>
            </div>

            {tenant.digitalCheckin?.agreement?.signatureDataUrl && (
              <div className="border border-purple-200 p-1.5 rounded-lg bg-white shrink-0">
                <img src={tenant.digitalCheckin.agreement.signatureDataUrl} alt="E-signature" className="h-10 object-contain" />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
          >
            Close Agreement
          </button>
        </div>

      </div>
    </div>
  );
}
