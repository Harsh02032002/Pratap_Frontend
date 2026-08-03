import { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Mail, Phone, MapPin, Send, Headphones } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

export default function ContactPage() {
  useSEO({ pageKey: 'contact', fallbackTitle: 'Contact Roomhy - Get in Touch' });
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            console.warn('Contact layout API call timed out, falling back to defaults');
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/contact');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load contact page layout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const isSectionVisible = (id) => {
    if (layoutSections.length === 0) return true;
    const sec = layoutSections.find(s => s.id === id);
    return sec ? sec.visible : true;
  };

  const getSectionContent = (id, fallback) => {
    if (layoutSections.length === 0) return fallback;
    const sec = layoutSections.find(s => s.id === id);
    return sec && sec.content ? { ...fallback, ...sec.content } : fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetchJson('/api/booking/contact-submit', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });
      alert(response?.message || 'Thank you for your message! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert(error.message || 'Failed to submit message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHero = () => {
    const content = getSectionContent('contact-hero', {
      title: 'Get in Touch',
      subtitle: "Have questions? We'd love to hear from you"
    });
    return (
      <div key="contact-hero" className="relative w-full py-10 px-6 overflow-hidden border-b border-stone-200/50" 
           style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
        </div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
            <Headphones size={24} className="text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              {content.title}
            </h1>
            <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
          </div>
          <p className="text-base md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
            {content.subtitle}
          </p>
          <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
        </div>
      </div>
    );
  };

  const renderCards = () => {
    const content = getSectionContent('contact-cards', {
      email: 'hello@roomhy.com',
      phone: '+91 99830 05030',
      address: '847, Balaji Nagar, Rangbari, Near Pani Ki Tanki, Kota, Rajasthan 324005, India'
    });

    const contactCards = [
      { icon: Mail, title: 'Email Us', detail: content.email, sub: 'We reply within 24 hours', href: `mailto:${content.email}`, color: 'from-amber-500 to-orange-500' },
      { icon: Phone, title: 'Call Us', detail: content.phone, sub: 'Mon-Sat, 9AM-7PM IST', href: `tel:${content.phone}`, color: 'from-blue-500 to-indigo-500' },
      { icon: MapPin, title: 'Visit Us', detail: content.address, sub: 'ROOMHY TECHNOLOGY', href: '#', color: 'from-emerald-500 to-teal-500' },
    ];

    return (
      <section key="contact-cards" className="py-16 px-4 max-w-5xl mx-auto -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactCards.map((card, index) => (
            <a 
              key={index}
              href={card.href}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-gray-900 font-medium">{card.detail}</p>
              <p className="text-gray-500 text-sm mt-1">{card.sub}</p>
            </a>
          ))}
        </div>
      </section>
    );
  };

  const renderForm = () => {
    const content = getSectionContent('contact-form', {
      title: 'Send Us a Message',
      subtitle: 'We usually respond within 2-4 hours during business days.'
    });

    const fields = [
      { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Enter your name', required: true },
      { label: 'Email Address', name: 'email', type: 'email', placeholder: 'Enter your email', required: true },
      { label: 'Subject', name: 'subject', type: 'text', placeholder: 'How can we help?', required: true },
      { label: 'Message', name: 'message', type: 'textarea', placeholder: 'Tell us more...', required: true },
    ];

    return (
      <section key="contact-form" className="py-16 px-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{content.title}</h2>
            <p className="text-gray-500 mt-2">{content.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => {
              if (field.type === 'textarea') {
                return (
                  <div key={field.name}>
                    <label className="text-gray-700 text-sm font-semibold mb-1.5 block">{field.label}</label>
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
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
                  <label className="text-gray-700 text-sm font-semibold mb-1.5 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
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

  const defaultOrder = ['contact-hero', 'contact-cards', 'contact-form'];
  const activeOrder = layoutSections.length > 0
    ? layoutSections.map(s => s.id)
    : defaultOrder;

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <main className="min-h-screen">
          {activeOrder.map(sectionId => {
            if (!isSectionVisible(sectionId)) return null;
            switch (sectionId) {
              case 'contact-hero': return renderHero();
              case 'contact-cards': return renderCards();
              case 'contact-form': return renderForm();
              default: return null;
            }
          })}
        </main>
      )}

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}




