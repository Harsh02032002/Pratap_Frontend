import React, { useState, useEffect } from "react";
import { 
  Globe, Eye, EyeOff, ArrowUp, ArrowDown, Edit3, Trash2, 
  Plus, Check, X, Loader2, Save, MapPin, Shield, Tags,
  Image as ImageIcon, HelpCircle, Layers, Settings, ChevronRight
} from "lucide-react";
import { fetchJson } from "../../utils/api";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageCompression";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function WebsiteEditor() {
  const [activeTab, setActiveTab] = useState("sections");
  const [loading, setLoading] = useState(false);

  // TAB 1: Layout Sections States
  const [selectedLayoutPage, setSelectedLayoutPage] = useState("home");
  const [layout, setLayout] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({ id: "", name: "", type: "", visible: true, content: {} });

  // TAB 2: SEO Pages States
  const [seoPages, setSeoPages] = useState([]);
  const [selectedSeoPage, setSelectedSeoPage] = useState(null);

  // TAB 3: Property Categories States
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // TAB 4: Cities & Areas States
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  // TAB 5: Amenities States
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch initial data based on active tab
  useEffect(() => {
    fetchTabData();
  }, [activeTab, selectedLayoutPage, selectedCity]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === "sections") {
        const res = await fetchJson(`/api/page-layouts/${selectedLayoutPage}`);
        if (res.success) {
          const sorted = res.data.sections.sort((a, b) => a.order - b.order);
          setLayout({ ...res.data, sections: sorted });
        }
      } else if (activeTab === "seo") {
        const res = await fetchJson("/api/seo/pages");
        if (res.success) setSeoPages(res.data);
      } else if (activeTab === "categories") {
        const res = await fetchJson("/api/property-types");
        if (res.success) setCategories(res.data);
      } else if (activeTab === "locations") {
        const resCities = await fetchJson("/api/locations/cities");
        if (resCities.success) {
          setCities(resCities.data);
          const currentCity = selectedCity || resCities.data[0];
          if (currentCity) {
            setSelectedCity(currentCity);
            const resAreas = await fetchJson(`/api/locations/areas/city/${currentCity.name}`);
            if (resAreas.success) setAreas(resAreas.data);
          }
        }
      } else if (activeTab === "amenities") {
        const res = await fetchJson("/api/amenities");
        if (res.success) setAmenities(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load editor data.");
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper
  const handleImageUpload = async (e, onComplete) => {
    const file = e.target.files[0];
    if (!file) return;

    // Resize/compress before upload — camera originals are 3-12MB.
    const optimizedFile = await compressImage(file);
    const formData = new FormData();
    formData.append("image", optimizedFile);

    setUploadingImage(true);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.url) {
        onComplete(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ==================== LAYOUT SECTIONS WORKFLOWS ====================
  const handleToggleSection = async (sectionId) => {
    if (!layout) return;
    const updatedSections = layout.sections.map(s => 
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    setLayout({ ...layout, sections: updatedSections });
    await saveLayout(updatedSections);
  };

  const handleMoveSection = async (index, direction) => {
    if (!layout) return;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= layout.sections.length) return;

    const updatedSections = [...layout.sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[nextIndex];
    updatedSections[nextIndex] = temp;

    const ordered = updatedSections.map((s, idx) => ({ ...s, order: idx }));
    setLayout({ ...layout, sections: ordered });
    await saveLayout(ordered);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!layout || !newSection.id || !newSection.name) return;

    const formattedSection = {
      ...newSection,
      order: layout.sections.length,
      content: {
        title: newSection.name,
        subtitle: "Custom content description details."
      }
    };

    const updatedSections = [...layout.sections, formattedSection];
    setLayout({ ...layout, sections: updatedSections });
    setIsAddSectionModalOpen(false);
    setNewSection({ id: "", name: "", type: "", visible: true, content: {} });
    await saveLayout(updatedSections);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!layout) return;
    if (!window.confirm("Are you sure you want to delete this section from the page?")) return;

    const updatedSections = layout.sections.filter(s => s.id !== sectionId);
    setLayout({ ...layout, sections: updatedSections });
    await saveLayout(updatedSections);
  };

  const saveLayout = async (sectionsToSave) => {
    try {
      const res = await fetchJson(`/api/page-layouts/${selectedLayoutPage}`, {
        method: "PUT",
        body: JSON.stringify({ sections: sectionsToSave })
      });
      if (res.success) {
        toast.success("Section layout saved!");
      }
    } catch (error) {
      toast.error("Failed to save layout.");
    }
  };

  const handleEditSectionContent = (section) => {
    setEditingSection({ ...section });
  };

  const handleUpdateSectionContentField = (key, val) => {
    setEditingSection(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [key]: val
      }
    }));
  };

  const handleUpdateListField = (key, index, itemKey, val) => {
    setEditingSection(prev => {
      const listCopy = [...(prev.content[key] || [])];
      listCopy[index] = {
        ...listCopy[index],
        [itemKey]: val
      };
      return {
        ...prev,
        content: {
          ...prev.content,
          [key]: listCopy
        }
      };
    });
  };

  const handleAddListItem = (key) => {
    setEditingSection(prev => {
      const listCopy = [...(prev.content[key] || [])];
      let newObj = { title: "", description: "", image: "" };
      
      if (prev.id === "testimonials") {
        newObj = { name: "", role: "", text: "", avatar: "", rating: "5" };
      } else if (prev.id === "offerings") {
        newObj = { title: "", category: "", description: "", image: "" };
      }

      listCopy.push(newObj);
      return {
        ...prev,
        content: {
          ...prev.content,
          [key]: listCopy
        }
      };
    });
  };

  const handleRemoveListItem = (key, index) => {
    setEditingSection(prev => {
      const listCopy = (prev.content[key] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        content: {
          ...prev.content,
          [key]: listCopy
        }
      };
    });
  };

  const handleSaveSectionContent = async () => {
    const updatedSections = layout.sections.map(s => 
      s.id === editingSection.id ? editingSection : s
    );
    setLayout({ ...layout, sections: updatedSections });
    setEditingSection(null);
    await saveLayout(updatedSections);
  };

  // ==================== SEO PAGES WORKFLOWS ====================
  const handleSaveSeo = async (e) => {
    e.preventDefault();
    if (!selectedSeoPage) return;

    try {
      const res = await fetchJson(`/api/seo/pages/register`, {
        method: "POST",
        body: JSON.stringify(selectedSeoPage)
      });
      if (res.success) {
        toast.success("SEO settings saved successfully!");
        setSeoPages(prev => prev.map(p => p.pageKey === res.data.pageKey ? res.data : p));
        setSelectedSeoPage(null);
      }
    } catch (error) {
      toast.error("Failed to save SEO settings.");
    }
  };

  // ==================== CATEGORIES WORKFLOWS ====================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      const method = selectedCategory._id ? "PUT" : "POST";
      const url = selectedCategory._id ? `/api/property-types/${selectedCategory._id}` : "/api/property-types";
      
      const res = await fetchJson(url, {
        method,
        body: JSON.stringify(selectedCategory)
      });
      
      if (res.success) {
        toast.success("Category saved!");
        setIsCategoryModalOpen(false);
        setSelectedCategory(null);
        fetchTabData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save category.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetchJson(`/api/property-types/${id}`, { method: "DELETE" });
      toast.success("Category deleted.");
      fetchTabData();
    } catch (error) {
      toast.error("Failed to delete category.");
    }
  };

  // ==================== CITIES & AREAS WORKFLOWS ====================
  const handleSaveCity = async (e) => {
    e.preventDefault();
    if (!editingCity) return;

    try {
      const method = editingCity._id ? "PUT" : "POST";
      const url = editingCity._id ? `/api/locations/cities/${editingCity._id}` : "/api/locations/cities";

      const res = await fetchJson(url, {
        method,
        body: JSON.stringify(editingCity)
      });

      if (res.success) {
        toast.success("City saved!");
        setIsCityModalOpen(false);
        setEditingCity(null);
        fetchTabData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save city.");
    }
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm("Deleting city will also delete all associated areas. Continue?")) return;
    try {
      await fetchJson(`/api/locations/cities/${id}`, { method: "DELETE" });
      toast.success("City deleted successfully.");
      setSelectedCity(null);
      fetchTabData();
    } catch (error) {
      toast.error("Failed to delete city.");
    }
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!editingArea) return;

    try {
      const method = editingArea._id ? "PUT" : "POST";
      const url = editingArea._id ? `/api/locations/areas/${editingArea._id}` : "/api/locations/areas";

      const body = { ...editingArea };
      if (!body._id) body.cityId = selectedCity._id;

      const res = await fetchJson(url, {
        method,
        body: JSON.stringify(body)
      });

      if (res.success) {
        toast.success("Area saved!");
        setIsAreaModalOpen(false);
        setEditingArea(null);
        fetchTabData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save area.");
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm("Are you sure you want to delete this area?")) return;
    try {
      await fetchJson(`/api/locations/areas/${id}`, { method: "DELETE" });
      toast.success("Area deleted successfully.");
      fetchTabData();
    } catch (error) {
      toast.error("Failed to delete area.");
    }
  };

  // ==================== AMENITIES WORKFLOWS ====================
  const handleSaveAmenity = async (e) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    try {
      const method = selectedAmenity._id ? "PUT" : "POST";
      const url = selectedAmenity._id ? `/api/amenities/${selectedAmenity._id}` : "/api/amenities";

      const res = await fetchJson(url, {
        method,
        body: JSON.stringify(selectedAmenity)
      });

      if (res.success) {
        toast.success("Amenity saved!");
        setIsAmenityModalOpen(false);
        setSelectedAmenity(null);
        fetchTabData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save amenity.");
    }
  };

  const handleDeleteAmenity = async (id) => {
    if (!window.confirm("Are you sure you want to delete this amenity?")) return;
    try {
      await fetchJson(`/api/amenities/${id}`, { method: "DELETE" });
      toast.success("Amenity deleted successfully.");
      fetchTabData();
    } catch (error) {
      toast.error("Failed to delete amenity.");
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-700">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-80 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none text-white">Roomhy CMS</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Website Manager</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {[
            { id: "sections", label: "Page Sections Layout", icon: Layers },
            { id: "seo", label: "SEO Metadata & Tags", icon: Globe },
            { id: "categories", label: "Property Categories", icon: Tags },
            { id: "locations", label: "Locations CRUD", icon: MapPin },
            { id: "amenities", label: "Amenities Database", icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between transition-all group",
                  active 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4.5 h-4.5 transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-500")} />
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", active ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5")} />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 2. RIGHT WORKSPACE */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-10 py-6 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {activeTab === "sections" && "Layout Sections Editor"}
              {activeTab === "seo" && "SEO Metadata Controller"}
              {activeTab === "categories" && "Property Types Master"}
              {activeTab === "locations" && "Location Database Master"}
              {activeTab === "amenities" && "Amenities Inventory Manager"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {activeTab === "sections" && "Manage visibility, ordering and text sections on pages"}
              {activeTab === "seo" && "Configure crawler keywords, page titles, and description tags"}
              {activeTab === "categories" && "Perform CRUD operations on property styles (PG, Hostels, etc.)"}
              {activeTab === "locations" && "Manage verified cities and localities in India"}
              {activeTab === "amenities" && "Configure safety, comfort, and luxury listing amenity lists"}
            </p>
          </div>
        </header>

        {/* Content Box */}
        <div className="p-10 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Database Matrix...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* TAB 1: SECTIONS */}
              {activeTab === "sections" && (
                <>
                  {/* Left Column: Sections List */}
                  <div className="lg:col-span-6 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">Dynamic Section Layout</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add, delete or reorder page segments</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select 
                          value={selectedLayoutPage} 
                          onChange={e => setSelectedLayoutPage(e.target.value)}
                          className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="home">Home Page</option>
                          <option value="about">About Page</option>
                          <option value="contact">Contact Page</option>
                          <option value="list-property">List Property Page</option>
                          <option value="faq">FAQ Page</option>
                          <option value="privacy">Privacy Policy</option>
                          <option value="terms">Terms & Conditions</option>
                          <option value="login">Login Page</option>
                          <option value="register">Signup Page</option>
                          <option value="our-property">Property Listing Page</option>
                          <option value="property-details">Property Details Page</option>
                        </select>
                        <button 
                          onClick={() => setIsAddSectionModalOpen(true)}
                          className="bg-indigo-600 text-white rounded-xl p-2.5 hover:bg-indigo-700 transition-colors shadow-md"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {layout?.sections.map((section, idx) => (
                        <div 
                          key={section.id} 
                          className={cn(
                            "flex items-center justify-between p-5 rounded-2xl border transition-all",
                            section.visible 
                              ? "bg-slate-50/50 border-slate-100" 
                              : "bg-slate-100/50 border-dashed border-slate-200 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-slate-300 w-6">#{idx + 1}</span>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-700">{section.name}</h4>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">{section.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Order Controls */}
                            <button 
                              disabled={idx === 0}
                              onClick={() => handleMoveSection(idx, "up")}
                              className="p-2 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button 
                              disabled={idx === layout.sections.length - 1}
                              onClick={() => handleMoveSection(idx, "down")}
                              className="p-2 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>

                            {/* Visibility Toggle */}
                            <button 
                              onClick={() => handleToggleSection(section.id)}
                              className={cn(
                                "p-2 rounded-lg border transition-colors",
                                section.visible 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                                  : "bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100"
                              )}
                            >
                              {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            {/* Edit Content */}
                            <button 
                              onClick={() => handleEditSectionContent(section)}
                              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Section */}
                            <button 
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Section Content Editor Form */}
                  <div className="lg:col-span-6">
                    {editingSection ? (
                      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-800">Edit Section Content</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Editing {editingSection.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleSaveSectionContent}
                              className="bg-indigo-600 text-white rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                            <button 
                              onClick={() => setEditingSection(null)}
                              className="bg-slate-50 text-slate-400 rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors border"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {Object.keys(editingSection.content).map(key => {
                            const value = editingSection.content[key];
                            
                            // Check if field is a nested list/array
                            if (Array.isArray(value)) {
                              return (
                                <div key={key} className="space-y-4 border-t pt-4">
                                  <div className="flex justify-between items-center">
                                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">{key} Items List</label>
                                    <button 
                                      type="button"
                                      onClick={() => handleAddListItem(key)}
                                      className="text-xs bg-indigo-50 text-indigo-600 rounded-lg px-3 py-1.5 font-black hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Add Card/Item
                                    </button>
                                  </div>

                                  <div className="space-y-4">
                                    {value.map((item, idx) => (
                                      <div key={idx} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 relative space-y-3">
                                        <button 
                                          type="button"
                                          onClick={() => handleRemoveListItem(key, idx)}
                                          className="absolute top-4 right-4 text-rose-500 hover:text-rose-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                        
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b pb-1">
                                          Item #{idx + 1}
                                        </span>

                                        {Object.keys(item).map(itemField => (
                                          <div key={itemField} className="space-y-1">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{itemField}</label>
                                            {itemField.toLowerCase().includes("image") || itemField.toLowerCase().includes("avatar") ? (
                                              <div className="flex gap-3">
                                                <input 
                                                  type="text" 
                                                  value={item[itemField] || ""}
                                                  onChange={e => handleUpdateListField(key, idx, itemField, e.target.value)}
                                                  placeholder="Image URL" 
                                                  className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 flex-1 outline-none"
                                                />
                                                <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors">
                                                  Upload
                                                  <input 
                                                    type="file" accept="image/*" className="hidden" 
                                                    onChange={e => handleImageUpload(e, (url) => handleUpdateListField(key, idx, itemField, url))} 
                                                  />
                                                </label>
                                              </div>
                                            ) : (
                                              <textarea 
                                                rows={itemField === "description" || itemField === "text" ? 2 : 1}
                                                value={item[itemField] || ""}
                                                onChange={e => handleUpdateListField(key, idx, itemField, e.target.value)}
                                                className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 w-full outline-none"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            // Normal input field rendering
                            return (
                              <div key={key} className="space-y-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">{key}</label>
                                {key.toLowerCase().includes("image") ? (
                                  <div className="space-y-3">
                                    {value && (
                                      <img 
                                        src={value} 
                                        className="w-full h-32 object-cover rounded-xl border" 
                                        alt="Preview" 
                                      />
                                    )}
                                    <div className="flex gap-4">
                                      <input 
                                        type="text" 
                                        value={value || ""} 
                                        onChange={e => handleUpdateSectionContentField(key, e.target.value)}
                                        placeholder="Image URL" 
                                        className="bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-800 flex-1 outline-none"
                                      />
                                      <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors">
                                        {uploadingImage ? "Uploading..." : "Upload File"}
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={e => handleImageUpload(e, (url) => handleUpdateSectionContentField(key, url))} 
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <textarea 
                                    rows={key === "subtitle" || key === "description" || key === "address" ? 3 : 1}
                                    value={value || ""}
                                    onChange={e => handleUpdateSectionContentField(key, e.target.value)}
                                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center py-20 min-h-[300px]">
                        <HelpCircle className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                        <h4 className="text-sm font-extrabold text-slate-700">No Section Selected</h4>
                        <p className="text-xs text-slate-400 font-bold max-w-xs mt-1">Select a section in the left list matrix to modify its content values.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: SEO PAGES */}
              {activeTab === "seo" && (
                <>
                  {/* Left Column: Pages List */}
                  <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">SEO Index</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dynamic meta data records</p>
                    </div>

                    <div className="space-y-3">
                      {seoPages.map(page => (
                        <button
                          key={page._id}
                          onClick={() => setSelectedSeoPage({ ...page })}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                            selectedSeoPage?.pageKey === page.pageKey 
                              ? "bg-indigo-50/50 border-indigo-200" 
                              : "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md"
                          )}
                        >
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-700">{page.pageName}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{page.pageKey}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 px-2.5 py-1 rounded-lg uppercase group-hover:border-indigo-200 transition-colors">
                              Edit
                            </span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${page.isIndexed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                              {page.isIndexed ? '✓ Indexed' : '✗ NoIndex'}
                            </span>
                          </div>
                        </button>
                      ))}
                      
                      <button 
                        onClick={() => setSelectedSeoPage({ pageKey: "", pageName: "", metaTitle: "", metaDescription: "", metaKeywords: "", isIndexed: true })}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-black uppercase text-[10px] hover:border-indigo-600 hover:text-indigo-600 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Page Meta Entry
                      </button>
                    </div>
                  </div>

                  {/* Right Column: SEO Form */}
                  <div className="lg:col-span-7">
                    {selectedSeoPage ? (
                      <form onSubmit={handleSaveSeo} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">
                            {selectedSeoPage._id ? "Edit SEO Meta Tags" : "Add Page SEO Meta"}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuring search crawler headers</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Page Name</label>
                            <input 
                              type="text" 
                              required
                              value={selectedSeoPage.pageName} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, pageName: e.target.value })}
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Page Key (e.g. home, about)</label>
                            <input 
                              type="text" 
                              required
                              value={selectedSeoPage.pageKey} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, pageKey: e.target.value })}
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Meta Title</label>
                            <input 
                              type="text" 
                              value={selectedSeoPage.metaTitle || ""} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, metaTitle: e.target.value })}
                              placeholder="Search Title (ideal: 50-60 characters)"
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Meta Description</label>
                            <textarea 
                              rows={3}
                              value={selectedSeoPage.metaDescription || ""} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, metaDescription: e.target.value })}
                              placeholder="Search snippet summary (ideal: 150-160 characters)"
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Keywords</label>
                            <input 
                              type="text" 
                              value={selectedSeoPage.metaKeywords || ""} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, metaKeywords: e.target.value })}
                              placeholder="Comma separated values"
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          {/* Dynamic Variable Helper — shown for property pages */}
                          {(selectedSeoPage.pageKey === 'our-property' || selectedSeoPage.pageKey === 'property-details') && (
                            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600 text-xs font-black">{`{ }`}</span>
                                </div>
                                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider">Dynamic Template Variables</h4>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                Use these variables in Meta Title, Description & Keywords. They auto-replace with real data at render time.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(selectedSeoPage.pageKey === 'our-property' ? [
                                  { var: '{city}', desc: 'City name' },
                                  { var: '{area}', desc: 'Area/locality' },
                                  { var: '{type}', desc: 'PG/Hostel/Co-living' },
                                  { var: '{count}', desc: 'Total properties' },
                                ] : [
                                  { var: '{propertyName}', desc: 'Property name' },
                                  { var: '{city}', desc: 'City name' },
                                  { var: '{area}', desc: 'Area/locality' },
                                  { var: '{type}', desc: 'Property type' },
                                  { var: '{price}', desc: 'Monthly rent' },
                                  { var: '{gender}', desc: 'Boys/Girls/Unisex' },
                                ]).map(v => (
                                  <button
                                    key={v.var}
                                    type="button"
                                    onClick={() => {
                                      // Copy variable to clipboard
                                      navigator.clipboard?.writeText(v.var);
                                    }}
                                    className="group flex items-center gap-1.5 bg-white border border-indigo-100 rounded-lg px-3 py-1.5 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
                                    title={`Click to copy ${v.var}`}
                                  >
                                    <code className="text-[10px] font-black text-indigo-600 group-hover:text-indigo-800">{v.var}</code>
                                    <span className="text-[9px] text-slate-400 font-bold">— {v.desc}</span>
                                  </button>
                                ))}
                              </div>
                              <p className="text-[9px] text-slate-400 font-bold italic">💡 Example: <code className="bg-white px-1.5 py-0.5 rounded text-indigo-600 font-black">{selectedSeoPage.pageKey === 'property-details' ? '{propertyName} in {city} - Book on Roomhy' : 'Best {type} in {city} - Roomhy'}</code></p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Canonical URL</label>
                            <input 
                              type="text" 
                              value={selectedSeoPage.canonicalUrl || ""} 
                              onChange={e => setSelectedSeoPage({ ...selectedSeoPage, canonicalUrl: e.target.value })}
                              placeholder="https://roomhy.com/..."
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Robots Directive</label>
                            <select
                              value={selectedSeoPage.robots || (selectedSeoPage.isIndexed ? 'index, follow' : 'noindex, nofollow')}
                              onChange={e => {
                                const val = e.target.value;
                                setSelectedSeoPage({ 
                                  ...selectedSeoPage, 
                                  robots: val, 
                                  isIndexed: val.includes('index') && !val.includes('noindex') 
                                });
                              }}
                              className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                            >
                              <option value="index, follow">index, follow — Allow crawling &amp; indexing</option>
                              <option value="noindex, follow">noindex, follow — Follow links but don't index page</option>
                              <option value="index, nofollow">index, nofollow — Index but don't follow links</option>
                              <option value="noindex, nofollow">noindex, nofollow — Block crawling &amp; indexing</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3 md:col-span-2 bg-slate-50 border border-slate-100 rounded-xl py-3 px-4">
                            <input 
                              type="checkbox" 
                              checked={selectedSeoPage.isIndexed} 
                              onChange={e => {
                                const checked = e.target.checked;
                                setSelectedSeoPage({ 
                                  ...selectedSeoPage, 
                                  isIndexed: checked,
                                  robots: checked ? 'index, follow' : 'noindex, nofollow'
                                });
                              }}
                              id="isIndexed"
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <div>
                              <label htmlFor="isIndexed" className="text-xs font-black text-slate-700 cursor-pointer block">Allow Search Engine Indexing</label>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">Syncs with the Robots Directive above. Uncheck to hide this page from Google.</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                          <button 
                            type="submit"
                            className="bg-indigo-600 text-white rounded-xl py-3.5 px-6 text-xs font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" /> Save SEO Settings
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSelectedSeoPage(null)}
                            className="bg-slate-50 text-slate-400 rounded-xl py-3.5 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors border"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center py-20 min-h-[300px]">
                        <HelpCircle className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                        <h4 className="text-sm font-extrabold text-slate-700">No Page Selected</h4>
                        <p className="text-xs text-slate-400 font-bold max-w-xs mt-1">Select an SEO Page entry on the left to edit metadata parameters.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 3: CATEGORIES */}
              {activeTab === "categories" && (
                <div className="col-span-full space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                      <h3 className="text-base font-black text-slate-800">Property Categories Management</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure property types, descriptions & imagery</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedCategory({ title: "", category: "", description: "", images: [], status: "Active" }); setIsCategoryModalOpen(true); }}
                      className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => (
                      <div key={cat._id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl flex flex-col justify-between group hover:-translate-y-1.5 transition-all">
                        <div>
                          {cat.images && cat.images[0] ? (
                            <div className="h-44 relative">
                              <img src={cat.images[0]} className="w-full h-full object-cover" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                              <div className="absolute bottom-4 left-4">
                                <h4 className="text-lg font-extrabold text-white">{cat.title}</h4>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">{cat.category}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-44 bg-slate-50 flex items-center justify-center text-slate-300 relative">
                              <ImageIcon className="w-12 h-12" />
                              <div className="absolute bottom-4 left-4">
                                <h4 className="text-lg font-extrabold text-slate-800">{cat.title}</h4>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cat.category}</span>
                              </div>
                            </div>
                          )}
                          <div className="p-6 space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed font-bold line-clamp-3">{cat.description}</p>
                            <span className={cn(
                              "inline-block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border",
                              cat.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                            )}>
                              {cat.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 border-t border-slate-50 flex justify-end gap-2 bg-slate-50/50">
                          <button 
                            onClick={() => { setSelectedCategory({ ...cat }); setIsCategoryModalOpen(true); }}
                            className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-rose-600 border border-slate-100 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: LOCATIONS */}
              {activeTab === "locations" && (
                <div className="col-span-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Cities Panel */}
                  <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">Cities</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Geographic urban hubs</p>
                      </div>
                      <button 
                        onClick={() => { setEditingCity({ name: "", state: "", status: "Active" }); setIsCityModalOpen(true); }}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl text-xs font-black shadow-md hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cities.map(city => (
                        <div 
                          key={city._id}
                          onClick={() => setSelectedCity(city)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group",
                            selectedCity?._id === city._id 
                              ? "bg-indigo-50/50 border-indigo-200" 
                              : "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                              {city.imageUrl && <img src={city.imageUrl} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-700">{city.name}</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{city.state}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => { setEditingCity({ ...city }); setIsCityModalOpen(true); }}
                              className="p-1.5 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-indigo-600 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCity(city._id)}
                              className="p-1.5 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Areas Panel */}
                  <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">
                          Areas in {selectedCity?.name || "..."}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Localities, zones & landmarks</p>
                      </div>
                      {selectedCity && (
                        <button 
                          onClick={() => { setEditingArea({ name: "", cityName: selectedCity.name, status: "Active" }); setIsAreaModalOpen(true); }}
                          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add Area
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {areas.map(area => (
                        <div key={area._id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                              {area.imageUrl && <img src={area.imageUrl} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-700">{area.name}</h4>
                              <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded uppercase mt-1 inline-block">{area.status}</span>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100/60">
                            <button 
                              onClick={() => { setEditingArea({ ...area }); setIsAreaModalOpen(true); }}
                              className="p-1.5 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-indigo-600 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteArea(area._id)}
                              className="p-1.5 rounded-lg bg-white text-slate-400 border border-slate-100 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {areas.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                          No Areas found in {selectedCity?.name || "..."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AMENITIES */}
              {activeTab === "amenities" && (
                <div className="col-span-full space-y-6">
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                      <h3 className="text-base font-black text-slate-800">Amenities Database</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure amenities list, icons & category specs</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedAmenity({ name: "", icon: "check", category: "basic", description: "", status: "Active" }); setIsAmenityModalOpen(true); }}
                      className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Amenity
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {amenities.map(a => (
                      <div key={a._id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl flex flex-col justify-between group hover:-translate-y-1.5 transition-all">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            {a.iconSvg ? (
                              <div 
                                className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border p-2 shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[1.5]"
                                dangerouslySetInnerHTML={{ __html: a.iconSvg }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border shrink-0">
                                {a.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-400 px-2 py-0.5 rounded tracking-widest">
                              {a.category}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-800">{a.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold leading-normal mt-2 line-clamp-3">{a.description || "No description provided."}</p>
                        </div>

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border",
                            a.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                            {a.status}
                          </span>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => { setSelectedAmenity({ ...a }); setIsAmenityModalOpen(true); }}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 border border-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAmenity(a._id)}
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 border border-slate-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* ADD SECTION MODAL */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <form onSubmit={handleAddSection} className="bg-white rounded-[2rem] w-full max-w-md p-8 border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Add Page Section</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure layout segment properties</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Section ID (slug, lowercase)</label>
                <input 
                  type="text" required
                  placeholder="e.g. custom-banner, contact-form"
                  value={newSection.id}
                  onChange={e => setNewSection({ ...newSection, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Section Display Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Office Locations"
                  value={newSection.name}
                  onChange={e => setNewSection({ ...newSection, name: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Section Type</label>
                <input 
                  type="text" required
                  placeholder="e.g. banner, contact, team"
                  value={newSection.type}
                  onChange={e => setNewSection({ ...newSection, type: e.target.value.toLowerCase() })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
              <button 
                type="button" onClick={() => setIsAddSectionModalOpen(false)}
                className="bg-slate-50 text-slate-400 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form onSubmit={handleSaveCategory} className="bg-white rounded-[2rem] w-full max-w-xl p-8 border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {selectedCategory._id ? "Edit Category" : "Add Property Category"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure property type data</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Title</label>
                  <input 
                    type="text" required
                    value={selectedCategory.title}
                    onChange={e => setSelectedCategory({ ...selectedCategory, title: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Category Code (e.g. pg, hostel)</label>
                  <input 
                    type="text" required
                    value={selectedCategory.category}
                    onChange={e => setSelectedCategory({ ...selectedCategory, category: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3} required
                  value={selectedCategory.description}
                  onChange={e => setSelectedCategory({ ...selectedCategory, description: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Cover Image URL</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={selectedCategory.images[0] || ""}
                    onChange={e => setSelectedCategory({ ...selectedCategory, images: [e.target.value] })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 flex-1 outline-none"
                  />
                  <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" accept="image/*" className="hidden" 
                      onChange={e => handleImageUpload(e, (url) => setSelectedCategory({ ...selectedCategory, images: [url] }))} 
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={selectedCategory.status}
                  onChange={e => setSelectedCategory({ ...selectedCategory, status: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Category
              </button>
              <button 
                type="button" onClick={() => setIsCategoryModalOpen(false)}
                className="bg-slate-50 text-slate-400 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CITY MODAL */}
      {isCityModalOpen && editingCity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form onSubmit={handleSaveCity} className="bg-white rounded-[2rem] w-full max-w-xl p-8 border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingCity._id ? "Edit City" : "Add City"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure city hub details</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">City Name</label>
                  <input 
                    type="text" required
                    value={editingCity.name}
                    onChange={e => setEditingCity({ ...editingCity, name: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">State</label>
                  <input 
                    type="text" required
                    value={editingCity.state}
                    onChange={e => setEditingCity({ ...editingCity, state: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Banner Image URL</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={editingCity.imageUrl || ""}
                    onChange={e => setEditingCity({ ...editingCity, imageUrl: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 flex-1 outline-none"
                  />
                  <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" accept="image/*" className="hidden" 
                      onChange={e => handleImageUpload(e, (url) => setEditingCity({ ...editingCity, imageUrl: url }))} 
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={editingCity.status}
                  onChange={e => setEditingCity({ ...editingCity, status: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save City
              </button>
              <button 
                type="button" onClick={() => setIsCityModalOpen(false)}
                className="bg-slate-50 text-slate-400 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AREA MODAL */}
      {isAreaModalOpen && editingArea && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form onSubmit={handleSaveArea} className="bg-white rounded-[2rem] w-full max-w-xl p-8 border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingArea._id ? "Edit Area" : "Add Area"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure locality data in {selectedCity?.name}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Area Name (e.g. Talwandi)</label>
                <input 
                  type="text" required
                  value={editingArea.name}
                  onChange={e => setEditingArea({ ...editingArea, name: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Area Photo URL</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={editingArea.imageUrl || ""}
                    onChange={e => setEditingArea({ ...editingArea, imageUrl: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 flex-1 outline-none"
                  />
                  <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors">
                    {uploadingImage ? "Uploading..." : "Upload File"}
                    <input 
                      type="file" accept="image/*" className="hidden" 
                      onChange={e => handleImageUpload(e, (url) => setEditingArea({ ...editingArea, imageUrl: url }))} 
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={editingArea.status}
                  onChange={e => setEditingArea({ ...editingArea, status: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Area
              </button>
              <button 
                type="button" onClick={() => setIsAreaModalOpen(false)}
                className="bg-slate-50 text-slate-400 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AMENITY MODAL */}
      {isAmenityModalOpen && selectedAmenity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form onSubmit={handleSaveAmenity} className="bg-white rounded-[2rem] w-full max-w-xl p-8 border border-slate-100 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                {selectedAmenity._id ? "Edit Amenity" : "Add Amenity"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure amenity database details</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Amenity Name</label>
                  <input 
                    type="text" required
                    value={selectedAmenity.name}
                    onChange={e => setSelectedAmenity({ ...selectedAmenity, name: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Category</label>
                  <select 
                    value={selectedAmenity.category}
                    onChange={e => setSelectedAmenity({ ...selectedAmenity, category: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="basic">Basic</option>
                    <option value="comfort">Comfort</option>
                    <option value="luxury">Luxury</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Icon Tag (e.g. wifi, car, tv)</label>
                <input 
                  type="text" 
                  value={selectedAmenity.icon || ""}
                  onChange={e => setSelectedAmenity({ ...selectedAmenity, icon: e.target.value })}
                  placeholder="ac, fan, utensils, car, tv, bed, etc."
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Custom SVG Icon Markup</label>
                <div className="flex gap-4">
                  <textarea 
                    rows={4}
                    value={selectedAmenity.iconSvg || ""}
                    onChange={e => setSelectedAmenity({ ...selectedAmenity, iconSvg: e.target.value })}
                    placeholder="<svg ...> ... </svg>"
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-mono text-slate-800 flex-1 outline-none"
                  />
                  <label className="bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors h-fit select-none shrink-0">
                    Upload SVG File
                    <input 
                      type="file" accept=".svg" className="hidden" 
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setSelectedAmenity({ ...selectedAmenity, iconSvg: event.target.result });
                          };
                          reader.readAsText(file);
                        }
                      }} 
                    />
                  </label>
                </div>
                <p className="text-[9px] font-bold text-slate-400">Pasted code or uploaded .svg file will render dynamically on the property pages.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3}
                  value={selectedAmenity.description}
                  onChange={e => setSelectedAmenity({ ...selectedAmenity, description: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={selectedAmenity.status}
                  onChange={e => setSelectedAmenity({ ...selectedAmenity, status: e.target.value })}
                  className="bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-800 w-full outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Amenity
              </button>
              <button 
                type="button" onClick={() => setIsAmenityModalOpen(false)}
                className="bg-slate-50 text-slate-400 rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest hover:bg-slate-100 border"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
