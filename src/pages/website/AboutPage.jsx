import React, { useState, useEffect } from "react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { Target, Shield, Heart, Zap, Rocket, Globe, TrendingUp, Users, Building2, Info, Handshake } from 'lucide-react';
import { fetchJson } from "../../utils/api";
import useSEO from "../../hooks/useSEO";

const visionIcons = [Target, Globe, TrendingUp, Handshake, Shield, Heart, Zap, Rocket];
const visionGradients = [
  'from-teal-500 to-emerald-500', 
  'from-blue-500 to-indigo-500', 
  'from-amber-500 to-orange-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-teal-500',
  'from-red-500 to-rose-500'
];

const valueColors = [
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-red-50 text-red-600 border-red-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-green-50 text-green-600 border-green-100'
];
const valueIcons = [Zap, Heart, Rocket, Shield];

export default function AboutPage() {
  useSEO({ pageKey: 'about', fallbackTitle: 'About Roomhy - Our Story & Mission' });
  const [layoutSections, setLayoutSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch page layout settings from DB
  useEffect(() => {
    const fetchLayout = async () => {
      let resolved = false;
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          if (!resolved) {
            console.warn('About layout API call timed out, falling back to defaults');
            resolve({ success: false, timeout: true });
          }
        }, 3000);
      });

      try {
        const apiPromise = fetchJson('/api/page-layouts/about');
        const res = await Promise.race([apiPromise, timeoutPromise]);
        
        resolved = true;
        if (res && res.success && res.data && res.data.sections) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayoutSections(sorted);
        }
      } catch (err) {
        console.warn('Failed to load About page layout:', err);
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

  const renderHero = () => {
    const content = getSectionContent('about-hero', {
      title: 'About Us',
      subtitle: 'Our Story & Mission'
    });
    return (
      <div key="about-hero" className="relative w-full py-5 md:py-10 px-4 md:px-6 overflow-hidden border-b border-stone-200/50" 
           style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
        </div>
        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2 md:mb-4">
            <Info size={18} className="text-amber-600 md:w-6 md:h-6" />
          </div>
          <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
            <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
            <h1 className="text-lg md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              {content.title}
            </h1>
            <div className="h-[1px] w-6 md:w-8 bg-[#C5A059]/40 hidden md:block"></div>
          </div>
          <p className="text-xs md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
            {content.subtitle}
          </p>
          <div className="mt-2 md:mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
        </div>
      </div>
    );
  };

  const renderVision = () => {
    const content = getSectionContent('vision', {
      title: 'Our Vision'
    });
    const defaultVision = [
      { title: 'Disrupt Traditional Model', description: 'Giving students the power to bid, book, and live without brokers, hidden charges, or negotiation stress.' },
      { title: 'Digital Transformation', description: 'Pioneering a new way for India\'s youth to find accommodation — transparent, real-time, and entirely online.' },
      { title: 'Student Empowerment', description: 'Founded in 2024, Roomhy is building the future of student housing in India.' }
    ];
    const activeVision = content.list || defaultVision;

    return (
      <section key="vision" className="py-6 md:py-20 px-4 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-4 md:mb-12">
          <p className="text-amber-600 font-semibold text-[11px] md:text-sm uppercase tracking-wider mb-1 md:mb-2">Looking Ahead</p>
          <h2 className="text-xl md:text-4xl font-extrabold text-gray-900">{content.title}</h2>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x scrollbar-hide scroll-smooth -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activeVision.map((item, index) => {
            const Icon = visionIcons[index % visionIcons.length];
            const gradient = visionGradients[index % visionGradients.length];
            return (
              <div key={index} className="min-w-[280px] md:min-w-0 flex-1 bg-white rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group snap-center">
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 md:mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{item.title}</h3>
                <p className="text-xs md:text-base text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderMission = () => {
    const content = getSectionContent('mission', {
      title: 'Our Mission'
    });
    const defaultMission = [
      { title: 'Direct Connection', description: 'Enabling direct, real-time bidding between students and property owners.' },
      { title: 'Fair & Flexible', description: 'Making room rentals fair, flexible, and broker-free for everyone.' },
      { title: 'Student-Centric', description: 'India\'s first student-centric property bidding platform helping students take control.' }
    ];
    const activeMission = content.list || defaultMission;

    return (
      <section key="mission" className="py-6 md:py-20 px-4 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4 md:mb-12">
            <p className="text-amber-600 font-semibold text-[11px] md:text-sm uppercase tracking-wider mb-1 md:mb-2">Our Purpose</p>
            <h2 className="text-xl md:text-4xl font-extrabold text-gray-900">{content.title}</h2>
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x scrollbar-hide scroll-smooth -mx-4 px-4 md:mx-0 md:px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {activeMission.map((item, index) => {
              const Icon = visionIcons[(index + 3) % visionIcons.length];
              const gradient = visionGradients[(index + 3) % visionGradients.length];
              return (
                <div key={index} className="min-w-[280px] md:min-w-0 flex-1 bg-white rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group snap-center">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 md:mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon size={18} className="md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-3">{item.title}</h3>
                  <p className="text-xs md:text-base text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderValues = () => {
    const content = getSectionContent('values', {
      title: 'Our Values'
    });
    const defaultValues = [
      { title: 'Transparency', description: 'No middlemen. No hidden fees.' },
      { title: 'Empowerment', description: 'Students and owners are in full control.' },
      { title: 'Speed & Simplicity', description: 'From listing to booking in under 5 mins.' },
      { title: 'Trust', description: 'Every listing is verified. Every user is real.' }
    ];
    const activeValues = content.list || defaultValues;

    return (
      <section key="values" className="py-8 md:py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-6 md:mb-12">
          <p className="text-amber-600 font-semibold text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2">What Drives Us</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900">{content.title}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {activeValues.map((value, index) => {
            const Icon = valueIcons[index % valueIcons.length];
            const color = valueColors[index % valueColors.length];
            return (
              <div key={index} className={`rounded-2xl p-4 md:p-6 border ${color} text-center hover:shadow-lg transition-all`}>
                <Icon size={24} className="mx-auto mb-2 md:mb-4 md:w-8 md:h-8" />
                <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">{value.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderStats = () => {
    const content = getSectionContent('stats', {
      cities: '5+',
      residences: '75+',
      beds: '5000+',
      students: '25K+'
    });
    const statsItems = [
      { number: content.cities || '5+', label: 'Cities', icon: Globe },
      { number: content.beds || '5000+', label: 'Operational Beds', icon: Building2 },
      { number: content.residences || '75+', label: 'Properties', icon: Target },
      { number: content.students || '25K+', label: 'Students Served', icon: Users },
    ];
    return (
      <section key="stats" className="py-8 md:py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-4 md:gap-8">
          {statsItems.map(({ number, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={18} className="text-amber-500 mx-auto mb-1.5 md:mb-3 md:w-6 md:h-6" />
              <p className="text-lg sm:text-4xl font-extrabold text-white">{number}</p>
              <p className="text-gray-400 text-[10px] md:text-sm mt-0.5 md:mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderTeam = () => {
    const content = getSectionContent('team', {
      title: 'Our Leadership',
      subtitle: 'The Minds Behind Roomhy',
      name: 'Resham Singh',
      role: 'Founder & Director',
      image: '/website/images/ceo1.png',
      description: 'With a vision to transform India\'s student housing sector into a transparent, tech-driven ecosystem, ensuring broker-free, affordable accommodation for India\'s youth.'
    });
    const teamImg = (!content.image || content.image.includes('unsplash')) ? '/website/images/ceo1.png' : content.image;
    return (
      <section key="team" className="py-8 md:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-amber-600 font-semibold text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2">{content.subtitle}</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900">{content.title}</h2>
          </div>
          
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <div className="flex flex-col items-center group text-center">
              <div className="relative w-36 h-36 md:w-52 md:h-52 mb-4 md:mb-6">
                <div className="absolute inset-0 bg-amber-500 rounded-2xl md:rounded-3xl rotate-6 transition-transform group-hover:rotate-12 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border-2 md:border-4 border-white">
                  <img src={teamImg} alt={content.name} className="w-full h-full object-cover transition-all duration-500" />
                </div>
              </div>
              <h3 className="text-sm md:text-2xl font-bold text-gray-900">{content.name}</h3>
              <p className="text-amber-600 font-semibold text-xs md:text-base mb-1 md:mb-3">{content.role}</p>
              <p className="text-gray-500 text-center text-[10px] md:text-sm max-w-md leading-relaxed">
                {content.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const defaultOrder = ['about-hero', 'vision', 'mission', 'values', 'stats', 'team'];
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
              case 'about-hero': return renderHero();
              case 'vision': return renderVision();
              case 'mission': return renderMission();
              case 'values': return renderValues();
              case 'stats': return renderStats();
              case 'team': return renderTeam();
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
