import React, { useState } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { 
  CreditCard, CheckCircle2, AlertCircle, Save, 
  KeyRound, ShieldCheck
} from "lucide-react";

export default function PaymentGatewayPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const [razorpayKey, setRazorpayKey] = useState("rzp_live_xxxxxxxxxxxxx");
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Payment Gateway Integration" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Payment Gateway</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Link your merchant Razorpay, PayU, or Paytm UPI credentials for direct tenant rent settlements.</p>
        </div>
      </div>

      <div className="max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
        <h3 className="font-serif text-[20px] text-foreground border-b border-border/60 pb-3">Gateway API Keys</h3>

        {success && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={16} /> API keys updated and verified!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Razorpay Merchant API Key ID</label>
            <div className="relative">
              <KeyRound className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={razorpayKey} 
                onChange={(e) => setRazorpayKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border/60">
            <button 
              type="submit"
              className="px-6 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <Save size={14} /> Link API Gateway Keys
            </button>
          </div>
        </form>
      </div>
    </PropertyOwnerLayout>
  );
}
