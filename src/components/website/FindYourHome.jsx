const findHomePoints = [
  {
    title: "Search Smart, Not Hard",
    description: "Our smart filters help you find properties that match your budget, location, and preferences in seconds.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Compare Options",
    description: "View multiple properties side by side. Compare prices, amenities, and reviews to make the best choice.",
    image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Direct Owner Contact",
    description: "No middlemen. Talk directly to property owners through our secure chat system.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Virtual Tours Available",
    description: "Can't visit in person? Take virtual tours of properties from the comfort of your home.",
    image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Transparent Pricing",
    description: "What you see is what you pay. No hidden fees, no surprise charges.",
    image: "https://images.unsplash.com/photo-1554224154-6726b3a85810?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Quick Booking",
    description: "Found your perfect place? Book it in minutes with our streamlined process.",
    image: "https://images.unsplash.com/photo-1558036117-15db45e5bdf9?auto=format&fit=crop&w=800&q=80",
  },
];

export default function FindYourHome() {
  return (
    <section className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Home, Simply.
          </h2>
          <p className="text-gray-600 mt-2 text-lg max-w-2xl mx-auto">
            Your journey to the perfect stay starts here.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {findHomePoints.map((point, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border border-[#DDE9E8]"
            >
              <div className="relative mb-4">
                <img
                  src={point.image}
                  alt={point.title}
                  className="rounded-lg h-40 w-full object-cover"
                  loading="lazy"
                  width="800"
                  height="160"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#0FA89C] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white">
                  {index + 1}
                </div>
              </div>

              <h3 className="font-bold text-lg text-[#102A43] text-center">
                {point.title}
              </h3>

              <p className="text-[#60758A] mt-2 text-sm leading-relaxed text-center">
                {point.description}
              </p>
            </div>
          ))}

        </div>

        <div className="mt-12 text-center">
          <div className="bg-[#F3FBFA] border border-[#DDE9E8] rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-[#102A43] text-lg font-bold">
              Start your search today and find your perfect home
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
