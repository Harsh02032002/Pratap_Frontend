import { useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { RefreshCcw, CreditCard, Calendar, GraduationCap, AlertCircle, Clock, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from "react-router-dom";

export default function WebsiteRefund() {
  useEffect(() => {
    if (window.location.pathname !== '/refund-policy') {
      window.history.replaceState(null, '', '/refund-policy');
    }
  }, []);
  const sections = [
    {
      icon: CreditCard,
      title: "Setup Fee Refund",
      content: [
        "Non-Refundable: The setup fee charged for listing a property or using premium features is non-refundable once deducted from your account.",
        "Exception: If the service was not provided or technical issues prevented access, contact our support team for a full refund within 7 days of transaction."
      ]
    },
    {
      icon: Calendar,
      title: "Booking Cancellation Refunds",
      content: [
        "Cancellation by Tenant (before check-in): Refund 80% of the booking amount. 20% is retained as a cancellation fee.",
        "Cancellation by Owner: If a property is cancelled by the owner after a confirmed booking, the tenant receives a full refund plus compensation.",
        "No-show: If a tenant fails to check-in without notice, the property owner keeps the full booking amount."
      ]
    },
    {
      icon: GraduationCap,
      title: "Special Cases for Student Users",
      content: [
        "Students registered on the platform may be eligible for extended refund periods (up to 30 days) under specific conditions.",
        "Valid student ID verification is required for this benefit."
      ]
    },
    {
      icon: AlertCircle,
      title: "Exceptional Circumstances",
      content: [
        "Medical emergencies, natural disasters, or force majeure events may make the user eligible for a full refund regardless of policy timelines.",
        "Proof of such circumstances is required."
      ]
    },
    {
      icon: Clock,
      title: "Processing Refunds",
      content: [
        "All refunds are processed within 21 days.",
        "Bank transfers typically appear within 7-10 business days.",
        "Refunds to credit cards may take up to 15 business days depending on your financial institution."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      <WebsiteNavbar />

      <main className="min-h-screen">
        {/* --- HERO BANNER (UNIFIED LIGHT GRADIENT) --- */}
        <section className="relative bg-gradient-to-br from-[#F4F7FA] via-white to-teal-50/60 border-b border-slate-200/80 text-slate-900 py-10 md:py-12 px-4 md:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold mb-3 shadow-2xs">
              <RefreshCcw className="w-3.5 h-3.5 text-teal-600" />
              <span>Hassle-Free Security & Token Refunds</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-2.5">
              Refund <span className="text-teal-600">Policy</span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Transparent terms regarding booking deposits, token refunds, and processing timelines.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-6 md:py-16 px-4 max-w-4xl mx-auto">
          <div className="bg-white md:rounded-3xl p-0 md:p-12 md:shadow-sm md:border md:border-gray-100">
            <p className="text-gray-600 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
              This policy outlines the refund terms for the various services and transactions made through the Roomhy platform of <strong>ROOMHY TECHNOLOGY</strong>.
            </p>

            <div className="space-y-5 md:space-y-8">
              {sections.map((section, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                      <section.icon size={18} />
                    </div>
                    <h2 className="text-base md:text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <ul className="space-y-2.5 pl-2 md:pl-13">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <p className="text-gray-600 text-xs md:text-base leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact & Corporate Info */}
            <div className="mt-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <h3 className="text-lg font-bold text-gray-900">Corporate & Contact Information</h3>
                <p className="font-semibold text-gray-900 text-sm">ROOMHY TECHNOLOGY</p>
                <div className="flex items-start gap-3 text-sm text-gray-700">
                  <MapPin size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <span>22, Krishna Nagar, Rangbari Road, Kota, Rajasthan - 324005</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-xs">
                    <Mail size={14} /> team@roomhy.com
                  </a>
                  <a href="tel:+918764425030" className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-xs">
                    <Phone size={14} /> +91 8764425030
                  </a>
                </div>
              </div>
              <Link 
                to="/website/refund-request" 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-green-100 flex items-center justify-center gap-2 shrink-0 text-sm align-self-center md:self-center"
              >
                <RefreshCcw size={16} /> Raise Refund Online
              </Link>
            </div>
          </div>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}




