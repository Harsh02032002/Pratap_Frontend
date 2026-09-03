import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Mail, Phone, MapPin, Send, Headphones, ShieldCheck, CheckCircle2, PhoneCall, Sparkles } from "lucide-react";
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function ContactPage() {
  useSEO({
    pageKey: "contact",
    fallbackTitle: "Contact Us | 24/7 Support & Help | Roomhy.com",
    fallbackDescription: "Get in touch with the Roomhy.com support team. Contact us for booking assistance, owner listings, cancellations, refunds, or general queries."
  });

  useEffect(() => {
    if (window.location.pathname !== '/contact-us') {
      window.history.replaceState(null, '', '/contact-us');
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const contactDetails = {
    email: "team@roomhy.com",
    phone: "+91 8764425030",
    address: "847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India",
    workingHours: "Mon - Sat: 9:00 AM - 7:00 PM IST"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetchJson("/api/booking/contact-submit", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      alert(
        response?.message ||
        "Thank you for your message! We'll get back to you within 2-4 hours."
      );

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);

      alert(
        error.message ||
        "Failed to submit message. Please try again later."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-slate-900 flex flex-col font-sans">
      <WebsiteNavbar />

      <main className="flex-grow">

        {/* ================================================================
         * 1. HERO — FULL SECTION BACKGROUND PHOTO (EDGE-TO-EDGE WITH SOFT LEFT OVERLAY)
         * ================================================================ */}
        <section className="relative border-b border-slate-200/80 text-slate-900 py-8 sm:py-10 px-4 sm:px-8 lg:px-14 overflow-hidden bg-slate-900 flex items-center min-h-[380px]">
          
          {/* Full Width Background Photo Layer (Edge-to-Edge Across 100% Section) */}
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right] opacity-100 z-0 brightness-105"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?q=80&w=1980&auto=format&fit=crop')` }}
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
                <span className="uppercase tracking-wider">Contact &amp; 24/7 Support</span>
              </div>
              
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-tight">
                Get in touch with <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0FA596] via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Roomhy Support Team.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                Have questions about student housing, direct owner connect, smart bidding or booking assistance? We are here to help you 24/7.
              </p>

              {/* Trust Indicators Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-300/80 text-[11px] font-black text-slate-800 tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <Headphones className="w-3 h-3 text-[#0FA596]" />
                  </div>
                  <span>24/7 Assistance</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>2-Hour Response</span>
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <span>Direct Connect</span>
                </div>
              </div>
            </div>

            {/* Right Column: Open space */}
            <div className="hidden md:block w-full md:w-1/2"></div>

          </div>
        </section>

        {/* --- MAIN CONTENT GRID (SPLIT CONTACT CARDS & FORM) --- */}
        <section className="pt-8 md:pt-12 pb-12 md:pb-16 px-4 md:px-8 max-w-7xl mx-auto bg-white" style={{ background: '#FFFFFF' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Contact Cards (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#62CFC0] transition-all duration-300 group">
                <div className="flex items-center gap-3.5 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0FA596] flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Email Us</h3>
                    <p className="text-xs text-slate-500">Fast email response</p>
                  </div>
                </div>
                <a href={`mailto:${contactDetails.email}`} className="text-sm font-bold text-[#0FA596] hover:underline break-all block mt-1">
                  {contactDetails.email}
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#62CFC0] transition-all duration-300 group">
                <div className="flex items-center gap-3.5 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0FA596] flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Call Us Direct</h3>
                    <p className="text-xs text-slate-500">{contactDetails.workingHours}</p>
                  </div>
                </div>
                <a href={`tel:${contactDetails.phone.replace(/\s+/g, '')}`} className="text-sm font-bold text-[#0FA596] hover:underline block mt-1">
                  {contactDetails.phone}
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#DCE7EF] shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#62CFC0] transition-all duration-300 group">
                <div className="flex items-center gap-3.5 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0FA596] flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Registered Office</h3>
                    <p className="text-xs text-slate-500">Kota, Rajasthan</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  {contactDetails.address}
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Contact Form (8 Cols) */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#DCE7EF] shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
                <h2 className="text-xl font-extrabold text-slate-900 mb-1">Send Us a Message</h2>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Fill in your details below and our team will reach out to you directly.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Your Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@gmail.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Query regarding Kota Hostels or Smart Bidding"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message here..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#0FA596] focus:ring-2 focus:ring-[#0FA596]/20 outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0FA596] hover:bg-teal-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Sending Message..." : "Send Message"}</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>
      </main>

      <WebsiteFooter />

      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}