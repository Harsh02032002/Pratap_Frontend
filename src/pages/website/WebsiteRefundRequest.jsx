import React, { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { RefreshCcw, Send, Loader2, ShieldCheck, CheckCircle2, Building2, HelpCircle, Mail, Clock, Sparkles } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";
import { toast } from "react-hot-toast";

export default function WebsiteRefundRequest() {
  useSEO({
    pageKey: 'refund_request',
    fallbackTitle: 'Request Refund & Alternative Stay | Roomhy.com',
    fallbackDescription: "Submit an online refund request or request an alternative property allocation directly on Roomhy.com."
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.pathname !== '/refund-request') {
      window.history.replaceState(null, '', '/refund-request');
    }
  }, []);

  const [requestType, setRequestType] = useState("refund");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bookingId: "",
    userEmail: "",
    requestReason: "",
    paymentMethod: "bank",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    preferredArea: "",
    comments: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Prepare payload matching backend expectations
    const payload = {
      booking_id: formData.bookingId,
      user_email: formData.userEmail,
      request_type: requestType === "refund" ? "refund" : "alternative_property",
      property_requirements: formData.comments,
      other_details: formData.requestReason,
    };

    if (payload.request_type === "refund") {
      payload.refund_method = formData.paymentMethod;
      if (formData.paymentMethod === "bank") {
        payload.bank_name = formData.bankName;
        payload.bank_account_holder = formData.accountHolder;
        payload.bank_account_number = formData.accountNumber;
        payload.bank_ifsc_code = formData.ifscCode;
      } else if (formData.paymentMethod === "upi") {
        payload.upi_id = formData.upiId;
      }
    } else {
      payload.preferred_area = formData.preferredArea;
    }

    try {
      const response = await fetchJson('/api/booking/refund-request', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      toast.success(response?.message || "Your refund/alternative request has been submitted successfully!");
      
      // Reset form
      setFormData({
        bookingId: "",
        userEmail: "",
        requestReason: "",
        paymentMethod: "bank",
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        ifscCode: "",
        upiId: "",
        preferredArea: "",
        comments: ""
      });
    } catch (error) {
      console.error("Error submitting refund request:", error);
      toast.error(error.message || "Failed to submit request. Please verify your Booking ID and Email address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FBFA] text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">
        {/* ================================================================
         * 1. HERO — FULL SECTION BACKGROUND PHOTO (EDGE-TO-EDGE WITH SOFT LEFT OVERLAY)
         * ================================================================ */}
        <section className="relative border-b border-slate-200/80 text-slate-900 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 overflow-hidden bg-slate-900 flex items-center min-h-[380px]">
          
          {/* Full Width Background Photo Layer (Edge-to-Edge Across 100% Section) */}
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right] opacity-100 z-0 brightness-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1980&auto=format&fit=crop')` }}
          />

          {/* Rich White Opacity Overlay for 100% text readability & background visibility */}
          <div 
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.90) 50%, rgba(255,255,255,0.35) 100%)' }}
          ></div>

          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            
            {/* Left Column: Direct Dark Typography */}
            <div className="w-full md:max-w-[500px] lg:max-w-[540px] text-left space-y-3.5 text-slate-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA596] animate-pulse" />
                <span className="uppercase tracking-wider">Direct Online Processing Desk</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Refund &amp; Alternative <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Stay Request Desk.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Submit your booking reference below to claim a token deposit refund or request priority room re-allocation.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>Instant Verification</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>2-4 Day Payout</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <RefreshCcw className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Priority Room Transfer</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* --- MAIN FORM CONTENT --- */}
        <section className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar Help Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                  <HelpCircle className="w-4 h-4 text-[#0FA596]" />
                  <span>Request Guidelines</span>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Booking ID Verification</strong>
                      Enter your valid Roomhy booking reference (e.g. BK-123456).
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Choose Request Type</strong>
                      Option for full token refund or priority transfer to an alternative PG/Hostel.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Payment Details</strong>
                      Provide Bank Account or UPI ID for direct payout transfers.
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Time Box */}
              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-6 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Clock className="w-4 h-4 text-[#0FA596]" />
                  <span>Processing SLA</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-slate-950">2 to 4 Business Days</div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Average support response time is under 2 hours during operational hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Form */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Step 1: Select Request Type */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-[#0FA596]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>STEP 1: SELECT REQUEST TYPE</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          requestType === "refund"
                            ? "border-[#0FA596] bg-teal-50/50 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="requestType"
                          value="refund"
                          checked={requestType === "refund"}
                          onChange={(e) => setRequestType(e.target.value)}
                          className="accent-[#0FA596] w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-slate-950">Claim Deposit Refund</div>
                          <div className="text-[10px] text-slate-500 font-medium">Return token to bank/UPI</div>
                        </div>
                      </label>

                      <label
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          requestType === "alternative"
                            ? "border-[#0FA596] bg-teal-50/50 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="requestType"
                          value="alternative"
                          checked={requestType === "alternative"}
                          onChange={(e) => setRequestType(e.target.value)}
                          className="accent-[#0FA596] w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-extrabold text-slate-950">Alternative Property</div>
                          <div className="text-[10px] text-slate-500 font-medium">Re-allocate to another stay</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Step 2: Booking Information */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="text-xs font-black tracking-wider uppercase text-[#0FA596]">
                      STEP 2: BOOKING INFORMATION
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Booking ID / Reference *</label>
                        <input
                          type="text"
                          name="bookingId"
                          value={formData.bookingId}
                          onChange={handleInputChange}
                          placeholder="e.g. BK-123456"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] focus:ring-2 focus:ring-teal-100 text-xs font-medium outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Registered Email *</label>
                        <input
                          type="email"
                          name="userEmail"
                          value={formData.userEmail}
                          onChange={handleInputChange}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] focus:ring-2 focus:ring-teal-100 text-xs font-medium outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Reason for Request *</label>
                      <select
                        name="requestReason"
                        value={formData.requestReason}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] focus:ring-2 focus:ring-teal-100 text-xs font-medium outline-none transition-all bg-white"
                        required
                      >
                        <option value="">-- Select Reason --</option>
                        <option value="Photos mismatch physical room">Photos mismatch physical property</option>
                        <option value="Landlord cancelled booking">Landlord cancelled booking</option>
                        <option value="Coaching center relocated">Coaching center relocated</option>
                        <option value="Personal / Medical emergency">Personal / Medical emergency</option>
                        <option value="Other">Other Reason</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Section based on Request Type */}
                  {requestType === "refund" ? (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="text-xs font-black tracking-wider uppercase text-[#0FA596]">
                        STEP 3: PAYOUT METHOD DETAILS
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-800">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="bank"
                            checked={formData.paymentMethod === "bank"}
                            onChange={handleInputChange}
                            className="accent-[#0FA596]"
                          />
                          <span>Bank Account Transfer</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-slate-800">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="upi"
                            checked={formData.paymentMethod === "upi"}
                            onChange={handleInputChange}
                            className="accent-[#0FA596]"
                          />
                          <span>Instant UPI (GPay / PhonePe / Paytm)</span>
                        </label>
                      </div>

                      {formData.paymentMethod === "bank" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Bank Name *</label>
                            <input
                              type="text"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              placeholder="e.g. HDFC Bank"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0FA596] text-xs outline-none bg-white font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              name="accountHolder"
                              value={formData.accountHolder}
                              onChange={handleInputChange}
                              placeholder="Full Name as on Bank Account"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0FA596] text-xs outline-none bg-white font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Account Number *</label>
                            <input
                              type="text"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              placeholder="Account Number"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0FA596] text-xs outline-none bg-white font-medium"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">IFSC Code *</label>
                            <input
                              type="text"
                              name="ifscCode"
                              value={formData.ifscCode}
                              onChange={handleInputChange}
                              placeholder="e.g. HDFC0001234"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0FA596] text-xs outline-none bg-white font-medium uppercase"
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                          <label className="block text-[11px] font-extrabold text-slate-700 mb-1">UPI ID *</label>
                          <input
                            type="text"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            placeholder="username@upi or mobile@paytm"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0FA596] text-xs outline-none bg-white font-medium"
                            required
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="text-xs font-black tracking-wider uppercase text-[#0FA596]">
                        STEP 3: PREFERRED STAY REQUIREMENTS
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Preferred Area / Locality</label>
                        <input
                          type="text"
                          name="preferredArea"
                          value={formData.preferredArea}
                          onChange={handleInputChange}
                          placeholder="e.g. Landmark City, Kunhari, Kota"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] text-xs outline-none font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Comments / Extra Information */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">Additional Notes / Comments</label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any extra details regarding your visit or room preferences..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] text-xs outline-none font-medium"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0FA596] hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Claim...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Official Request</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>

          </div>
        </section>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
