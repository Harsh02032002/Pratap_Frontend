import React, { useState } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { RefreshCcw, Send, Loader2 } from 'lucide-react';
import { fetchJson } from "../../utils/api";

export default function WebsiteRefundRequest() {
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
      
      alert(response?.message || "Your refund/alternative request has been submitted successfully!");
      
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
      alert(error.message || "Failed to submit request. Please verify the Booking ID and Email address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <WebsiteNavbar />

      <main className="min-h-screen">
        {/* --- COMPACT & STYLISH HEADER --- */}
        <div className="relative w-full py-5 md:py-10 px-4 md:px-6 overflow-hidden border-b border-stone-200/50" 
             style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
          </div>

          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
            
            {/* Icon */}
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-green-100 flex items-center justify-center mb-2 md:mb-4">
              <RefreshCcw size={18} className="text-green-600 md:w-6 md:h-6" />
            </div>
            
            {/* MAIN HEADING */}
            <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
              <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
              <h1 className="text-2xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                Refund <span className="text-[#C5A059] font-serif italic font-medium">Request</span>
              </h1>
              <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
            </div>

            {/* SUB-HEADING */}
            <p className="text-xs md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
              Submit your refund or alternative property request
            </p>

            {/* Bottom Accent Dot */}
            <div className="mt-2 md:mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
          </div>
        </div>

        {/* Form Section */}
        <section className="py-6 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="light-card rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i data-lucide="info" className="w-5 h-5"></i> Booking Details
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Booking ID</p>
                    <p className="text-gray-400">Enter your booking reference</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Request Type</p>
                    <p className="text-gray-400">Choose between refund or alternative</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Payment Details</p>
                    <p className="text-gray-400">Required for refund processing</p>
                  </div>
                  <div className="pt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-900">⏱️ Processing Time: 21 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white md:rounded-2xl p-0 md:p-10 md:shadow-sm md:border md:border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
                  {/* Request Type Selection */}
                  <div>
                    <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-4">Step 1: Select Request Type</h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <label className={`p-2.5 md:p-4 border-2 rounded-lg cursor-pointer transition text-center md:text-left text-xs md:text-sm ${requestType === "refund" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
                        <input
                          type="radio"
                          name="requestType"
                          value="refund"
                          checked={requestType === "refund"}
                          onChange={(e) => setRequestType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="font-semibold">Refund</span>
                      </label>
                      <label className={`p-2.5 md:p-4 border-2 rounded-lg cursor-pointer transition text-center md:text-left text-xs md:text-sm ${requestType === "alternative" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
                        <input
                          type="radio"
                          name="requestType"
                          value="alternative"
                          checked={requestType === "alternative"}
                          onChange={(e) => setRequestType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="font-semibold">Alternative Property</span>
                      </label>
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="space-y-3.5">
                    <h3 className="text-sm md:text-lg font-bold">Step 2: Booking Information</h3>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Booking ID / Reference No. *</label>
                      <input
                        type="text"
                        name="bookingId"
                        value={formData.bookingId}
                        onChange={handleInputChange}
                        placeholder="e.g., BK-123456"
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Reason for Request *</label>
                      <select
                        name="requestReason"
                        value={formData.requestReason}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                        required
                      >
                        <option value="">Select a reason...</option>
                        <option value="not-satisfied">Not Satisfied with Property</option>
                        <option value="change-plans">Change in Plans</option>
                        <option value="relocation">Relocation</option>
                        <option value="financial">Financial Constraints</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Refund Payment Details */}
                  {requestType === "refund" && (
                    <div className="space-y-3.5 bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
                      <h3 className="text-sm md:text-lg font-bold">Step 3: Refund Payment Method</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
                          <div className="flex gap-4 text-xs md:text-sm">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="bank"
                                checked={formData.paymentMethod === "bank"}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span>Bank Transfer</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="upi"
                                checked={formData.paymentMethod === "upi"}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <span>UPI</span>
                            </label>
                          </div>
                        </div>

                        {formData.paymentMethod === "bank" && (
                          <>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Bank Name *</label>
                              <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleInputChange}
                                placeholder="e.g., HDFC Bank"
                                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Account Holder Name *</label>
                              <input
                                type="text"
                                name="accountHolder"
                                value={formData.accountHolder}
                                onChange={handleInputChange}
                                placeholder="Your full name"
                                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Account Number *</label>
                              <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleInputChange}
                                placeholder="Your account number"
                                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">IFSC Code *</label>
                              <input
                                type="text"
                                name="ifscCode"
                                value={formData.ifscCode}
                                onChange={handleInputChange}
                                placeholder="e.g., HDFC0000001"
                                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                              />
                            </div>
                          </>
                        )}

                        {formData.paymentMethod === "upi" && (
                          <div>
                            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">UPI ID *</label>
                            <input
                              type="text"
                              name="upiId"
                              value={formData.upiId}
                              onChange={handleInputChange}
                              placeholder="e.g., yourname@upi"
                              className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Alternative Property Details */}
                  {requestType === "alternative" && (
                    <div className="space-y-3.5 bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
                      <h3 className="text-sm md:text-lg font-bold">Step 3: Preferred Area</h3>
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Preferred Area / City *</label>
                        <select
                          name="preferredArea"
                          value={formData.preferredArea}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                        >
                          <option value="">Select your preferred area...</option>
                          <option value="kota">Kota</option>
                          <option value="indore">Indore</option>
                          <option value="ahmedabad">Ahmedabad</option>
                          <option value="pune">Pune</option>
                          <option value="bangalore">Bangalore</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Additional Comments</label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      placeholder="Any additional information..."
                      rows="3"
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-xs md:text-sm"
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 flex gap-3 text-xs md:text-sm">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                    <button
                      type="reset"
                      disabled={submitting}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCcw className="w-4 h-4" /> Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}

