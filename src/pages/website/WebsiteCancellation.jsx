import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import { Ban, ShieldCheck, AlertTriangle, Users, Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function WebsiteCancellation() {
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
        {/* --- COMPACT & STYLISH HEADER --- */}
        <div className="relative w-full py-5 md:py-10 px-4 md:px-6 overflow-hidden border-b border-stone-200/50" 
             style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
          </div>

          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
            
            {/* Icon */}
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-red-100 flex items-center justify-center mb-2 md:mb-4">
              <Ban size={18} className="text-red-500 md:w-6 md:h-6" />
            </div>
            
            {/* MAIN HEADING */}
            <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
              <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
              <h1 className="text-lg md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                Cancellation <span className="text-[#C5A059] font-serif italic font-medium">Policy</span>
              </h1>
              <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
            </div>

            {/* SUB-HEADING */}
            <p className="text-xs md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
              </p>

            {/* Bottom Accent Dot */}
            <div className="mt-2 md:mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
          </div>
        </div>

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




