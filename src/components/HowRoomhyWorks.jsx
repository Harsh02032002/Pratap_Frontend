export default function HowRoomhyWorks() {
  const steps = [
    {
      number: "1",
      title: "Search",
      description: "Find properties by city, type, or budget. Filter by amenities that matter to you.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80"
    },
    {
      number: "2",
      title: "Compare",
      description: "View multiple options side by side. Check reviews, ratings, and verified photos.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80"
    },
    {
      number: "3",
      title: "Bid",
      description: "Place your bid on properties you like. Owners can accept, reject, or counter your offer.",
      image: "https://images.unsplash.com/photo-1554224154-6726b3a85810?auto=format&fit=crop&w=400&q=80"
    },
    {
      number: "4",
      title: "Book",
      description: "Secure your room with a small token. Move in and enjoy your new home!",
      image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=400&q=80"
    }
  ];

  return (
    <section className="py-8 bg-[#F3FBFA] border-y border-[#DDE9E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#102A43] mb-4">How Roomhy Works</h2>
          <p className="text-lg text-[#60758A] max-w-3xl mx-auto">
            Your journey to finding the perfect stay in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-[#DDE9E8] transform hover:-translate-y-1">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#0FA89C] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-[#102A43] mb-2">{step.title}</h3>
                <p className="text-[#60758A] text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/website/fast-bidding" 
            className="inline-block bg-[#0FA89C] hover:bg-[#0D9388] text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 cursor-pointer"
          >
            Start Your Search
          </a>
        </div>
      </div>
    </section>
  );
}
