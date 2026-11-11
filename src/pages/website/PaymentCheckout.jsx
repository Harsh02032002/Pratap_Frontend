import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, ArrowLeft, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";

export default function PaymentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const rawBookingId = searchParams.get("bookingId");
  const orderId = searchParams.get("order_id") || searchParams.get("orderId") || searchParams.get("link_id") || searchParams.get("linkId");
  
  const extractedBookingId = useMemo(() => {
    if (rawBookingId) return rawBookingId;
    if (orderId) {
      const parts = String(orderId).split("_");
      for (const part of parts) {
        if (part.length === 24 && /^[0-9a-fA-F]{24}$/.test(part)) return part;
      }
    }
    return null;
  }, [rawBookingId, orderId]);

  const rawAmount = searchParams.get("amount");
  const amount = useMemo(() => {
    const val = parseFloat(String(rawAmount || "0").replace(/[^\d.-]/g, ""));
    return isNaN(val) ? 0 : val;
  }, [rawAmount]);
  
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (orderId) {
          // A gateway return is only a reference, never evidence of payment.
          // The confirmation page verifies it for the signed-in booking user.
          navigate(`/website/payment-success?order_id=${encodeURIComponent(orderId)}`, { replace: true });
          return;
        }

        // Fetch dynamic booking amount config as fallback
        const bookingAmtRes = await fetchJson("/api/booking/config/booking-amount").catch(() => null);
        const systemDefaultAmt = bookingAmtRes?.bookingAmount || 500;

        // Fetch Booking Details if possible
        const targetBookingId = extractedBookingId || rawBookingId;
        if (targetBookingId) {
          const bRes = await fetchJson(`/api/booking/requests/${targetBookingId}`).catch(() => null);
          if (bRes) {
            setBookingData(prev => ({
              ...(bRes.data || bRes || {}),
              amount: bRes?.total_amount || bRes?.booking_amount || bRes?.amount || prev?.amount || systemDefaultAmt
            }));
          }
        } else {
          setBookingData(prev => ({
            ...prev,
            amount: prev?.amount || systemDefaultAmt
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to initialize payment system.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [extractedBookingId, rawBookingId, orderId, navigate]);

  const handlePayNow = async () => {
    try {
      const targetBookingId = extractedBookingId || rawBookingId || `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const finalAmount = amount || bookingData?.amount || bookingData?.booking_amount || 0;
      const customerInfo = {
        name: bookingData?.name || "Guest",
        email: bookingData?.email || "",
        phone: bookingData?.phone || ""
      };

      const orderRes = await fetchJson("/api/payments/payu/create-order", {
        method: "POST",
        body: JSON.stringify({ bookingId: targetBookingId, amount: Number(finalAmount), customerInfo })
      });

      if (!orderRes?.success || !orderRes?.actionUrl || !orderRes?.params) {
        throw new Error(orderRes?.message || "Could not create PayU payment session");
      }

      // Auto-submit POST form to PayU checkout URL
      const form = document.createElement("form");
      form.method = "POST";
      form.action = orderRes.actionUrl;

      Object.entries(orderRes.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("Payment initiation error:", err);
      const errorMsg = err?.body?.message || err?.body?.error || err?.message || "Error initiating payment.";
      toast.error(errorMsg);
    }
  };

  const displayBookingId = bookingData?.booking_id || bookingData?._id || extractedBookingId || rawBookingId || "";

  const handleCopyBookingId = () => {
    if (!displayBookingId) return;
    navigator.clipboard.writeText(displayBookingId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WebsiteNavbar />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          
          {paymentStatus === "pending" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-gradient-to-br from-teal-500 to-teal-600 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                  <CreditCard size={32} />
                </div>
                <h1 className="text-2xl font-bold">Secure Checkout</h1>
                <p className="text-teal-50 text-sm mt-1">Complete your booking payment for Roomhy</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3">
                   {displayBookingId && (
                     <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                       <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">Booking ID</span>
                       <div className="flex items-center gap-1.5">
                         <span className="text-xs font-mono font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                           {displayBookingId}
                         </span>
                         <button
                           type="button"
                           onClick={handleCopyBookingId}
                           className="p-1 text-teal-600 hover:bg-teal-100 rounded transition"
                           title="Copy Booking ID"
                         >
                           {copiedId ? <Check size={14} /> : <Copy size={14} />}
                         </button>
                       </div>
                     </div>
                   )}
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property</span>
                      <span className="text-sm font-bold text-gray-900">{bookingData?.property_name || "Roomhy Stay"}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Area</span>
                      <span className="text-sm font-medium text-gray-600">{bookingData?.area || "N/A"}</span>
                   </div>
                   <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Amount to Pay</span>
                      <span className="text-2xl font-black text-teal-600">₹{amount || bookingData?.amount || bookingData?.booking_amount || 0}</span>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                      Your payment is secured by PayU. After payment, your official <strong>Booking ID</strong> will be sent to your email for future reference or refund tracking.
                    </p>
                  </div>

                  <button 
                    onClick={handlePayNow}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Pay ₹{amount || bookingData?.amount || bookingData?.booking_amount || 0} Now
                  </button>

                  <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Cancel Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="p-10 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-500 mb-4">{error || "Something went wrong during the transaction."}</p>
              <p className="text-sm text-gray-400 mb-8">If money was deducted from your account, it will be refunded within 21 days.</p>
              
              <button 
                onClick={() => setPaymentStatus("pending")}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-teal-600/20 transition-all mb-4"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => navigate("/website/contact")}
                className="text-teal-600 font-bold hover:underline"
              >
                Contact Support
              </button>
            </div>
          )}

        </div>
      </main>

      <WebsiteFooter />
    </div>
  );
}
