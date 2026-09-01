import { useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { Ban, ShieldCheck, AlertTriangle, Users, Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function WebsiteCancellation() {
  useEffect(() => {
    if (window.location.pathname !== '/cancellation') {
      window.history.replaceState(null, '', '/cancellation');
    }
  }, []);
  const sections = [
    {
      icon: Users,
      title: "Definitions",
      content: [
        '"Roomhy", "We", "Us", or "Our" refers to ROOMHY TECHNOLOGY and its associated services.',
        '"User", "You", or "Your" refers to any individual or entity using the platform.',
        '"Platform" refers to Roomhy\'s website, mobile application, and related services.'
      ]
    },
    {
      icon: Ban,
      title: "Cancellation by Students",
      content: [
        "You may cancel a booking request at any time before the property owner confirms your bid – no penalty applies.",
        "If you cancel after confirmation, please notify the owner promptly via the platform. Any advance rent or deposit refund will be handled directly between you and the owner."
      ]
    },
    {
      icon: Building2,
      title: "Cancellation by Property Owners",
      content: [
        "You may cancel a listing or decline bids at any time before accepting an offer.",
        "Once an offer is accepted, cancelling without a valid reason may affect your account's standing and visibility."
      ]
    },
    {
      icon: AlertTriangle,
      title: "Exceptional Circumstances",
      content: [
        "Roomhy may cancel or reverse a booking if fraudulent or misleading activity is detected.",
        "The property or listing violates our Terms & Conditions."
      ]
    },
    {
      icon: ShieldCheck,
      title: "Fair Use Policy",
      content: [
        "Posting false, misleading, or duplicate property listings is not allowed.",
        "Submitting fake bids or bids with no intent to rent is prohibited.",
        "Harassing, abusing, or spamming other users is strictly forbidden.",
        "Circumventing the platform to avoid using its features is not allowed."
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
              <Ban className="w-3.5 h-3.5 text-teal-600" />
              <span>Transparent Cancellation Policy</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-2.5">
              Cancellation <span className="text-teal-600">Policy</span>
            </h1>

            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
              Clear guidelines for booking cancellations and fair usage for students and property owners.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-6 md:py-16 px-4 max-w-4xl mx-auto">
          <div className="bg-white md:rounded-3xl p-0 md:p-12 md:shadow-sm md:border md:border-gray-100">
            <p className="text-gray-600 text-xs md:text-base leading-relaxed mb-6 md:mb-8">
              At Roomhy, we aim to make the rental process transparent and hassle-free for both students and property owners. This policy outlines our guidelines for cancellations and fair usage of the platform under <strong>ROOMHY TECHNOLOGY</strong>.
            </p>

            <div className="space-y-5 md:space-y-8">
              {sections.map((section, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-all">
                      <section.icon size={18} />
                    </div>
                    <h2 className="text-base md:text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <ul className="space-y-2.5 pl-2 md:pl-13">
                    {section.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        <p className="text-gray-600 text-xs md:text-base leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Contact & Corporate Info */}
            <div className="mt-12 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Corporate & Contact Information</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">ROOMHY TECHNOLOGY</p>
                
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-red-650 shrink-0 mt-0.5" />
                  <span>847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <a href="mailto:team@roomhy.com" className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
                    <Mail size={16} /> team@roomhy.com
                  </a>
                  <a href="tel:+918764425030" className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
                    <Phone size={16} /> +91 8764425030
                  </a>
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




