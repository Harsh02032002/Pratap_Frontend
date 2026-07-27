import React from "react";
import { FileText, CheckCircle2, ShieldCheck, Printer, X, Building2, User, Phone, Mail, Banknote, Calendar } from "lucide-react";

export default function OwnerAgreementModal({ owner, onClose }) {
  if (!owner) return null;

  const formatDate = (d) => {
    if (!d) return new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
    return new Date(d).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const acceptedDate = formatDate(owner.checkinTermsAcceptedAt || owner.checkinSubmittedAt || owner.createdAt);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Owner Asset Partner Agreement</h3>
              <p className="text-xs text-slate-400">Official Property Onboarding & Management Contract</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 text-xs leading-relaxed custom-scrollbar print:p-0 print:overflow-visible">
          
          {/* Document Header */}
          <div className="text-center border-b border-slate-200 pb-5 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2">
              <ShieldCheck size={14} /> Official RoomHy Partner Contract
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">ROOMHY ASSET PARTNER & PROPERTY MANAGEMENT AGREEMENT</h1>
            <p className="text-xs text-slate-500 font-medium">Executed via RoomHy Digital Onboarding Portal under the Information Technology Act, 2000</p>
          </div>

          {/* Schedule of Particulars Table */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-2">Schedule A — Partner & Property Particulars</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Property Owner / Partner Name:</span>
                <strong className="text-slate-900 text-sm">{owner.name || owner.profile?.name || "N/A"}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Owner Partner Login ID:</span>
                <code className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">{owner.loginId || "N/A"}</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Contact Phone & Email:</span>
                <span className="text-slate-900 font-semibold">{owner.phone || owner.checkinPhone || "N/A"} | {owner.email || owner.checkinEmail || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Assigned Property / Location:</span>
                <span className="text-slate-900 font-semibold">{owner.propertyTitle || owner.propertyName || "Main Portfolio"} ({owner.locationCode || owner.checkinArea || "General Zone"})</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Settlement Bank Account:</span>
                <span className="text-slate-900 font-semibold">{owner.bankName || owner.checkinBankName || "Linked"} — A/C: {owner.accountNumber || owner.checkinBankAccountNumber || "Verified"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Digital Acceptance Date:</span>
                <span className="text-emerald-700 font-bold">{acceptedDate}</span>
              </div>
            </div>
          </div>

          {/* Agreement Clauses */}
          <div className="space-y-4 text-slate-700 border-t border-slate-200 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Terms & Conditions Clauses</h2>

            <div className="space-y-3">
              <p>
                <strong className="text-slate-900">1. GRANT OF PROPERTY MANAGEMENT & LISTING RIGHTS:</strong><br />
                The Asset Partner hereby grants RoomHy Property Management Platform the right to market, list, manage digital bookings, perform resident onboarding, and facilitate digital rent collection for the designated property.
              </p>

              <p>
                <strong className="text-slate-900">2. RENT SETTLEMENT & PLATFORM PAYOUT CYCLE:</strong><br />
                All monthly rents collected from onboarded tenants via the RoomHy platform shall be settled directly into the Asset Partner's verified bank account per the agreed payout cycle after deducting applicable service charges.
              </p>

              <p>
                <strong className="text-slate-900">3. TENANT KYC & E-SIGN REGISTRATION:</strong><br />
                RoomHy will enforce mandatory Aadhaar OCR KYC verification and e-signed digital tenancy agreements for all residents prior to move-in. The Partner agrees to accept RoomHy verified digital agreements as standard tenancy contracts.
              </p>

              <p>
                <strong className="text-slate-900">4. SECURITY DEPOSIT & MAINTENANCE:</strong><br />
                Security deposits collected from tenants shall be recorded and accounted for transparently. Day-to-day minor operational maintenance is routed through the RoomHy Partner Portal for swift resolution.
              </p>

              <p>
                <strong className="text-slate-900">5. DURATION & TERMINATION:</strong><br />
                This Asset Partner agreement remains valid indefinitely until terminated by either party with a 30-day written notice, subject to reconciling all ongoing tenant leases and active payouts.
              </p>

              <p>
                <strong className="text-slate-900">6. LEGAL VALIDITY & IT ACT COMPLIANCE:</strong><br />
                Electronic acceptance during digital check-in or account onboarding constitutes a legally binding contract under the Information Technology Act, 2000. Both parties agree that digital records and timestamps carry full evidentiary weight.
              </p>
            </div>
          </div>

          {/* Digital Signature & Verification Box */}
          <div className="mt-6 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wide">Digital Agreement Verified & Signed</h3>
                <p className="text-[11px] text-emerald-700 font-medium">Accepted by {owner.name || "Owner"} ({owner.loginId}) on {acceptedDate}</p>
              </div>
            </div>

            <div className="text-right border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">Verification ID</span>
              <code className="text-xs font-mono font-bold text-emerald-900">ROOMHY-OWNER-AGR-{owner.loginId}</code>
            </div>
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
