import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Mail, Phone, MapPin, Send, Headphones, Clock, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <WebsiteNavbar />

      <main className="flex-grow">
        {/* --- HERO BANNER (PREMIUM LIGHT GRADIENT) --- */}
        <section className="relative bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/60 border-b border-slate-200/80 text-slate-900 py-10 md:py-12 px-4 md:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold mb-3 shadow-2xs">
              <Headphones className="w-3.5 h-3.5 text-teal-600" />
              <span>24/7 Dedicated Support</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-2.5">
              Get in Touch with <span className="text-teal-600">Roomhy</span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Have questions about booking, listings, or fast bidding? Our support team is here to help you anytime.
            </p>
          </div>
        </section>

        {/* --- MAIN CONTENT GRID (SPLIT CONTACT CARDS & FORM) --- */}
        <section className="py-10 md:py-14 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Contact Cards (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Email Us</h3>
                    <p className="text-xs text-slate-500">Fast email response</p>
                  </div>
                </div>
                <a href={`mailto:${contactDetails.email}`} className="text-sm font-bold text-teal-600 hover:underline break-all block mt-1">
                  {contactDetails.email}
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Call Us</h3>
                    <p className="text-xs text-slate-500">{contactDetails.workingHours}</p>
                  </div>
                </div>
                <a href={`tel:${contactDetails.phone}`} className="text-sm font-bold text-slate-900 hover:text-teal-600 transition-colors block mt-1">
                  {contactDetails.phone}
                </a>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-teal-300 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Head Office</h3>
                    <p className="text-xs text-slate-500">Roomhy Technology</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-1">
                  {contactDetails.address}
                </p>
              </div>

              {/* Support Guarantee Box */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200/70">
                <div className="flex items-center gap-2.5 text-teal-800 font-extrabold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Smart Bidding & Verified Stays</span>
                </div>
                <p className="text-[11px] text-teal-700 font-medium leading-relaxed">
                  Need help with a property visit or security deposit refund? Our support agents respond directly via call or email.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Send Message Form (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Send Us a Message</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mb-6">
                Fill out the details below and our support team will get back to you within 2-4 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="E.g. Booking enquiry, Owner listing, Refund request"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your query in detail..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </section>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}