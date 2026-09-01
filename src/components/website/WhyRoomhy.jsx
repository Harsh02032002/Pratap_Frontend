import { useRef, useState } from 'react';

const allPoints = [
  // Why Roomhy points (first 3)
  {
    title: "Smart Bidding Always",
    description: "Tired of paying brokers just to see a room? With Roomhy, you connect directly with verified property owners. No middlemen, no extra charges.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Only Pay What You Bid",
    description: "No fixed pricing. No pressure. Set your own budget and place a live bid - the owner picks the best offer.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Verified Properties Only",
    description: "Every listing is verified by our team. No fake photos, no hidden charges. What you see is what you get.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
  },
  // Why Students Choose Us points (next 3)
  {
    title: "Fully Furnished",
    description: "Move in with just your suitcase. Our properties come with all the essential furniture and amenities.",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "24/7 Support",
    description: "From booking to move-out, our dedicated support team is always here to help you with any queries.",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Flexible Booking",
    description: "Book for any duration - short term or long term. Cancel anytime with refund.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  },
];

export default function WhyRoomhy({ title = "Why Choose Roomhy?", subtitle = "Built by students, for students. Here's why thousands trust us.", list }) {
  const [zoomedCard, setZoomedCard] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const lastTapRef = useRef({ index: -1, time: 0 });

  const activePoints = list && list.length > 0 ? list : allPoints;

  const handleMobileTap = (index, point) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return;

    const now = Date.now();
    const isDoubleTap = lastTapRef.current.index === index && now - lastTapRef.current.time < 280;

    if (isDoubleTap) {
      setPreviewCard(point);
      lastTapRef.current = { index: -1, time: 0 };
      return;
    }

    setZoomedCard((current) => (current === index ? null : index));
    lastTapRef.current = { index, time: now };
  };

  return (
    <section className="bg-white py-2 md:py-4">
      <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 mt-2">

        <div className="text-center mb-2 md:mb-4">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1">
            {title}
          </h2>
          <p className="text-xs md:text-base text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">

          {activePoints.map((point, index) => (
            <div
              key={index}
              onClick={() => handleMobileTap(index, point)}
              onDoubleClick={() => setPreviewCard(point)}
              className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer p-2.5 sm:p-5 ${
                zoomedCard === index ? 'scale-105 shadow-xl ring-2 ring-teal-300' : ''
              }`}
            >
              <div className="relative mb-2 sm:mb-4">
                <img
                  src={point.image}
                  alt={point.title}
                  className="rounded-lg h-20 sm:h-40 w-full object-cover"
                  loading="lazy"
                  width="400"
                  height="160"
                />
                <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold border-2 sm:border-4 border-white text-[10px] sm:text-sm">
                  {index + 1}
                </div>
              </div>

              <h3 className="font-bold text-[11px] leading-tight sm:text-lg text-gray-900 text-center mt-4 sm:mt-0">
                {point.title}
              </h3>

              <p className={`text-gray-900 mt-2 leading-relaxed text-center text-[10px] sm:text-sm ${
                zoomedCard === index ? 'block' : 'hidden sm:block'
              }`}>
                {point.description}
              </p>
            </div>
          ))}

        </div>

        <div className="mt-4 md:mt-6 text-center">
          <div className="bg-teal-500 rounded-xl p-3 md:p-6 max-w-2xl mx-auto">
            <p className="text-white text-sm md:text-lg font-semibold">
              Join 50,000+ students who found their perfect home with Roomhy
            </p>
          </div>
        </div>

        {previewCard ? (
          <div
            className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center px-4 md:hidden"
            onClick={() => setPreviewCard(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img src={previewCard.image} alt={previewCard.title} className="h-56 w-full object-cover" loading="lazy" width="400" height="224" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900">{previewCard.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{previewCard.description}</p>
                <button
                  type="button"
                  onClick={() => setPreviewCard(null)}
                  className="mt-4 w-full rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}
