import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import {
  RefreshCcw,
  Send,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Building2,
  HelpCircle,
  Clock,
  Sparkles,
  MapPin,
  Star,
  ExternalLink,
  Check
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import { getWebsiteUserEmail } from "../../utils/websiteSession";
import useSEO from "../../hooks/useSEO";
import { toast } from "react-hot-toast";

export default function WebsiteRefundRequest() {
  useSEO({
    pageKey: "refund_request",
    fallbackTitle: "Request Refund & Alternative Stay | Roomhy.com",
    fallbackDescription:
      "Submit an online refund request or browse & request an alternative property allocation directly on Roomhy.com."
  });

  const [searchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const initialType =
    searchParams.get("type") === "alternative" ||
    searchParams.get("type") === "alternative_property"
      ? "alternative"
      : "refund";

  const [requestType, setRequestType] = useState(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    bookingId: searchParams.get("bookingId") || searchParams.get("booking_id") || "",
    userEmail:
      searchParams.get("email") ||
      getWebsiteUserEmail() ||
      localStorage.getItem("userEmail") ||
      "",
    userName: "",
    userPhone: "",
    requestReason: "",
    paymentMethod: "bank",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    preferredArea: "",
    maxBudget: "",
    comments: ""
  });

  // Recommended Alternative Properties state
  const [recommendedStays, setRecommendedStays] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [selectedAlternatives, setSelectedAlternatives] = useState([]);

  const fetchRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    try {
      const qs = new URLSearchParams();
      if (formData.bookingId.trim()) qs.set("bookingId", formData.bookingId.trim());
      if (formData.userEmail.trim()) qs.set("email", formData.userEmail.trim());
      if (formData.preferredArea.trim()) qs.set("preferredArea", formData.preferredArea.trim());
      if (formData.maxBudget) qs.set("maxRent", formData.maxBudget);

      const res = await fetchJson(`/api/booking/alternative-recommendations?${qs.toString()}`).catch(() => null);
      if (res?.success && Array.isArray(res.data)) {
        setRecommendedStays(res.data);
        if (res.bookingSummary) setBookingSummary(res.bookingSummary);
      } else {
        setRecommendedStays([]);
      }
    } catch (err) {
      console.warn("Failed to load alternative recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [formData.bookingId, formData.userEmail, formData.preferredArea, formData.maxBudget]);

  // Trigger recommendation fetch when user selects "alternative" or changes filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 300);
    return () => clearTimeout(timer);
  }, [requestType, fetchRecommendations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelectAlternative = (stay) => {
    const stayKey = stay.propertyId || stay.id;
    setSelectedAlternatives((prev) => {
      const exists = prev.some((item) => (item.propertyId || item.id) === stayKey);
      if (exists) {
        return prev.filter((item) => (item.propertyId || item.id) !== stayKey);
      }
      return [
        ...prev,
        {
          property_id: stay.propertyId || stay.id,
          property_name: stay.name,
          area: stay.area || stay.location,
          city: stay.city || "",
          rent: Number(stay.rent || 0),
          owner_id: stay.ownerId || ""
        }
      ];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      booking_id: formData.bookingId.trim(),
      user_email: formData.userEmail.trim(),
      user_name: formData.userName.trim() || undefined,
      user_phone: formData.userPhone.trim() || undefined,
      request_type: requestType === "refund" ? "refund" : "alternative_property",
      property_requirements: formData.comments,
      other_details: formData.requestReason,
      selected_alternative_properties:
        requestType === "alternative" ? selectedAlternatives : []
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
      const response = await fetchJson("/api/booking/refund-request", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success(
        response?.message ||
          "Your refund / alternative property request has been submitted!"
      );
      setSubmittedSuccess(true);
    } catch (error) {
      console.error("Error submitting refund request:", error);
      toast.error(
        error.message ||
          "Failed to submit request. Please verify your Booking ID and Email address."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FBFA] text-slate-900 selection:bg-teal-500 selection:text-white">
      <WebsiteNavbar />

      <main className="flex-grow">
        {/* HERO — CLEAN LIGHT THEME */}
        <section className="relative border-b border-slate-200/80 text-slate-900 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 overflow-hidden bg-gradient-to-r from-teal-50/80 via-white to-emerald-50/60 flex items-center min-h-[340px]">
          <div
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right] opacity-25 z-0"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=1980&auto=format&fit=crop')`
            }}
          />
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 60%, rgba(255,255,255,0.65) 100%)"
            }}
          />

          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="w-full md:max-w-[580px] text-left space-y-3.5 text-slate-900">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-teal-200 text-[#0FA596] text-[10px] sm:text-xs font-black tracking-wide shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA596]" />
                <span className="uppercase tracking-wider">
                  Direct Online Processing &amp; Alternative Stay Desk
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Refund &amp; Alternative <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Stay Request Desk.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                Didn&apos;t like the property after visiting? Enter your Booking ID (sent to your email on payment) to explore recommended alternative properties in your budget or claim a token deposit refund.
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-200 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>Booking ID Tracked</span>
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
                  <span>Instant Alternative Stays</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN FORM + ALTERNATIVE PROPERTY RECOMMENDATIONS */}
        <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Help Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                  <HelpCircle className="w-4 h-4 text-[#0FA596]" />
                  <span>How It Works</span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        1. Enter Your Booking ID
                      </strong>
                      Check your email inbox for the Booking ID sent when you paid the booking amount via the chat payment link.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        2. Pick Alternative Stay or Refund
                      </strong>
                      If the visited property didn&apos;t match your expectations, select{" "}
                      <strong>Alternative Property</strong> to see recommended stays and select your favorite options.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0FA596] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        3. Dedicated Area Employee Verification
                      </strong>
                      Your request is routed directly to the Area Employee managing that property &amp; Superadmin for fast verification.
                    </div>
                  </div>
                </div>
              </div>

              {bookingSummary && (
                <div className="bg-teal-50/70 rounded-3xl p-5 border border-teal-200 space-y-2">
                  <div className="text-[11px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Detected Original Booking</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {bookingSummary.propertyName || "Roomhy Property"}
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">
                    Area: {bookingSummary.area || "N/A"} • Rent: ₹
                    {Number(bookingSummary.rentAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-[#EEF8F6] via-white to-emerald-50/60 rounded-3xl p-6 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-[#0FA596] font-extrabold text-xs">
                  <Clock className="w-4 h-4 text-[#0FA596]" />
                  <span>Processing SLA</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-slate-950">
                    2 to 4 Business Days
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Alternative property re-allocations are prioritized within 2–6 operational hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive Form */}
            <div className="lg:col-span-8 space-y-6">
              {submittedSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-base text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      Request Submitted Successfully for Booking ID:{" "}
                      <span className="font-mono">{formData.bookingId}</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">
                    Our Area Manager and Superadmin team have received your{" "}
                    {requestType === "alternative"
                      ? `Alternative Stay request (${selectedAlternatives.length} preferred properties selected)`
                      : "Refund request"}{" "}
                    and will update you via email &amp; notification shortly.
                  </p>
                </div>
              )}

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
                          <div className="text-xs font-extrabold text-slate-950">
                            Claim Deposit Refund
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Return token to bank/UPI
                          </div>
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
                          <div className="text-xs font-extrabold text-slate-950">
                            Alternative Property (Recommended Stays)
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Property pasand nahi aayi? Choose another stay
                          </div>
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
                        <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                          Booking ID / Reference (From Email) *
                        </label>
                        <input
                          type="text"
                          name="bookingId"
                          value={formData.bookingId}
                          onChange={handleInputChange}
                          placeholder="Paste Booking ID from your email"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] focus:ring-2 focus:ring-teal-100 text-xs font-mono font-semibold outline-none transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                          Registered Email *
                        </label>
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
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                        Reason for Request *
                      </label>
                      <select
                        name="requestReason"
                        value={formData.requestReason}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] focus:ring-2 focus:ring-teal-100 text-xs font-medium outline-none transition-all bg-white"
                        required
                      >
                        <option value="">-- Select Reason --</option>
                        <option value="Property did not match expectations on visit">
                          Property did not match expectations on visit (Pasand nahi aayi)
                        </option>
                        <option value="Photos mismatch physical room">
                          Photos mismatch physical property
                        </option>
                        <option value="Landlord cancelled booking">
                          Landlord cancelled booking
                        </option>
                        <option value="Coaching center relocated">
                          Coaching center / College relocated
                        </option>
                        <option value="Personal / Medical emergency">
                          Personal / Medical emergency
                        </option>
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
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                              Bank Name *
                            </label>
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
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                              Account Holder Name *
                            </label>
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
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                              Account Number *
                            </label>
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
                            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                              IFSC Code *
                            </label>
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
                          <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                            UPI ID *
                          </label>
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
                    <div className="space-y-5 pt-2 border-t border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs font-black tracking-wider uppercase text-[#0FA596]">
                          STEP 3: CHOOSE RECOMMENDED ALTERNATIVE STAY
                        </div>
                        {selectedAlternatives.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-extrabold">
                            <Check className="w-3.5 h-3.5" />
                            {selectedAlternatives.length} Property Selected
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                            Filter by Preferred Area / City
                          </label>
                          <input
                            type="text"
                            name="preferredArea"
                            value={formData.preferredArea}
                            onChange={handleInputChange}
                            placeholder="e.g. Kunhari, Kota, Indrapuri, Vijay Nagar..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] text-xs outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                            Max Monthly Budget (₹)
                          </label>
                          <input
                            type="number"
                            name="maxBudget"
                            value={formData.maxBudget}
                            onChange={handleInputChange}
                            placeholder="e.g. 8000"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] text-xs outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Recommended Alternative Properties Grid */}
                      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                              Recommended Alternative Properties for You
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Select 1 or more properties below so our team can shift your booking token directly.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={fetchRecommendations}
                            className="text-[11px] font-extrabold text-[#0FA596] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCcw className="w-3 h-3" /> Refresh
                          </button>
                        </div>

                        {loadingRecommendations ? (
                          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-[#0FA596]" />
                            <span>Finding matching alternative stays...</span>
                          </div>
                        ) : recommendedStays.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200/60 p-4">
                            No exact filter match found. Try clearing the Preferred Area or Budget filter to see all verified stays.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                            {recommendedStays.map((stay) => {
                              const stayKey = stay.propertyId || stay.id;
                              const isSelected = selectedAlternatives.some(
                                (item) => item.property_id === stayKey
                              );
                              return (
                                <div
                                  key={stay.id || stayKey}
                                  className={`rounded-2xl border p-3 transition-all bg-white flex flex-col justify-between ${
                                    isSelected
                                      ? "border-[#0FA596] ring-2 ring-teal-100 bg-teal-50/20"
                                      : "border-slate-200 hover:border-teal-300"
                                  }`}
                                >
                                  <div>
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                                      <img
                                        src={stay.image}
                                        alt={stay.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80";
                                        }}
                                      />
                                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[#0FA596] border border-teal-200 text-[10px] font-extrabold shadow-2xs">
                                        {stay.matchReason || "Recommended"}
                                      </span>
                                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                                        {stay.rating || 4.5}
                                        <Star className="w-2.5 h-2.5 fill-white" />
                                      </span>
                                    </div>

                                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">
                                      {stay.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="line-clamp-1">{stay.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <div>
                                        <span className="text-sm font-black text-slate-900">
                                          ₹{Number(stay.rent || 0).toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold">
                                          /mo
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                        {stay.propertyType}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => toggleSelectAlternative(stay)}
                                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                        isSelected
                                          ? "bg-[#0FA596] text-white"
                                          : "bg-teal-50 text-[#0FA596] hover:bg-teal-100 border border-teal-200"
                                      }`}
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Selected</span>
                                        </>
                                      ) : (
                                        <span>Select Stay</span>
                                      )}
                                    </button>
                                    <Link
                                      to={`/property-details/${stay.slug || stay.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Comments / Extra Information */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                      Additional Notes / Comments
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Any extra details regarding your visit or room preferences..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0FA596] text-xs outline-none font-medium"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0FA596] hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {requestType === "alternative"
                              ? `Submit Alternative Property Request${
                                  selectedAlternatives.length > 0
                                    ? ` (${selectedAlternatives.length} Selected)`
                                    : ""
                                }`
                              : "Submit Official Refund Request"}
                          </span>
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
