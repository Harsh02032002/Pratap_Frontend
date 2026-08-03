import React, { useEffect, useMemo, useState } from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { getWebsiteApiUrl } from "../../utils/websiteSession";
import { useLucideIcons, useWebsiteCommon } from "../../utils/websiteUi";
import { Building2 } from 'lucide-react';

export default function WebsiteList() {
  useWebsiteCommon();

  const apiUrl = useMemo(() => getWebsiteApiUrl(), []);
  const [cityOptions, setCityOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    property_name: "",
    tenants_managed: "",
    city: "",
    country: "",
    contact_name: "",
    phone: "",
    additional_message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  useLucideIcons([cityOptions, submitMessage]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      let citiesData = [];
      try {
        const response = await fetch(`${apiUrl}/api/cities`);
        if (response.ok) {
          const data = await response.json();
          citiesData = (data.data || []).map((city) => city.name);
        }
      } catch (err) {
        // ignore
      }

      if (citiesData.length === 0) {
        citiesData = ["Indore", "Kota", "Ahmedabad", "Delhi"];
      }

      if (mounted) setCityOptions(citiesData);
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (formData.city === "custom") {
      const customLocation = window.prompt("Enter your city/location name:");
      if (customLocation && customLocation.trim()) {
        setCityOptions((prev) => {
          if (prev.includes(customLocation)) return prev;
          return [...prev, customLocation];
        });
        setFormData((prev) => ({ ...prev, city: customLocation }));
      } else {
        setFormData((prev) => ({ ...prev, city: "" }));
      }
    }
  }, [formData.city]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage(null);

    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Raw formData:', formData);
    console.log('API URL:', apiUrl);

    const ownerName = formData.name?.trim() || '';
    const propertyName = formData.property_name?.trim() || '';
    const city = formData.city?.trim() || '';
    const country = formData.country?.trim() || '';
    const contactName = formData.contact_name?.trim() || '';
    const phone = formData.phone?.trim() || '';
    const additionalMessage = formData.additional_message?.trim() || '';
    const tenantsManaged = parseInt(formData.tenants_managed, 10) || 0;

    console.log('Processed values:', {
      ownerName, propertyName, city, country, contactName, phone
    });

    if (!ownerName || !propertyName || !city || !country || !contactName || !phone) {
      console.error('Validation failed - missing fields:', {
        ownerName: !ownerName,
        propertyName: !propertyName,
        city: !city,
        country: !country,
        contactName: !contactName,
        phone: !phone
      });
      setSubmitMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    const enquiryDescriptionLines = [`Tenants Managed: ${tenantsManaged}`, `Contact Name: ${contactName}`];
    if (additionalMessage) {
      enquiryDescriptionLines.push(`Additional Message: ${additionalMessage}`);
    }

    const enquiryData = {
      property_type: "pg",
      property_name: propertyName,
      city,
      locality: country,
      address: "",
      pincode: "",
      description: enquiryDescriptionLines.join("\n"),
      amenities: [],
      gender_suitability: "",
      rent: 0,
      deposit: "",
      owner_name: ownerName,
      owner_email: "",
      owner_phone: phone,
      contact_name: contactName,
      tenants_managed: tenantsManaged,
      country,
      additional_message: additionalMessage
    };

    // Debug log
    console.log('Submitting enquiry data:', enquiryData);
    console.log('Checking required fields:', {
      property_name: !!propertyName,
      city: !!city,
      owner_name: !!ownerName,
      owner_phone: !!phone
    });

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/website-enquiry/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiryData)
      });
      const result = await response.json();
      console.log('Backend response:', result);
      console.log('Response status:', response.status);
      if (!response.ok) {
        console.error('Backend error:', result);
        throw new Error(result.message || "Failed to submit enquiry");
      }
      setSubmitMessage({
        type: "success",
        text: "Success! Your property enquiry has been submitted successfully. It will be reviewed by our team soon."
      });
      setFormData({
        name: "",
        property_name: "",
        tenants_managed: "",
        city: "",
        country: "",
        contact_name: "",
        phone: "",
        additional_message: ""
      });
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error stack:', error.stack);
      setSubmitMessage({ type: "error", text: error.message || "Failed to submit enquiry." });
    } finally {
      setSubmitting(false);
    }
  };

  useHtmlPage({
    title: "Roomhy - List Your Property",
    bodyClass: "text-gray-800 flex flex-col min-h-screen",
    htmlAttrs: {
      lang: "en",
      class: "scroll-smooth"
    },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    bases: [],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" }
    ],
    styles: [],
    scripts: [
      { src: "https://cdn.tailwindcss.com" },
      { src: "https://unpkg.com/lucide@latest" }
    ],
    inlineScripts: []
  });

  return (
    <div className="html-page">
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-sm shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/website/index" className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Go back">
                <i data-lucide="chevron-left" className="w-6 h-6 text-gray-800"></i>
              </a>
              <a href="/website/index" className="flex-shrink-0">
                <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 w-25" />
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden lg:flex items-center space-x-6">
                <a href="/website/about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
                <a href="/website/contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
              </nav>

              <a href="#" className="flex-shrink-0 flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                <i data-lucide="building" className="w-4 h-4"></i>
                <span>My <span className="hidden sm:inline">Listings</span></span>
              </a>

              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <i data-lucide="menu" className="w-7 h-7 text-gray-800"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- COMPACT & STYLISH HEADER --- */}
      <div className="relative w-full py-10 px-6 overflow-hidden border-b border-stone-200/50" 
           style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #FDFCFB 50%, #F5F7FA 100%)' }}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/pinstripe.png")` }}>
          </div>

          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
            
            {/* MAIN HEADING */}
            <div className="flex items-center gap-4 mb-2">
              <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                List Your <span className="text-[#C5A059] font-serif italic font-medium">Property</span>
              </h1>
              <div className="h-[1px] w-8 bg-[#C5A059]/40 hidden md:block"></div>
            </div>

            {/* SUB-HEADING */}
            <p className="text-base md:text-lg text-stone-500 font-normal opacity-90 max-w-xl mx-auto">
              Reach thousands of verified students with a simple form
            </p>

            {/* Bottom Accent Dot */}
            <div className="mt-4 w-1.5 h-1.5 rounded-full bg-[#C5A059]/30"></div>
          </div>
        </div>

      <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 flex-grow">
        <div className="max-w-4xl mx-auto">

          {submitMessage && (
            <div className={`mb-4 p-4 rounded-lg ${submitMessage.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
              {submitMessage.text}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>

            <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <div className="flex items-center mb-6 border-b pb-4">
                <i data-lucide="clipboard-list" className="w-6 h-6 mr-3 text-blue-600"></i>
                <h2 className="text-xl font-semibold text-gray-800">Required Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" id="name" name="name" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter your name" value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="property_name" className="block text-sm font-medium text-gray-700 mb-1">Property Name <span className="text-red-500">*</span></label>
                  <input type="text" id="property_name" name="property_name" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter property name" value={formData.property_name} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="tenants_managed" className="block text-sm font-medium text-gray-700 mb-1">Number of Tenant Managed <span className="text-red-500">*</span></label>
                  <input type="number" id="tenants_managed" name="tenants_managed" min="0" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter number of tenants" value={formData.tenants_managed} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <select id="city" name="city" required className="w-full border border-gray-300 rounded-md px-4 py-3" value={formData.city} onChange={handleChange}>
                    <option value="">Select City</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="custom">+ Add Custom Location</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" id="phone" name="phone" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" id="country" name="country" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter country" value={formData.country} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                  <input type="text" id="contact_name" name="contact_name" required className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Enter contact person name" value={formData.contact_name} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="additional_message" className="block text-sm font-medium text-gray-700 mb-1">Additional Message (if any)</label>
                  <textarea id="additional_message" name="additional_message" rows="4" className="w-full border border-gray-300 rounded-md px-4 py-3" placeholder="Type additional message..." value={formData.additional_message} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button type="submit" disabled={submitting} className="w-full md:w-auto bg-blue-600 text-white font-semibold py-3 px-10 rounded-lg text-lg hover:bg-blue-700 transition-colors shadow-lg">
                <i data-lucide="send" className="w-5 h-5 inline mr-2"></i>
                <span>{submitting ? "Submitting..." : "Submit"}</span>
              </button>
              <p className="text-xs text-gray-500 mt-3">Your listing will be reviewed before going live.</p>
            </div>
          </form>
        </div>
      </main>

      <a href="/website/contact" className="fixed bottom-6 right-6 z-50 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-110">
        <i data-lucide="message-circle" className="w-8 h-8"></i>
      </a>

      <footer className="bg-gray-50 border-t border-gray-200 text-gray-700 py-10 mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png" alt="Roomhy Logo" className="h-10 mb-4" />
              <p className="text-sm text-gray-600">Discover Your Next Home, Together.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/website/contact" className="text-gray-600 hover:text-teal-600">Contact Us</a></li>
                <li><a href="/website/about" className="text-gray-600 hover:text-teal-600">About Us</a></li>
                <li><a href="/website/ourproperty" className="text-gray-600 hover:text-teal-600">Our Properties</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-teal-600">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-600 hover:text-teal-600">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Get in Touch</h4>
              <p className="text-sm text-gray-600"><i data-lucide="mail" className="w-4 h-4 inline mr-2"></i> team@roomhy.com</p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 Roomhy. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}



