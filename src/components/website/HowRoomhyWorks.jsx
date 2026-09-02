import React, { useState } from "react";
import { Search, SlidersHorizontal, ShieldCheck, CheckCircle2, Play, Video } from "lucide-react";

export default function HowRoomhyWorks({ onOpenVideoModal }) {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const steps = [
    {
      number: "1",
      title: "Search & Filter",
      description: "Find PGs, Hostels, or Co-living stays by city, locality, institute or budget with verified photos.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=80"
    },
    {
      number: "2",
      title: "Compare Stays",
      description: "View real photos, student reviews, room sharing options & verified amenities side-by-side.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80"
    },
    {
      number: "3",
      title: "Smart Bidding",
      description: "Submit your custom budget bid directly to verified property owners for instant discounts.",
      image: "https://images.unsplash.com/photo-1554224154-6726b3a85810?auto=format&fit=crop&w=500&q=80"
    },
    {
      number: "4",
      title: "Book & Move In",
      description: "Pay token amount to lock your room with zero brokerage & guaranteed lowest prices.",
      image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=500&q=80"
    }
  ];

  const handleVideoClick = () => {
    if (onOpenVideoModal) onOpenVideoModal();
    else setVideoModalOpen(true);
  };

  return (
    <section className="py-6 lg:py-8 bg-slate-50/60 border-b border-slate-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <span className="text-[11px] font-extrabold text-teal-600 uppercase tracking-widest block mb-1">Simple 4-Step Process</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">How Roomhy Works</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
              Your journey from searching to moving in — transparent, broker-free &amp; quick
            </p>
          </div>

          <button
            onClick={handleVideoClick}
            type="button"
            className="inline-flex items-center gap-2 bg-white hover:bg-teal-50 text-slate-800 hover:text-teal-700 px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs font-extrabold text-xs transition-all cursor-pointer shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
              <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
            </div>
            <span>Watch How It Works</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {steps.map((step) => (
            <div 
              key={step.number} 
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col justify-between"
            >
              <div className="relative h-36 overflow-hidden bg-slate-100">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-teal-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shadow-md">
                  {step.number}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-medium">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {videoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full text-center relative border border-slate-100">
            <button 
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Roomhy Platform Tour</h3>
            <p className="text-xs text-slate-500 mb-4">Discover how Smart Bidding student housing works.</p>
            <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-semibold">
              <span>[ Roomhy Official Platform Tour Video ]</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

