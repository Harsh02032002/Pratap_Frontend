import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Mail, Phone, MapPin, Send, Headphones } from "lucide-react";
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

  /*
   * ============================================================
   * PAGE LAYOUT API DISABLED
   * Contact page content is now completely hardcoded.
   *
   * Old API:
   * /api/page-layouts/contact
   *
   * This was causing old email, phone and address to appear.
   * ============================================================
   */

  // useEffect(() => {
  //   const fetchLayout = async () => {
  //     let resolved = false;

  //     const timeoutPromise = new Promise((resolve) => {
  //       setTimeout(() => {
  //         if (!resolved) {
  //           console.warn(
  //             "Contact layout API call timed out, falling back to defaults"
  //           );
  //           resolve({ success: false, timeout: true });
  //         }
  //       }, 3000);
  //     });

  //     try {
  //       const apiPromise = fetchJson("/api/page-layouts/contact");
  //       const res = await Promise.race([apiPromise, timeoutPromise]);

  //       resolved = true;

  //       if (
  //         res &&
  //         res.success &&
  //         res.data &&
  //         res.data.sections
  //       ) {
  //         const sorted = res.data.sections.sort(
  //           (a, b) => a.order - b.order
  //         );

  //         setLayoutSections(sorted);
  //       }
  //     } catch (err) {
  //       console.warn(
  //         "Failed to load contact page layout:",
  //         err
  //       );
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchLayout();
  // }, []);

  /*
   * ============================================================
   * HARDCODED CONTACT DETAILS
   * ============================================================
   */

  const contactDetails = {
    email: "team@roomhy.com",
    phone: "+91 8764425030",
    address:
      "847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India",
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
        "Thank you for your message! We'll get back to you within 24 hours."
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

  /*
   * ============================================================
   * HERO SECTION
   * ============================================================
   */

  const renderHero = () => {
    return (
      <div 
        key="contact-hero" 
        className="relative w-full py-8 md:py-12 px-4 md:px-8 overflow-hidden border-b border-stone-200/80 text-center"
        style={{
          background: 'linear-gradient(135deg, #EAEFF5 0%, #F5F7FA 50%, #E5EDF5 100%)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(200, 215, 230, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(210, 225, 240, 0.4) 0%, transparent 40%), linear-gradient(45deg, rgba(255,255,255,0.6) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.6) 75%)`,
            backgroundSize: '100% 100%, 100% 100%, 60px 60px'
          }}
        ></div>
        <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#1E293B] tracking-wider uppercase leading-tight mb-4 drop-shadow-xs">
            GET IN TOUCH
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              24/7 SUPPORT
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              QUICK ASSISTANCE
            </div>
            <div className="px-3.5 py-1.5 rounded-full border border-slate-300/80 bg-white/70 backdrop-blur-xs text-slate-800 text-xs md:text-sm font-semibold tracking-wider uppercase shadow-2xs">
              DIRECT HELP
            </div>
          </div>
        </div>
      </div>
    );
  };

  /*
   * ============================================================
   * CONTACT CARDS
   * ============================================================
   */

  const renderCards = () => {
    const contactCards = [
      {
        icon: Mail,
        title: "Email Us",
        detail: contactDetails.email,
        sub: "We reply within 24 hours",
        href: `mailto:${contactDetails.email}`,
        color: "from-amber-500 to-orange-500",
      },

      {
        icon: Phone,
        title: "Call Us",
        detail: contactDetails.phone,
        sub: "Mon-Sat, 9AM-7PM IST",
        href: `tel:${contactDetails.phone}`,
        color: "from-blue-500 to-indigo-500",
      },

      {
        icon: MapPin,
        title: "Visit Us",
        detail: contactDetails.address,
        sub: "ROOMHY TECHNOLOGY",
        href: "#",
        color: "from-emerald-500 to-teal-500",
      },
    ];

    return (
      <section className="py-16 px-4 max-w-5xl mx-auto -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <a
                key={index}
                href={card.href}
                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon
                    size={24}
                    className="text-white"
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {card.title}
                </h3>

                <p className="text-gray-900 font-medium">
                  {card.detail}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  {card.sub}
                </p>
              </a>
            );
          })}
        </div>
      </section>
    );
  };

  /*
   * ============================================================
   * CONTACT FORM
   * ============================================================
   */

  const renderForm = () => {
    const fields = [
      {
        label: "Full Name",
        name: "name",
        type: "text",
        placeholder: "Enter your name",
        required: true,
      },
      {
        label: "Email Address",
        name: "email",
        type: "email",
        placeholder: "Enter your email",
        required: true,
      },
      {
        label: "Subject",
        name: "subject",
        type: "text",
        placeholder: "How can we help?",
        required: true,
      },
      {
        label: "Message",
        name: "message",
        type: "textarea",
        placeholder: "Tell us more...",
        required: true,
      },
    ];

    return (
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Send Us a Message
            </h2>

            <p className="text-gray-500 mt-2">
              We usually respond within 2-4 hours during business days.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {fields.map((field) => {
              if (field.type === "textarea") {
                return (
                  <div key={field.name}>
                    <label className="text-gray-700 text-sm font-semibold mb-1.5 block">
                      {field.label}
                    </label>

                    <textarea
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.name]: e.target.value,
                        })
                      }
                      required={field.required}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-800 resize-none"
                      placeholder={field.placeholder}
                    />
                  </div>
                );
              }

              return (
                <div key={field.name}>
                  <label className="text-gray-700 text-sm font-semibold mb-1.5 block">
                    {field.label}
                  </label>

                  <input
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.name]: e.target.value,
                      })
                    }
                    required={field.required}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-800"
                    placeholder={field.placeholder}
                  />
                </div>
              );
            })}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send size={20} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    );
  };

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      <main className="min-h-screen">
        {renderHero()}
        {renderCards()}
        {renderForm()}
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}