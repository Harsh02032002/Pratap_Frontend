import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, Building2, Calendar, FileText, Download, Copy, Check, Mail, AlertCircle, Clock, Loader2 } from 'lucide-react';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import { usePaymentConfirmation } from '../../utils/paymentConfirmation';
import { getAuthSession } from '../../utils/authScope';
import { toast } from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id') || searchParams.get('txnid') || searchParams.get('orderId') || '';
  const confirmation = usePaymentConfirmation(orderId);
  const { state, receipt: paymentDetails, check } = confirmation;
  const [copiedBookingId, setCopiedBookingId] = useState(false);
  const [printing, setPrinting] = useState(false);
  const paid = state === 'paid' && paymentDetails !== null;

  useEffect(() => { setPrinting(false); }, [orderId]);

  // Printing always rechecks the server so a stale or refunded record cannot
  // produce a new paid receipt from an earlier successful page load.
  useEffect(() => {
    if (!printing || state === 'loading') return;
    setPrinting(false);
    if (paid && confirmation.generation === getAuthSession().generation) window.print();
  }, [printing, state, paid, confirmation.generation]);

  const displayAmount = paymentDetails?.amount;
  const displayPropName = paymentDetails?.propertyName;
  const displayTxnid = paymentDetails?.paymentId;
  const displayBookingId = paymentDetails?.bookingId;
  const displayOwner = paymentDetails?.ownerName || 'Not recorded';
  const displayDate = paymentDetails?.paidAt ? new Date(paymentDetails.paidAt).toLocaleString('en-IN') : '';

  const handleCopyBookingId = () => {
    if (!paid || !displayBookingId) return;
    navigator.clipboard?.writeText(String(displayBookingId));
    setCopiedBookingId(true);
    toast.success('Booking ID copied to clipboard!');
    setTimeout(() => setCopiedBookingId(false), 2500);
  };

  const handlePrint = () => {
    setPrinting(true);
    check();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-14 flex flex-col items-center justify-center">
        
        {!paid && (
          <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-5" role="status">
            {state === 'loading' ? <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin" /> : state === 'pending' ? <Clock className="w-12 h-12 mx-auto text-amber-600" /> : <AlertCircle className="w-12 h-12 mx-auto text-slate-500" />}
            <h1 className="text-2xl font-black">{state === 'loading' ? 'Checking payment…' : state === 'pending' ? 'Payment pending' : state === 'failed' ? 'Payment not completed' : 'Payment confirmation unavailable'}</h1>
            <p className="text-sm text-slate-600">{state === 'loading' ? 'Please wait while we verify your payment.' : state === 'pending' ? 'Your payment is awaiting confirmation. Check again before making another payment.' : state === 'failed' ? 'This payment failed, was cancelled, or was refunded. A paid receipt is unavailable.' : 'We could not verify this payment. Sign in with the account used for your booking and check again, or contact support.'}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {orderId && state !== 'loading' && <button type="button" onClick={check} className="px-5 py-3 rounded-xl bg-teal-600 text-white font-bold">Check again</button>}
              <Link to="/my-stays" className="px-5 py-3 rounded-xl bg-slate-100 font-bold">Go to My Stays</Link>
              {state === 'unavailable' && <Link to="/login" className="px-5 py-3 rounded-xl bg-slate-100 font-bold">Sign in</Link>}
            </div>
          </div>
        )}

        {paid && (
        /* Verified payment receipt */
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
              Your payment has been verified. Keep this receipt for your records.
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-widest text-white border border-white/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Payment verified
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Official Booking ID Highlight Box */}
            <div className="bg-teal-50/70 border-2 border-dashed border-teal-500 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-teal-700 uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Booking ID</span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-1 break-all">
                  {displayBookingId}
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  Save this Booking ID to track your stay or request a Refund / Alternative Property in the future.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyBookingId}
                className="px-4 py-2.5 bg-white hover:bg-teal-600 hover:text-white text-teal-700 border border-teal-300 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              >
                {copiedBookingId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedBookingId ? 'Copied!' : 'Copy Booking ID'}</span>
              </button>
            </div>

            <Link to="/my-stays" className="inline-flex items-center gap-2 text-teal-700 font-bold">
              Go to My Stays <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Amount Callout */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
                <span className="text-3xl font-black text-slate-900">₹{Number(displayAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>STATUS: PAID (ONLINE)</span>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Receipt {paymentDetails.receiptId}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Transaction ID</span>
                    <span className="font-extrabold text-slate-900 break-all font-mono">{displayTxnid}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Property / Stay</span>
                    <span className="font-extrabold text-slate-900 line-clamp-1">{displayPropName}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Owner: {displayOwner}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Date &amp; Time</span>
                    <span className="font-extrabold text-slate-900">{displayDate}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Method</span>
                    <span className="font-extrabold text-slate-900">Online (PayU PG)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Print & Refund/Alternative Desk Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <Link
                to={`/refund-request?bookingId=${encodeURIComponent(displayBookingId)}`}
                className="py-3 px-6 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Refund / Alternative Stay Desk</span>
              </Link>
            </div>

          </div>

          {/* Footer Note */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center text-[11px] text-slate-500 font-medium">
            Need help with your booking or payment? Contact Roomhy Support at <a href="mailto:team@roomhy.com" className="text-teal-600 font-bold underline">team@roomhy.com</a>
          </div>

        </div>
        )}

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
