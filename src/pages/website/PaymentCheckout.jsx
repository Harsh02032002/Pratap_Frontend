import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { fetchJson } from "../../utils/api";

export default function PaymentCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bookingId = searchParams.get("bookingId");
  const rawAmount = searchParams.get("amount");
  const amount = useMemo(() => {
    const val = parseFloat(String(rawAmount || "0").replace(/[^\d.-]/g, ""));
    return isNaN(val) ? 0 : val;
  }, [rawAmount]);
  
  const [loading, setLoading] = useState(true);
  const [razorpayKey, setRazorpayKey] = useState("");
  const [bookingData, setBookingData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, success, failed
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Fetch Razorpay Key
        const keyRes = await fetchJson("/api/booking/config/razorpay-key").catch(() => null);
        setRazorpayKey(keyRes?.razorpayKey || keyRes?.key || "");

        // Fetch Booking Details if possible
        if (bookingId) {
          const bRes = await fetchJson(`/api/booking/requests/${bookingId}`).catch(() => null);
          setBookingData(bRes?.data || bRes || null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to initialize payment system.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId]);

  const handlePayNow = async () => {
    if (!razorpayKey) {
      alert("Payment gateway not configured correctly.");
      return;
    }

    try {
      // Create Razorpay Order
      const orderRes = await fetchJson("/api/booking/create-order", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          currency: "INR",
          receipt: `pay_${String(bookingId).slice(-8)}_${Date.now()}`,
          notes: {
            bookingId: bookingId
          }
        })
      });

      const orderId = orderRes?.orderId || orderRes?.id;
      if (!orderId) throw new Error("Could not create order");

      const options = {
        key: razorpayKey,
        amount: Number(amount) * 100,
        currency: "INR",
        name: "Roomhy",
        description: `Booking Payment for ${bookingData?.property_name || "Property"}`,
        order_id: orderId,
        handler: async (response) => {
          // Verify and Confirm Payment
          try {
            await fetchJson("/api/booking/payment/confirm", {
              method: "POST",
              body: JSON.stringify({
                bookingId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                amount
              })
            });
            setPaymentStatus("success");
          } catch (err) {
            setPaymentStatus("failed");
            setError("Payment verification failed.");
          }
        },
        prefill: {
          name: bookingData?.name || "",
          email: bookingData?.email || "",
          contact: bookingData?.phone || ""
        },
        theme: { color: "#0d9488" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      const errorMsg = err?.body?.message || err?.body?.error || err?.message || "Error initiating payment.";
      alert(errorMsg);
    }
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
              <div className="p-8 bg-gradient-to-br from-teal-600 to-teal-800 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                  <CreditCard size={32} />
                </div>
                <h1 className="text-2xl font-bold">Secure Checkout</h1>
                <p className="text-teal-100 text-sm mt-1 opacity-80">Complete your payment for Roomhy</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Property</span>
                      <span className="text-sm font-bold text-gray-900">{bookingData?.property_name || "Roomhy Stay"}</span>
                   </div>
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Area</span>
                      <span className="text-sm font-medium text-gray-600">{bookingData?.area || "N/A"}</span>
                   </div>
                   <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Amount to Pay</span>
                      <span className="text-2xl font-black text-teal-600">₹{amount}</span>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                      Your payment is secured by Razorpay. Roomhy does not store your card or bank details.
                    </p>
                  </div>

                  <button 
                    onClick={handlePayNow}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    Pay ₹{amount} Now
                  </button>

                  <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-800 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft size={16} /> Cancel Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="p-10 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Success!</h2>
              <p className="text-gray-500 mb-8">Thank you for choosing Roomhy. Your payment has been confirmed and the owner has been notified.</p>
              
              <button 
                onClick={() => navigate("/website/index")}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-teal-600/20 transition-all"
              >
                Go to Dashboard
              </button>
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
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all mb-4"
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

