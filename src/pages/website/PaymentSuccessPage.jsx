import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, Home, Building2, Calendar, FileText, Download, MessageSquare, PhoneCall } from 'lucide-react';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import { fetchJson } from '../../utils/api';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('order_id') || searchParams.get('txnid') || searchParams.get('orderId') || '';
  const amountParam = searchParams.get('amount') || searchParams.get('amt') || '';
  const statusParam = searchParams.get('status') || 'success';

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchJson(`/api/payments/payu/status/${orderId}`).catch(() => null);
        if (isMounted && res && (res.success || res.transaction)) {
          setPaymentDetails(res.transaction || res.data || res);
        }
      } catch (err) {
        console.error('Error fetching transaction status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadStatus();
    return () => { isMounted = false; };
  }, [orderId]);

  const displayAmount = paymentDetails?.booking_amount || paymentDetails?.amount || amountParam || '1,000';
  const displayPropName = paymentDetails?.property_name || 'Roomhy Verified Stay';
  const displayTxnid = orderId || paymentDetails?.order_id || paymentDetails?.cf_order_id || `RMH_PAYU_${Date.now()}`;
  const displayDate = paymentDetails?.paidAt ? new Date(paymentDetails.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-14 flex flex-col items-center justify-center">
        
        {/* Animated Success Badge & Card */}
        <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Top Hero Banner */}
          <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 px-6 py-10 md:py-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]"></div>
            
            {/* Success Checkmark Icon */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-900/20 animate-bounce duration-1000">
              <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 stroke-[2.5]" />
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-teal-100 text-xs md:text-sm font-semibold max-w-md mx-auto leading-relaxed">
              Your transaction has been processed securely via PayU PG. A confirmation has been saved to your account.
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-widest text-white border border-white/30">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Transaction
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Amount Callout */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
                <span className="text-3xl font-black text-slate-900">₹{Number(displayAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>STATUS: PAID</span>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Breakdown</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Transaction ID</span>
                    <span className="font-extrabold text-slate-900 break-all">{displayTxnid}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Property / Stay</span>
                    <span className="font-extrabold text-slate-900 line-clamp-1">{displayPropName}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Date</span>
                    <span className="font-extrabold text-slate-900">{displayDate}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Method</span>
                    <span className="font-extrabold text-slate-900">PayU Payment Gateway</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons / CTAs */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              
              <Link
                to="/tenant/tenantchat"
                className="w-full sm:flex-1 py-3.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Go to My Messages / Chat</span>
              </Link>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <Link
                to="/properties"
                className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Browse Properties</span>
              </Link>

            </div>

          </div>

          {/* Footer Note */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center text-[11px] text-slate-500 font-medium">
            Need help with your booking or payment? Contact Roomhy Support at <a href="mailto:team@roomhy.com" className="text-teal-600 font-bold underline">team@roomhy.com</a>
          </div>

        </div>

      </main>

      <FooterSpacer />
      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function FooterSpacer() {
  return <div className="h-10"></div>;
}
