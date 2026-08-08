import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  MapPin, Building2, Users, Home, X,
  Zap, ShieldCheck, Loader2,
  CheckCircle2, Save, Info, Clock, User, Eye, LayoutGrid, Pencil, RefreshCw,
  Mail, Phone, Calendar, Fingerprint, Briefcase, Heart, MessageSquare, AlertCircle, ChevronDown, Camera, FileText
} from "lucide-react";
import { getApiBase, fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";
import { PageHeader } from "../../components/superadmin/PageHeader";
import Tesseract from 'tesseract.js';

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── Shared Components ────────────────────────────────────────────────────────

const FormField = ({ label, value, onChange, placeholder, type = "text", suffix, prefix, className, list, required, error }) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className={cn(
      "flex items-center bg-slate-50 border rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all",
      error ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50/30" : "border-slate-100 focus-within:border-blue-200"
    )}>
      {prefix && <span className="text-[10px] font-black text-slate-400 mr-2">{prefix}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        list={list}
        className="w-full bg-transparent text-[10px] font-bold text-slate-800 outline-none placeholder:text-slate-300"
      />
      {suffix && <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-tight">{suffix}</span>}
    </div>
    {error && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest">{error}</span>}
  </div>
);

const FormSelect = ({ label, value, onChange, options, placeholder, className, required, error }) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange}
        className={cn(
          "w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-800 outline-none transition-all appearance-none cursor-pointer",
          error ? "border-rose-300 bg-rose-50/30 ring-4 ring-rose-500/5" : "border-slate-100 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5"
        )}
      >
        <option value="" disabled>{placeholder || `Select ${label}`}</option>
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
            {typeof opt === 'object' ? opt.label : opt}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
    {error && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest">{error}</span>}
  </div>
);

// ─── Custom Date Picker ───────────────────────────────────────────────────────

const CustomDatePicker = ({ label, value, onChange, required, error, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 10 - i);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleDateChange = (type, val) => {
    const current = value ? value.split('-') : ["1995", "01", "01"];
    let [y, m, d] = current;
    if (type === 'y') y = val;
    if (type === 'm') m = val;
    if (type === 'd') d = val;
    onChange(`${y}-${m}-${d}`);
  };

  const selectedDate = value ? value.split('-') : ["", "", ""];

  return (
    <div className="flex flex-col relative">
      <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between bg-slate-50 border rounded-xl px-4 py-2.5 cursor-pointer transition-all",
          isOpen ? "bg-white border-blue-200 ring-4 ring-blue-500/5" : "border-slate-100 hover:bg-slate-100/50",
          error ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50/30" : ""
        )}
      >
        <span className={cn("text-[10px] font-bold", value ? "text-slate-800" : "text-slate-300")}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}
        </span>
        <Calendar size={14} className="text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] p-4 animate-in">
          <div className="flex items-center justify-between mb-4 gap-2">
            <select 
              value={selectedDate[0]} 
              onChange={(e) => handleDateChange('y', e.target.value)}
              className="flex-1 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
            >
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select 
              value={selectedDate[1]} 
              onChange={(e) => handleDateChange('m', e.target.value)}
              className="flex-1 bg-slate-50 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
            >
              <option value="">Month</option>
              {months.map((m, i) => <option key={m} value={(i+1).toString().padStart(2, '0')}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => {
              const day = (i + 1).toString().padStart(2, '0');
              const isActive = selectedDate[2] === day;
              return (
                <button
                  key={i}
                  onClick={() => {
                    handleDateChange('d', day);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "h-7 rounded-lg text-[9px] font-bold transition-all",
                    isActive ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {isOpen && <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />}
      {error && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest">{error}</span>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddTenant() {
  const navigate = useNavigate();
  const apiUrl = getApiBase();

  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Section 1: Basic Details
  const [basicDetails, setBasicDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    idProofType: "Aadhaar Card",
    idProofNumber: "",
    idProofFile: null,
    fatherName: "",
    permanentAddress: ""
  });

  // Aadhaar OCR states
  const [aadhaarFrontImage, setAadhaarFrontImage] = useState(null);
  const [aadhaarBackImage, setAadhaarBackImage] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  // Section 2: Room Assignment
  const [roomAssignment, setRoomAssignment] = useState({
    propertyId: "",
    building: "",
    floor: "",
    roomUnit: "",
    roomType: "",
    bed: "",
    rentAgreementType: "Standard"
  });

  // Section 3: Tenancy Details
  const [tenancyDetails, setTenancyDetails] = useState({
    rentAmount: "",
    finalRent: "",
    depositAmount: "",
    moveInDate: "",
    minStay: "11",
    noticePeriod: "30",
    rentDueDate: "5th of every month",
    paymentFrequency: "Monthly",
    lateFee: "",
    electricityUnitCost: "",
    advanceChargeAmount: ""
  });

  // Section 4: Additional Details
  const [additionalDetails, setAdditionalDetails] = useState({
    occupation: "",
    company: "",
    emergencyName: "",
    emergencyPhone: "",
    relationship: "",
    remarks: ""
  });

  const [confirmDetails, setConfirmDetails] = useState(false);

  useEffect(() => {
    // Load properties for dropdown
    const loadProperties = async () => {
      try {
        const data = await fetchJson("/api/properties?limit=1000");
        // API returns { success: true, properties: [...] }
        const propList = Array.isArray(data) ? data : Array.isArray(data?.properties) ? data.properties : [];
        setProperties(propList);
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => {
    // Load rooms for selected property
    if (!roomAssignment.propertyId) {
      setRooms([]);
      return;
    }
    const loadRooms = async () => {
      try {
        console.log("Fetching rooms for property ID:", roomAssignment.propertyId);
        const data = await fetchJson(`/api/rooms/property/${roomAssignment.propertyId}?unassigned=true`);
        
        let roomList = [];
        if (Array.isArray(data)) {
          roomList = data;
        } else if (data && Array.isArray(data.rooms)) {
          roomList = data.rooms;
        }
        
        // SMART FALLBACK: If no individual rooms added, generate from property roomTypes
        if (roomList.length === 0) {
          const selectedProp = properties.find(p => p._id === roomAssignment.propertyId);
          if (selectedProp && Array.isArray(selectedProp.roomTypes)) {
            selectedProp.roomTypes.forEach(rt => {
              const count = parseInt(rt.totalRooms) || 0;
              for (let i = 1; i <= count; i++) {
                roomList.push({ 
                  _id: `${rt.type}-${i}`, 
                  title: `${rt.type} - Room ${i}`,
                  type: rt.type 
                });
              }
            });
          }
        }
        
        console.log("Rooms loaded:", roomList.length);
        setRooms(roomList);
      } catch (err) {
        console.error("Failed to load rooms:", err);
        setRooms([]);
      }
    };
    loadRooms();
  }, [roomAssignment.propertyId]);

  useEffect(() => {
    if (roomAssignment.roomUnit && rooms.length > 0) {
      const selectedRoom = rooms.find(r => r.title === roomAssignment.roomUnit);
      console.log('Selected room:', selectedRoom);
      if (selectedRoom) {
        // Try multiple possible rent field names
        const rent = selectedRoom.price || selectedRoom.rent || selectedRoom.rentAmount || selectedRoom.monthlyRent;
        console.log('Found rent value:', rent);
        if (rent) {
          setTenancyDetails(prev => ({ ...prev, rentAmount: rent }));
        }
      }
    }
  }, [roomAssignment.roomUnit, rooms]);

  const validateForm = () => {
    const newErrors = {};
    if (!basicDetails.fullName) newErrors.fullName = "Name is required";
    if (!basicDetails.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(basicDetails.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!basicDetails.phone) {
      newErrors.phone = "Phone is required";
    } else if (basicDetails.phone.replace(/[^0-9]/g, "").length < 10) {
      newErrors.phone = "Phone must be at least 10 digits";
    }
    
    if (!basicDetails.dob) newErrors.dob = "Date of Birth is required";
    if (!basicDetails.gender) newErrors.gender = "Gender is required";
    if (!basicDetails.idProofNumber) newErrors.idProofNumber = "ID Proof No is required";
    if (!basicDetails.idProofFile) newErrors.idProofFile = "Proof upload is required";

    if (!roomAssignment.propertyId) newErrors.propertyId = "Property is required";
    if (!roomAssignment.building) newErrors.building = "Building/Block is required";
    if (!roomAssignment.floor) newErrors.floor = "Floor is required";
    if (!roomAssignment.roomUnit) newErrors.roomUnit = "Room is required";
    if (!roomAssignment.rentAgreementType) newErrors.rentAgreementType = "Agreement type is required";

    if (!tenancyDetails.rentAmount) newErrors.rentAmount = "Rent is required";
    if (!tenancyDetails.depositAmount) newErrors.depositAmount = "Deposit is required";
    if (!tenancyDetails.moveInDate) newErrors.moveInDate = "Move-in date is required";
    if (!tenancyDetails.paymentFrequency) newErrors.paymentFrequency = "Payment frequency is required";

    if (!additionalDetails.emergencyName) newErrors.emergencyName = "Emergency name is required";
    if (!additionalDetails.emergencyPhone) {
      newErrors.emergencyPhone = "Emergency phone is required";
    } else if (additionalDetails.emergencyPhone.replace(/[^0-9]/g, "").length < 10) {
      newErrors.emergencyPhone = "Phone must be at least 10 digits";
    }
    
    if (!additionalDetails.relationship) newErrors.relationship = "Relationship is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [newTenant, setNewTenant] = useState(null);

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    if (!confirmDetails) {
      toast.error("Please confirm the details are correct.");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        name: basicDetails.fullName,
        email: basicDetails.email,
        phone: basicDetails.phone,
        propertyId: roomAssignment.propertyId,
        roomNo: roomAssignment.roomUnit,
        bedNo: roomAssignment.bed,
        moveInDate: tenancyDetails.moveInDate,
        baseRoomRent: tenancyDetails.rentAmount,
        agreedRent: tenancyDetails.finalRent ? tenancyDetails.finalRent : tenancyDetails.rentAmount,
        electricityUnitCost: tenancyDetails.electricityUnitCost,
        advanceChargeAmount: tenancyDetails.advanceChargeAmount,
        securityDepositTotal: tenancyDetails.depositAmount,
        securityDepositPaid: 0,
        dob: basicDetails.dob,
        gender: basicDetails.gender,
        building: roomAssignment.building,
        floor: roomAssignment.floor,
        rentAgreementType: roomAssignment.rentAgreementType,
        paymentFrequency: tenancyDetails.paymentFrequency,
        idProof: {
          type: basicDetails.idProofType,
          number: basicDetails.idProofNumber,
          file: basicDetails.idProofFile,
          // Add Aadhaar OCR data for verification
          aadhaarData: {
            frontImage: aadhaarFrontImage,
            backImage: aadhaarBackImage,
            extractedName: basicDetails.fullName,
            extractedFatherName: basicDetails.fatherName,
            extractedAddress: basicDetails.permanentAddress,
            extractedDob: basicDetails.dob,
            extractedAadhaarNumber: basicDetails.idProofNumber
          }
        },
        additional: {
          ...additionalDetails,
          fatherName: basicDetails.fatherName,
          permanentAddress: basicDetails.permanentAddress
        },
        status: "pending",
        kycStatus: "pending_verification" // New status for owner verification
      };

      const res = await fetch(`${apiUrl}/api/tenants/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setNewTenant(json.tenant);
        setShowSuccess(true);
        toast.success("Tenant Added Successfully!");
      } else {
        toast.error(json.message || "Failed to add tenant");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while adding tenant");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('[PREVIEW DEBUG] File selected:', file.name, file.type, file.size);
    
    // Create local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    console.log('[PREVIEW DEBUG] Local preview URL created:', localPreviewUrl);
    setBasicDetails({ ...basicDetails, idProofFile: localPreviewUrl });
    
    const loadingToast = toast.loading("Uploading ID Proof...");
    const data = new FormData();
    data.append("image", file);

    try {
      const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: data });
      const json = await res.json();
      console.log('[PREVIEW DEBUG] Upload response:', json);
      if (json.url) {
        setBasicDetails(prev => ({ ...prev, idProofFile: json.url }));
        toast.success("ID Proof uploaded!");
      }
    } catch (err) {
      console.error('[PREVIEW DEBUG] Upload error:', err);
      toast.error("Upload failed");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // OCR function to extract text from Aadhaar card
  const extractAadhaarData = async (imageFile, side) => {
    if (!imageFile) return;
    
    setIsProcessingOCR(true);
    const loadingToast = toast.loading(`Processing Aadhaar ${side}...`);

    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: m => console.log(m)
        }
      );

      const text = result.data.text;
      console.log('Extracted text:', text);

      // Parse extracted text and map to form fields
      const extractedData = parseAadhaarText(text, side);
      
      if (Object.keys(extractedData).length > 0) {
        setBasicDetails(prev => ({ ...prev, ...extractedData }));
        toast.success(`Aadhaar ${side} data extracted successfully!`);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      toast.error('Failed to extract data from Aadhaar card');
    } finally {
      setIsProcessingOCR(false);
      toast.dismiss(loadingToast);
    }
  };

  // Parse Aadhaar OCR text and extract relevant fields
  const parseAadhaarText = (text, side) => {
    const data = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    if (side === 'front') {
      // Try to extract name (usually appears after "Name" or similar)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('name') && i + 1 < lines.length) {
          data.fullName = lines[i + 1].replace(/[^a-zA-Z\s]/g, '').trim();
          break;
        }
      }
      
      // Try to extract Father's Name
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('father') || line.toLowerCase().includes('s/o') || line.toLowerCase().includes('d/o')) {
          const nextLine = lines[i + 1] || '';
          data.fatherName = nextLine.replace(/[^a-zA-Z\s]/g, '').trim();
          break;
        }
      }

      // Try to extract Gender
      if (/\b(female|महिला)\b/i.test(text)) {
        data.gender = "Female";
      } else if (/\b(male|पुरुष)\b/i.test(text)) {
        data.gender = "Male";
      } else if (/\b(transgender)\b/i.test(text)) {
        data.gender = "Other";
      }

      // Try to extract DOB and format to YYYY-MM-DD
      const dobMatch = text.match(/(?:dob|date\s*of\s*birth|d\.?\s*o\.?\s*b\.?)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i) || text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
      if (dobMatch) {
        const parts = dobMatch[0].match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (parts) {
          const [, d, m, y] = parts;
          data.dob = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }

      // Try to extract Aadhaar number
      const aadhaarMatch = text.match(/[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}/) || text.replace(/[\s\-]/g, "").match(/[2-9]\d{11}/);
      if (aadhaarMatch) {
        data.idProofNumber = aadhaarMatch[0].replace(/[\s\-]/g, '');
      }
    } else if (side === 'back') {
      // Back side usually has address
      const addressLines = [];
      let foundAddress = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes('address') || line.toLowerCase().includes('पता') || line.toLowerCase().includes('s/o') || line.toLowerCase().includes('d/o') || line.toLowerCase().includes('w/o') || foundAddress) {
          foundAddress = true;
          if (!line.toLowerCase().includes('address') && !line.toLowerCase().includes('पता') && line.length > 3) {
            addressLines.push(line);
          }
        }
        if (foundAddress && (line.toLowerCase().includes('pin') || line.match(/^\d{6}$/))) {
          if (line.match(/^\d{6}$/)) addressLines.push(line);
          break;
        }
      }
      
      if (addressLines.length > 0) {
        data.permanentAddress = addressLines.join(', ').replace(/[^a-zA-Z0-9\s,-]/g, '').trim();
      }
    }

    return data;
  };


  const handleAadhaarFrontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAadhaarFrontImage(file);
    await extractAadhaarData(file, 'front');
  };

  const handleAadhaarBackUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAadhaarBackImage(file);
    await extractAadhaarData(file, 'back');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Add Tenant" 
        subtitle="Add tenant details, assign room and set tenancy information. After saving, an E-KYC link will be sent to the tenant."
        breadcrumbs={[
          { label: "Tenants", link: "/superadmin/tenant" },
          { label: "Add Tenant" }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save & Send Onboarding Link
            </button>
          </div>
        }
      />

      <div className="mt-10 grid grid-cols-12 gap-8">
        {/* Left Column: Form Sections */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          {/* Section 1: Basic Details */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">1. Basic Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField 
                label="Full Name" 
                required
                value={basicDetails.fullName}
                onChange={e => setBasicDetails({...basicDetails, fullName: e.target.value})}
                placeholder="Enter full name"
                error={errors.fullName}
              />
              <FormField 
                label="Email Address" 
                required
                value={basicDetails.email}
                onChange={e => setBasicDetails({...basicDetails, email: e.target.value})}
                placeholder="Enter email address"
                type="email"
                error={errors.email}
              />
              <FormField 
                label="Phone Number" 
                required
                value={basicDetails.phone}
                onChange={e => setBasicDetails({...basicDetails, phone: e.target.value})}
                placeholder="Enter phone number"
                prefix="+91"
                error={errors.phone}
              />
              <CustomDatePicker 
                label="Date of Birth" 
                required
                value={basicDetails.dob}
                onChange={val => setBasicDetails({...basicDetails, dob: val})}
                placeholder="Select date of birth"
                error={errors.dob}
              />
              <FormSelect 
                label="Gender" 
                required
                value={basicDetails.gender}
                onChange={e => setBasicDetails({...basicDetails, gender: e.target.value})}
                options={["Male", "Female", "Other"]}
                placeholder="Select gender"
                error={errors.gender}
              />
              <FormSelect 
                label="ID Proof Type" 
                required
                value={basicDetails.idProofType}
                onChange={e => setBasicDetails({...basicDetails, idProofType: e.target.value})}
                options={["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport"]}
              />
              <FormField 
                label="ID Proof Number" 
                required
                value={basicDetails.idProofNumber}
                onChange={e => setBasicDetails({...basicDetails, idProofNumber: e.target.value})}
                placeholder="Enter ID proof number"
                error={errors.idProofNumber}
              />
              
              {/* General ID Proof Upload for non-Aadhaar types */}
              {basicDetails.idProofType !== "Aadhaar Card" && (
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
                    {basicDetails.idProofType} Upload <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group rounded-2xl">
                    <input 
                      type="file" 
                      id="id-proof-upload"
                      className="hidden" 
                      onChange={handlePhotoUpload}
                      accept="image/*"
                    />
                    <label 
                      htmlFor="id-proof-upload"
                      className={cn(
                        "w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group-active:scale-[0.98] relative overflow-hidden",
                        errors.idProofFile ? "border-rose-300 bg-rose-50/30" : "border-slate-200 hover:bg-slate-50 hover:border-blue-200"
                      )}
                    >
                      {basicDetails.idProofFile && (
                        <img 
                          src={basicDetails.idProofFile} 
                          alt={`${basicDetails.idProofType} Preview`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className={cn(
                        "relative z-10 flex flex-col items-center gap-2",
                        basicDetails.idProofFile && "bg-black/50 w-full h-full items-center justify-center"
                      )}>
                        {basicDetails.idProofFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <span className="text-[10px] font-bold text-white">{basicDetails.idProofType} Uploaded</span>
                            <span className="text-[8px] font-bold text-emerald-400">Click to change</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-600 uppercase">{basicDetails.idProofType}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Click to upload</p>
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                  {errors.idProofFile && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest block">{errors.idProofFile}</span>}
                </div>
              )}
              
              {/* Aadhaar Card Specific Upload Section */}
              {basicDetails.idProofType === "Aadhaar Card" ? (
                <>
                  {/* Father Name Field */}
                  <FormField 
                    label="Father's Name" 
                    value={basicDetails.fatherName}
                    onChange={e => setBasicDetails({...basicDetails, fatherName: e.target.value})}
                    placeholder="Father's name (auto-filled from Aadhaar)"
                  />
                  {/* Permanent Address Field */}
                  <FormField 
                    label="Permanent Address" 
                    value={basicDetails.permanentAddress}
                    onChange={e => setBasicDetails({...basicDetails, permanentAddress: e.target.value})}
                    placeholder="Permanent address (auto-filled from Aadhaar back)"
                  />
                  
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
                      Aadhaar Card Upload (Front & Back) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front Side */}
                      <div className={cn(
                        "relative group rounded-2xl",
                        errors.idProofFile && "ring-4 ring-rose-500/5"
                      )}>
                        <input 
                          type="file" 
                          id="aadhaar-front-upload"
                          className="hidden" 
                          onChange={handleAadhaarFrontUpload}
                          accept="image/*"
                          disabled={isProcessingOCR}
                        />
                        <label 
                          htmlFor="aadhaar-front-upload"
                          className={cn(
                            "w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group-active:scale-[0.98] relative overflow-hidden",
                            errors.idProofFile ? "border-rose-300 bg-rose-50/30" : "border-slate-200 hover:bg-slate-50 hover:border-blue-200",
                            isProcessingOCR && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {aadhaarFrontImage && typeof aadhaarFrontImage !== 'string' ? (
                            <img 
                              src={URL.createObjectURL(aadhaarFrontImage)} 
                              alt="Aadhaar Front" 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : null}
                          <div className={cn(
                            "relative z-10 flex flex-col items-center gap-2",
                            aadhaarFrontImage && "bg-black/50 w-full h-full items-center justify-center"
                          )}>
                            {isProcessingOCR ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                <span className="text-[10px] font-bold text-white">Processing OCR...</span>
                              </div>
                            ) : aadhaarFrontImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                <span className="text-[10px] font-bold text-white">Front Uploaded</span>
                                <span className="text-[8px] font-bold text-emerald-400">Data Extracted</span>
                              </div>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-slate-600 uppercase">Front Side</p>
                                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Click to upload</p>
                                </div>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                      
                      {/* Back Side */}
                      <div className={cn(
                        "relative group rounded-2xl",
                        errors.idProofFile && "ring-4 ring-rose-500/5"
                      )}>
                        <input 
                          type="file" 
                          id="aadhaar-back-upload"
                          className="hidden" 
                          onChange={handleAadhaarBackUpload}
                          accept="image/*"
                          disabled={isProcessingOCR}
                        />
                        <label 
                          htmlFor="aadhaar-back-upload"
                          className={cn(
                            "w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group-active:scale-[0.98] relative overflow-hidden",
                            errors.idProofFile ? "border-rose-300 bg-rose-50/30" : "border-slate-200 hover:bg-slate-50 hover:border-blue-200",
                            isProcessingOCR && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {aadhaarBackImage && typeof aadhaarBackImage !== 'string' ? (
                            <img 
                              src={URL.createObjectURL(aadhaarBackImage)} 
                              alt="Aadhaar Back" 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : null}
                          <div className={cn(
                            "relative z-10 flex flex-col items-center gap-2",
                            aadhaarBackImage && "bg-black/50 w-full h-full items-center justify-center"
                          )}>
                            {isProcessingOCR ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                <span className="text-[10px] font-bold text-white">Processing OCR...</span>
                              </div>
                            ) : aadhaarBackImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                <span className="text-[10px] font-bold text-white">Back Uploaded</span>
                                <span className="text-[8px] font-bold text-emerald-400">Address Extracted</span>
                              </div>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <div className="text-center">
                                  <p className="text-[10px] font-black text-slate-600 uppercase">Back Side</p>
                                  <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Click to upload</p>
                                </div>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                    {errors.idProofFile && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest block">{errors.idProofFile}</span>}
                    <div className="mt-3 flex items-center gap-2 bg-blue-50/50 rounded-xl p-3">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-[9px] font-bold text-blue-700">Upload both sides for automatic data extraction using OCR</p>
                    </div>
                  </div>
                </>
              ) : null}
              
              {/* Standard ID Proof Upload for non-Aadhaar */}
              {basicDetails.idProofType !== "Aadhaar Card" && (
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
                    ID Proof Upload <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group rounded-2xl border-2 border-dashed border-slate-200 hover:bg-slate-50 hover:border-blue-200 transition-all">
                    <input 
                      type="file" 
                      id="id-proof-upload"
                      className="hidden" 
                      onChange={handlePhotoUpload}
                      accept="image/*"
                    />
                    <label 
                      htmlFor="id-proof-upload"
                      className="w-full h-32 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group-active:scale-[0.98]"
                    >
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase">Upload ID Proof</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Click to upload</p>
                      </div>
                    </label>
                  </div>
                  {errors.idProofFile && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest block">{errors.idProofFile}</span>}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Room Assignment */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">2. Room Assignment</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormSelect 
                label="Property" 
                required
                value={roomAssignment.propertyId}
                onChange={e => setRoomAssignment({...roomAssignment, propertyId: e.target.value})}
                options={properties.map(p => ({ label: p.title, value: p._id }))}
                placeholder="Select property"
                error={errors.propertyId}
              />
              <FormField 
                label="Building / Block" 
                required
                value={roomAssignment.building}
                onChange={e => setRoomAssignment({...roomAssignment, building: e.target.value})}
                placeholder="Select building"
                error={errors.building}
              />
              <FormField 
                label="Floor" 
                required
                value={roomAssignment.floor}
                onChange={e => setRoomAssignment({...roomAssignment, floor: e.target.value})}
                placeholder="Select floor"
                error={errors.floor}
              />
              <FormSelect 
                label="Room / Unit" 
                required
                value={roomAssignment.roomUnit}
                onChange={e => setRoomAssignment({...roomAssignment, roomUnit: e.target.value})}
                options={
                  roomAssignment.propertyId && rooms.length === 0 
                    ? [{ label: "No rooms available", value: "" }] 
                    : rooms.map(r => ({ label: r.title, value: r.title }))
                }
                placeholder={roomAssignment.propertyId ? "Select room" : "Select property first"}
                error={errors.roomUnit}
              />
              <FormSelect 
                label="Room Type" 
                value={roomAssignment.roomType}
                onChange={e => setRoomAssignment({...roomAssignment, roomType: e.target.value})}
                options={(() => {
                  const selectedProp = properties.find(p => p._id === roomAssignment.propertyId);
                  if (selectedProp && Array.isArray(selectedProp.roomTypes)) {
                    return selectedProp.roomTypes.map(rt => ({ label: rt.type, value: rt.type }));
                  }
                  return ["AC", "Non-AC", "Single", "Double", "Triple"]; // Fallback
                })()}
                placeholder="Select room type"
              />
              <FormField 
                label="Bed" 
                value={roomAssignment.bed}
                onChange={e => setRoomAssignment({...roomAssignment, bed: e.target.value})}
                placeholder="Select bed"
              />
              <FormSelect 
                label="Rent Agreement Type" 
                required
                value={roomAssignment.rentAgreementType}
                onChange={e => setRoomAssignment({...roomAssignment, rentAgreementType: e.target.value})}
                options={["Standard", "Short Term", "Long Term", "Custom"]}
                error={errors.rentAgreementType}
              />
            </div>
          </section>

          {/* Section 3: Tenancy Details */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">3. Tenancy Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField 
                label="Standard Rent (₹)" 
                required
                value={tenancyDetails.rentAmount}
                onChange={e => setTenancyDetails({...tenancyDetails, rentAmount: e.target.value})}
                placeholder="Enter rent amount"
                type="number"
                error={errors.rentAmount}
              />
              <div className="relative group">
                 <FormField 
                   label="Final Agreed Rent" 
                   value={tenancyDetails.finalRent}
                   onChange={e => setTenancyDetails({...tenancyDetails, finalRent: e.target.value})}
                   placeholder="Enter final negotiated rent"
                   type="number"
                 />
                 <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">Optional</span>
              </div>
              <FormField 
                label="Deposit Amount (₹)" 
                required
                value={tenancyDetails.depositAmount}
                onChange={e => setTenancyDetails({...tenancyDetails, depositAmount: e.target.value})}
                placeholder="Enter deposit amount"
                type="number"
                error={errors.depositAmount}
              />
              <FormField 
                label="Move-in Date" 
                required
                value={tenancyDetails.moveInDate}
                onChange={e => setTenancyDetails({...tenancyDetails, moveInDate: e.target.value})}
                type="date"
                error={errors.moveInDate}
              />
              <FormField 
                label="Minimum Stay (Months)" 
                required
                value={tenancyDetails.minStay}
                onChange={e => setTenancyDetails({...tenancyDetails, minStay: e.target.value})}
                placeholder="Enter minimum stay"
                type="number"
              />
              <FormField 
                label="Notice Period (Days)" 
                required
                value={tenancyDetails.noticePeriod}
                onChange={e => setTenancyDetails({...tenancyDetails, noticePeriod: e.target.value})}
                placeholder="Enter notice period"
                type="number"
              />
              <FormField 
                label="Rent Due Date" 
                value={tenancyDetails.rentDueDate}
                onChange={e => setTenancyDetails({...tenancyDetails, rentDueDate: e.target.value})}
                placeholder="e.g. 5th of every month"
              />
              <FormSelect 
                label="Payment Frequency" 
                required
                value={tenancyDetails.paymentFrequency}
                onChange={e => setTenancyDetails({...tenancyDetails, paymentFrequency: e.target.value})}
                options={["Monthly", "Quarterly", "Semi-Annually", "Annually"]}
                error={errors.paymentFrequency}
              />
              <FormField 
                label="Late Fee (₹)" 
                value={tenancyDetails.lateFee}
                onChange={e => setTenancyDetails({...tenancyDetails, lateFee: e.target.value})}
                placeholder="Enter late fee (optional)"
                type="number"
              />
              <FormField 
                label="Electricity Unit Cost (₹)" 
                value={tenancyDetails.electricityUnitCost}
                onChange={e => setTenancyDetails({...tenancyDetails, electricityUnitCost: e.target.value})}
                placeholder="e.g. 8"
                type="number"
              />
              <FormField 
                label="Advance / Move-in Charge (₹)" 
                value={tenancyDetails.advanceChargeAmount}
                onChange={e => setTenancyDetails({...tenancyDetails, advanceChargeAmount: e.target.value})}
                placeholder="0"
                type="number"
              />
            </div>
          </section>

          {/* Section 4: Additional Details */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">4. Additional Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField 
                label="Occupation" 
                value={additionalDetails.occupation}
                onChange={e => setAdditionalDetails({...additionalDetails, occupation: e.target.value})}
                placeholder="Enter occupation"
              />
              <FormField 
                label="Company / Organization" 
                value={additionalDetails.company}
                onChange={e => setAdditionalDetails({...additionalDetails, company: e.target.value})}
                placeholder="Enter company name"
              />
              <FormField 
                label="Emergency Contact Name" 
                required
                value={additionalDetails.emergencyName}
                onChange={e => setAdditionalDetails({...additionalDetails, emergencyName: e.target.value})}
                placeholder="Enter contact name"
                error={errors.emergencyName}
              />
              <FormField 
                label="Emergency Contact Number" 
                required
                value={additionalDetails.emergencyPhone}
                onChange={e => setAdditionalDetails({...additionalDetails, emergencyPhone: e.target.value})}
                placeholder="Enter phone number"
                prefix="+91"
                error={errors.emergencyPhone}
              />
              <FormField 
                label="Relationship" 
                required
                value={additionalDetails.relationship}
                onChange={e => setAdditionalDetails({...additionalDetails, relationship: e.target.value})}
                placeholder="Select relationship"
                error={errors.relationship}
              />
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Remarks (Optional)</label>
                <textarea 
                  value={additionalDetails.remarks}
                  onChange={e => setAdditionalDetails({...additionalDetails, remarks: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all h-24 resize-none"
                  placeholder="Enter remarks..."
                />
              </div>
            </div>
          </section>

          {/* Confirmation Checkbox */}
          <div className="flex items-center gap-3 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
             <div 
               onClick={() => setConfirmDetails(!confirmDetails)}
               className={cn(
                 "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                 confirmDetails ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "bg-white border-slate-200"
               )}
             >
               {confirmDetails && <Check className="w-3.5 h-3.5 text-white" />}
             </div>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">I confirm the above details are correct.</p>
          </div>
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Onboarding Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 sticky top-24">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8">Onboarding Timeline</h3>
            <div className="space-y-10">
              {[
                { step: 1, title: "Basic Details & Room Assignment", sub: "Add tenant details, assign room and tenancy information.", status: "In Progress" },
                { step: 2, title: "E-KYC Verification", sub: "An E-KYC link will be sent to the tenant's email and phone.", status: "Pending" },
                { step: 3, title: "E-Sign Agreement", sub: "After successful KYC, rental agreement link will be sent for e-sign.", status: "Pending" },
                { step: 4, title: "Tenant Added", sub: "Tenant will be added after agreement is signed successfully.", status: "Pending" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 relative group">
                  {i !== 3 && <div className="absolute left-[11px] top-10 bottom-[-24px] w-[2px] bg-slate-100 group-last:hidden" />}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 relative z-10 transition-all duration-500",
                    item.status === "In Progress" ? "bg-blue-600 text-white ring-4 ring-blue-50" : "bg-slate-100 text-slate-400"
                  )}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-tight mb-1", item.status === "In Progress" ? "text-slate-800" : "text-slate-400")}>{item.title}</h4>
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed max-w-[200px]">{item.sub}</p>
                    <div className={cn(
                      "mt-3 inline-flex px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest",
                      item.status === "In Progress" ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-300"
                    )}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Onboarding Summary */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8">Onboarding Summary</h3>
            <div className="space-y-5">
              {[
                { label: "Tenant Name", value: basicDetails.fullName || "-" },
                { label: "Room / Unit", value: roomAssignment.roomUnit || "-" },
                { label: "Rent Amount", value: tenancyDetails.rentAmount ? `₹${tenancyDetails.rentAmount}` : "-" },
                { label: "Move-In Date", value: tenancyDetails.moveInDate || "-" },
                { label: "Minimum Stay", value: tenancyDetails.minStay ? `${tenancyDetails.minStay} months` : "-" },
                { label: "Notice Period", value: tenancyDetails.noticePeriod ? `${tenancyDetails.noticePeriod} days` : "-" },
                { label: "Rent Due Date", value: tenancyDetails.rentDueDate || "-" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className="text-[10px] font-black text-slate-800 uppercase">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next? */}
          <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">What happens next?</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-4 h-4 rounded bg-amber-200 flex items-center justify-center text-[8px] font-black text-amber-800 shrink-0 mt-0.5">01</div>
                <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">On saving, tenant will receive an E-KYC link on their email and phone.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-4 h-4 rounded bg-amber-200 flex items-center justify-center text-[8px] font-black text-amber-800 shrink-0 mt-0.5">02</div>
                <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">After successful KYC, an e-sign agreement link will be sent.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      {showSuccess && newTenant && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => navigate("/superadmin/tenants")} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Tenant Added Successfully!</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Onboarding link and credentials generated</p>
              
              <div className="w-full space-y-4 mb-8">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Login Credentials</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Login ID</span>
                      <span className="text-[11px] font-black text-blue-600">{newTenant.loginId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Password</span>
                      <span className="text-[11px] font-black text-slate-800">{newTenant.tempPassword}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-left flex gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-[9px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                    Since automatic email/WhatsApp is currently experiencing delays, please share these credentials manually with the tenant.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => navigate("/superadmin/tenant")}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Go to Tenant List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
