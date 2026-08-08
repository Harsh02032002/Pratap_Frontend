import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  MapPin, Building2, Users, Home, X,
  Zap, ShieldCheck, Loader2,
  CheckCircle2, Save, Info, Clock, User, Eye, LayoutGrid, Pencil, RefreshCw,
  Mail, Phone, Calendar, Fingerprint, Briefcase, Heart, MessageSquare, AlertCircle, ChevronDown,
  Images, Camera, Paperclip
} from "lucide-react";
import { getApiBase, fetchJson, getAuthHeader } from "../../utils/api";
import { toast } from "react-hot-toast";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession, fetchOwnerProperties, clearOwnerFetchCache } from "../../utils/propertyowner";
import Tesseract from "tesseract.js";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const toLegacyBeds = (room) => {
  if (Array.isArray(room?.beds) && room.beds.length && typeof room.beds[0] === 'object' && 'status' in room.beds[0]) {
    return room.beds;
  }
  const bedCount = Number(room?.beds || room?.capacity || room?.totalBeds || 0);
  return Array.from({ length: bedCount }, (_, i) => {
    const a = room?.bedAssignments?.find(x => Number(x.bedNo) === i + 1) || room?.bedAssignments?.[i] || room?.bedsInfo?.[i] || null;
    const tid = a?.tenantId;
    const hasOccupant = !!(a && (a.tenantName || a.name || (tid && String(tid).length > 0 && String(tid) !== '[object Object]')));
    return hasOccupant
      ? { status: "occupied", tenantId: tid ? String(tid) : null, tenantName: a.tenantName || a.name || null }
      : { status: "available", tenantId: null, tenantName: null };
  }).concat(bedCount === 0 ? [{ status: "available", tenantId: null, tenantName: null }] : []);
};

const dataURLtoFile = (dataUrl, filename) => {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
};

const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState("environment");

  const startStream = React.useCallback(async (facing) => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (err) {
        toast.error("Camera access denied or unavailable: " + err.message);
        onClose();
      }
    }
  }, [onClose]);

  React.useEffect(() => {
    startStream(facingMode);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [facingMode, startStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`));
  };

  const toggleCamera = () => setFacingMode(f => f === "environment" ? "user" : "environment");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Take Photo</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-black relative aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleCamera}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-slate-500 hover:bg-muted transition-colors"
            title="Flip camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!ready}
            className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Camera className="w-3.5 h-3.5" />
            Capture Photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-slate-400 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const MultiSourceUpload = ({ value, onUpload, error }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const photosRef = React.useRef(null);
  const filesRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false);
    await onUpload(file);
    e.target.value = "";
  };

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    await onUpload(file);
  };

  return (
    <>
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="relative">
        <input ref={photosRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={filesRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

        <div
          onClick={() => setShowMenu(s => !s)}
          className={cn(
            "w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-muted/10",
            error ? "border-rose-300 bg-rose-50/30" : "border-border hover:border-primary/40"
          )}
        >
          {value ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span className="text-[11.5px] font-bold text-slate-600">ID Proof Uploaded Successfully</span>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 text-slate-400 transition-colors" />
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-600 uppercase">Click to upload document</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">PNG, JPG, PDF up to 5MB</p>
              </div>
            </>
          )}
        </div>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white rounded-2xl border border-border shadow-xl p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Choose upload source</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); setTimeout(() => photosRef.current?.click(), 50); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors"
                >
                  <Images className="w-6 h-6 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-600">Photos</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); setShowCamera(true); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors"
                >
                  <Camera className="w-6 h-6 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-600">Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); setTimeout(() => filesRef.current?.click(), 50); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-slate-50 transition-colors"
                >
                  <Paperclip className="w-6 h-6 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-600">Files</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const FormField = ({ label, value, onChange, placeholder, type = "text", suffix, prefix, className, list, required, error, disabled, readOnly }) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className={cn(
      "flex items-center bg-slate-50 border rounded-xl px-4 py-2.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all",
      error ? "border-rose-300 ring-4 ring-rose-500/5 bg-rose-50/30" : "border-slate-100 focus-within:border-blue-200",
      disabled || readOnly ? "opacity-60 bg-slate-100/70" : ""
    )}>
      {prefix && <span className="text-[10px] font-black text-slate-400 mr-2">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={list}
        disabled={disabled}
        readOnly={readOnly}
        className="w-full bg-transparent text-[11.5px] font-bold text-slate-800 outline-none placeholder:text-slate-300"
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
          "w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-[11.5px] font-bold text-slate-800 outline-none transition-all appearance-none cursor-pointer",
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
        <span className={cn("text-[11.5px] font-bold", value ? "text-slate-800" : "text-slate-300")}>
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
              {months.map((m, i) => <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>)}
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

export default function TenantRec() {
  const navigate = useNavigate();
  const owner = getOwnerRuntimeSession();
  const apiUrl = getApiBase();

  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState(1);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    aadhaarFront: null,
    aadhaarBack: null
  });

  const [ocrLoadingFront, setOcrLoadingFront] = useState(false);
  const [ocrLoadingBack, setOcrLoadingBack] = useState(false);

  // Section 2: Room Assignment
  const [roomAssignment, setRoomAssignment] = useState({
    propertyId: "",
    building: "",
    floor: "",
    roomUnit: "",
    roomType: "",
    bed: "",
    rentAgreementType: "Standard",
    propertyAddress: ""
  });

  // Section 3: Tenancy Details
  const [tenancyDetails, setTenancyDetails] = useState({
    baseRoomRent: "",
    discount: "0",
    rentAmount: "",
    depositAmount: "",
    moveInDate: "",
    minStay: "11",
    noticePeriod: "30",
    rentDueDate: "5",
    paymentFrequency: "Monthly",
    lateFee: "",
    licenseDuration: "",
    moveOutCharges: "0",
    noticePeriodCharges: "0",
    inclusions: "",
    gstCharges: "0",
    advanceChargeAmount: ""
  });


  // Section 4: Additional Details
  const [additionalDetails, setAdditionalDetails] = useState({
    occupation: "",
    company: "",
    emergencyName: "",
    emergencyPhone: "",
    relationship: "",
    permanentAddress: "",
    remarks: ""
  });

  const [confirmDetails, setConfirmDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newTenant, setNewTenant] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTenantId, setEditTenantId] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. Fetch properties first
        const props = await fetchOwnerProperties(owner.loginId);
        setProperties(props);

      // ── EDIT MODE: prefill from existing tenant ──
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('edit');
      if (editId) {
        setEditMode(true);
        setEditTenantId(editId);
        try {
          const res = await fetchJson(`/api/tenants/${editId}`);
          const t = res?.tenant || res?.data || res;
          if (t) {
            // ── KYC / ID Proof ──
            const kycIdProofType = t.kyc?.idProof || t.idProof?.type || t.idProofType || "Aadhaar Card";
            const kycIdProofNumber = t.kyc?.aadhaarNumber || t.idProof?.number || t.idProofNumber || "";
            const kycIdProofFile = t.kyc?.idProofFile || t.kyc?.aadhaarFront || t.idProof?.file || t.idProofFile || null;

            setBasicDetails(prev => ({
              ...prev,
              fullName: t.name || t.fullName || "",
              email: t.email || t.gmail || "",
              phone: t.phone || t.mobile || "",
              dob: t.dob ? new Date(t.dob).toISOString().split('T')[0] : "",
              gender: t.gender || "",
              idProofType: kycIdProofType,
              idProofNumber: kycIdProofNumber,
              idProofFile: kycIdProofFile,
            }));
            setRoomAssignment(prev => ({
              ...prev,
              propertyId: t.property?._id || t.propertyId || t.property || "",
              building: t.building || "",
              floor: t.floor || "",
              roomUnit: t.roomNo || t.room?.title || "",
              roomType: t.accommodationType || t.room?.type || t.roomType || "",
              bed: t.bedNo ? String(t.bedNo) : "",
              rentAgreementType: t.rentAgreementType || "Standard",
              propertyAddress: t.propertyAddress || "",
            }));

            // ── Billing fields: try direct fields first, then digitalCheckin.agreementDetails ──
            const agd = t.digitalCheckin?.agreementDetails || {};
            setTenancyDetails(prev => ({
              ...prev,
              baseRoomRent: String(t.baseRoomRent || ""),
              rentAmount: String(t.agreedRent || t.digitalCheckin?.profile?.agreedRent || ""),
              depositAmount: String(t.securityDepositTotal ?? agd.securityDeposit ?? ""),
              moveInDate: t.moveInDate ? new Date(t.moveInDate).toISOString().split('T')[0] : "",
              minStay: String(t.minStay || agd.minimumStayDuration || "11"),
              noticePeriod: String(t.noticePeriod || agd.noticePeriodDays || "30"),
              rentDueDate: String(t.rentDueDate || agd.licenseFeeDueDate || "5"),
              paymentFrequency: t.paymentFrequency || "Monthly",
              lateFee: String(t.lateFee || ""),
              licenseDuration: String(t.licenseDuration || agd.licenseDuration || ""),
              moveOutCharges: String(t.moveOutCharges ?? agd.moveOutCharges ?? "0"),
              noticePeriodCharges: String(t.noticePeriodCharges ?? agd.noticePeriodCharges ?? "0"),
              inclusions: t.inclusions || agd.inclusions || "",
              gstCharges: String(t.gstCharges ?? agd.gstCharges ?? "0"),
              advanceChargeAmount: String(t.advanceChargeAmount ?? agd.advanceChargeAmount ?? ""),
            }));

            // ── Emergency Contact: DB stores as emergencyContact.{name,phone,relationship} ──
            setAdditionalDetails(prev => ({
              ...prev,
              occupation: t.occupation || t.additional?.occupation || "",
              company: t.company || t.additional?.company || "",
              emergencyName:  t.emergencyContact?.name  || t.additional?.emergencyName  || t.emergencyName  || "",
              emergencyPhone: t.emergencyContact?.phone || t.additional?.emergencyPhone || t.emergencyPhone || "",
              relationship:   t.emergencyContact?.relationship || t.additional?.relationship || t.relationship || "",
              permanentAddress: t.permanentAddress || t.additional?.permanentAddress || "",
              remarks: t.remarks || t.additional?.remarks || "",
            }));
          }
        } catch (err) {
          console.error('Failed to load tenant for edit:', err);
          toast.error('Could not load tenant data');
        }
        return; // skip normal URL param processing below
      }

      // 2. Parse URL query params (normal add mode)
      const pId = urlParams.get('propertyId');

        const room = urlParams.get('room');
        const nameParam = urlParams.get('name') || urlParams.get('fullName');
        const emailParam = urlParams.get('email');
        const phoneParam = urlParams.get('phone');
        const depositParam = urlParams.get('deposit') || urlParams.get('depositAmount') || urlParams.get('bookingAmount') || urlParams.get('paidAmount');

        // 3. Set basic details
        if (nameParam || emailParam || phoneParam) {
          setBasicDetails(prev => ({
            ...prev,
            fullName: nameParam || prev.fullName,
            email: emailParam || prev.email,
            phone: phoneParam || prev.phone
          }));
        }

        // 4. Set tenancy details
        if (depositParam) {
          setTenancyDetails(prev => ({
            ...prev,
            depositAmount: depositParam
          }));
        }

        // 5. Select property and room
        if (pId) {
          let matchedProp = props.find(p => p._id === pId || p.visitId === pId || p.propertyId === pId);
          let resolvedPropertyId = matchedProp ? matchedProp._id : pId;
          
          if (!matchedProp) {
            try {
              const approvedPropData = await fetchJson(`/api/approved-properties/${pId}`);
              const approvedProp = approvedPropData?.property || approvedPropData;
              if (approvedProp && approvedProp.propertyId) {
                const actualPropId = approvedProp.propertyId;
                matchedProp = props.find(p => p._id === actualPropId || p.visitId === actualPropId || p.propertyId === actualPropId);
                if (matchedProp) {
                  resolvedPropertyId = matchedProp._id;
                }
              }
            } catch (fetchErr) {
              console.error("Could not resolve approved property ID:", fetchErr);
            }
          }
          
          setRoomAssignment(prev => ({
            ...prev,
            propertyId: resolvedPropertyId,
            ...(room ? { roomUnit: room } : {})
          }));
        } else if (props && props.length === 1) {
          setRoomAssignment(prev => ({
            ...prev,
            propertyId: props[0]._id
          }));
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initializeData();
  }, [owner.loginId]);

  useEffect(() => {
    // Load rooms for selected property
    if (!roomAssignment.propertyId) {
      setRooms([]);
      return;
    }
    let active = true;
    const loadRooms = async () => {
      try {
        console.log("DEBUG loadRooms: propertyId =", roomAssignment.propertyId, "properties =", properties);
        const data = await fetchJson(`/api/rooms/property/${roomAssignment.propertyId}?unassigned=true`);
        if (!active) return;
        console.log("DEBUG loadRooms: API returned data =", data);
        let roomList = [];
        if (Array.isArray(data)) {
          roomList = data;
        } else if (data && Array.isArray(data.rooms)) {
          roomList = data.rooms;
        }

        // Fallback generator
        if (roomList.length === 0) {
          console.log("DEBUG loadRooms: roomList is empty, trying fallback generator...");
          const selectedProp = properties.find(p => p._id === roomAssignment.propertyId || p.visitId === roomAssignment.propertyId || p.propertyId === roomAssignment.propertyId);
          console.log("DEBUG loadRooms: selectedProp =", selectedProp);
          if (selectedProp && Array.isArray(selectedProp.roomTypes)) {
            selectedProp.roomTypes.forEach(rt => {
              const count = parseInt(rt.totalRooms) || 0;
              const bedsCount = parseInt(rt.occupancy) || parseInt(rt.totalBeds) || 1;
              const priceVal = Number(rt.pricePerBed || rt.pricePerRoom || 0);
              for (let i = 1; i <= count; i++) {
                roomList.push({
                  _id: `${rt.type}-${i}`,
                  title: `${rt.type} - Room ${i}`,
                  type: rt.type,
                  beds: bedsCount,
                  price: priceVal
                });
              }
            });
          }
        }

        // Final fallback: the property-scoped endpoint can return nothing when the
        // room records are linked to the owner (ownerLoginId) rather than to this
        // exact property _id. Pull the owner's rooms — the same endpoint the Rooms
        // pages use — and keep the ones for the selected property (or all, if the
        // room records carry no property reference to filter on).
        if (roomList.length === 0 && owner?.loginId) {
          try {
            const ownerData = await fetchJson(`/api/rooms/owner/${owner.loginId}`);
            if (!active) return;
            const ownerRooms = Array.isArray(ownerData) ? ownerData : (ownerData?.rooms || ownerData?.data || []);
            const pid = String(roomAssignment.propertyId);
            const selProp = properties.find(p => String(p._id) === pid || String(p.visitId) === pid || String(p.propertyId) === pid);
            const pName = String(selProp?.title || selProp?.name || "").trim().toLowerCase();
            roomList = ownerRooms.filter(r => {
              const rpId = String(r.propertyId || r.property?._id || r.property || r.property_id || "");
              const rpName = String(r.propertyName || r.property?.title || r.property?.name || "").trim().toLowerCase();
              if (!rpId && !rpName) return true; // room carries no property reference → include
              return rpId === pid || (!!pName && rpName === pName);
            });
          } catch (_) { /* keep roomList as-is */ }
        }

        console.log("DEBUG loadRooms: final roomList =", roomList);
        setRooms(roomList);

        const selectedPropObj = properties.find(p => p._id === roomAssignment.propertyId || p.visitId === roomAssignment.propertyId || p.propertyId === roomAssignment.propertyId);
        if (selectedPropObj) {
          const propDeposit = selectedPropObj.pricing?.securityDeposit || selectedPropObj.securityDeposit || "";
          if (propDeposit) {
            setTenancyDetails(prev => ({
              ...prev,
              depositAmount: prev.depositAmount || String(propDeposit)
            }));
          }
        }

        // Auto-fill logic if a room is already selected via URL
        if (roomAssignment.roomUnit) {
          const selectedRoom = roomList.find(r => r.title === roomAssignment.roomUnit);
          if (selectedRoom) {
            setRoomAssignment(prev => ({
              ...prev,
              roomType: selectedRoom.type || prev.roomType,
              floor: selectedRoom.floor || prev.floor
            }));
            if (selectedRoom.price) {
              setTenancyDetails(prev => ({
                ...prev,
                baseRoomRent: selectedRoom.price.toString(),
                rentAmount: selectedRoom.price.toString(),
                discount: "0"
              }));
            }
          }
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load rooms:", err);
          setRooms([]);
        }
      }
    };
    loadRooms();
    return () => {
      active = false;
    };
  }, [roomAssignment.propertyId, properties]);

  const validateForm = () => {
    const newErrors = {};
    if (!basicDetails.fullName) newErrors.fullName = "Name is required";
    if (!basicDetails.email) newErrors.email = "Email is required";
    const phoneDigits = (basicDetails.phone || "").replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(phoneDigits)) newErrors.phone = "Please enter a valid mobile number";
    if (!basicDetails.dob) newErrors.dob = "Date of Birth is required";
    if (!basicDetails.gender) newErrors.gender = "Gender is required";
    if (!basicDetails.idProofNumber) newErrors.idProofNumber = "ID Proof No is required";
    if (!basicDetails.idProofFile) newErrors.idProofFile = "Proof upload is required";

    if (!roomAssignment.propertyId) newErrors.propertyId = "Property is required";
    if (!roomAssignment.floor) newErrors.floor = "Floor is required";
    if (!roomAssignment.rentAgreementType) newErrors.rentAgreementType = "Agreement type is required";

    if (!tenancyDetails.rentAmount) newErrors.rentAmount = "Rent is required";
    if (!tenancyDetails.depositAmount) newErrors.depositAmount = "Deposit is required";
    if (!tenancyDetails.moveInDate) newErrors.moveInDate = "Move-in date is required";
    if (!tenancyDetails.paymentFrequency) newErrors.paymentFrequency = "Payment frequency is required";

    if (!additionalDetails.emergencyName) newErrors.emergencyName = "Emergency name is required";
    const emergencyDigits = (additionalDetails.emergencyPhone || "").replace(/\D/g, "");
    if (!emergencyDigits) newErrors.emergencyPhone = "Emergency phone is required";
    // validation of number yaha add hai //
    else if (!/^[6-9]\d{9}$/.test(emergencyDigits)) newErrors.emergencyPhone = "Please enter a valid mobile number";
    else if (emergencyDigits === phoneDigits) newErrors.emergencyPhone = "Emergency number cannot be the same as tenant's number";
    if (!additionalDetails.relationship) newErrors.relationship = "Relationship is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Run validation checks
    const newErrors = {};
    if (!basicDetails.fullName) newErrors.fullName = "Name is required";
    if (!basicDetails.email) newErrors.email = "Email is required";
    const phoneDigits = (basicDetails.phone || "").replace(/\D/g, "");
    if (!phoneDigits) newErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(phoneDigits)) newErrors.phone = "Please enter a valid mobile number";
    if (!basicDetails.dob) newErrors.dob = "Date of Birth is required";
    if (!basicDetails.gender) newErrors.gender = "Gender is required";
    if (!basicDetails.idProofNumber) newErrors.idProofNumber = "ID Proof No is required";
    if (!basicDetails.idProofFile) newErrors.idProofFile = "Proof upload is required";

    if (!roomAssignment.propertyId) newErrors.propertyId = "Property is required";
    if (!roomAssignment.floor) newErrors.floor = "Floor is required";
    if (!roomAssignment.rentAgreementType) newErrors.rentAgreementType = "Agreement type is required";

    if (!tenancyDetails.rentAmount) newErrors.rentAmount = "Rent is required";
    if (!tenancyDetails.depositAmount) newErrors.depositAmount = "Deposit is required";
    if (!tenancyDetails.moveInDate) newErrors.moveInDate = "Move-in date is required";
    if (!tenancyDetails.paymentFrequency) newErrors.paymentFrequency = "Payment frequency is required";

    if (!additionalDetails.emergencyName) newErrors.emergencyName = "Emergency name is required";
    const emergencyDigits = (additionalDetails.emergencyPhone || "").replace(/\D/g, "");
    if (!emergencyDigits) newErrors.emergencyPhone = "Emergency phone is required";
    else if (!/^[6-9]\d{9}$/.test(emergencyDigits)) newErrors.emergencyPhone = "Please enter a valid mobile number";
    else if (emergencyDigits === phoneDigits) newErrors.emergencyPhone = "Emergency number cannot be the same as tenant's number";
    if (!additionalDetails.relationship) newErrors.relationship = "Relationship is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields correctly.");
      if (isMobile) {
        if (newErrors.fullName || newErrors.email || newErrors.phone || newErrors.dob || newErrors.gender || newErrors.idProofNumber || newErrors.idProofFile) {
          setActiveMobileTab(1);
        } else if (newErrors.propertyId || newErrors.floor || newErrors.roomUnit || newErrors.rentAgreementType) {
          setActiveMobileTab(2);
        } else if (newErrors.rentAmount || newErrors.depositAmount || newErrors.moveInDate || newErrors.paymentFrequency) {
          setActiveMobileTab(3);
        } else if (newErrors.emergencyName || newErrors.emergencyPhone || newErrors.relationship) {
          setActiveMobileTab(4);
        }
      }
      return;
    }

    if (!confirmDetails) {
      toast.error("Please confirm the details are correct.");
      return;
    }

    const confirmMsg = editMode
      ? "Are you sure you want to update this tenant's details?"
      : "Are you sure you want to onboard this tenant?";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const selectedPropObj = properties.find(p => p._id === roomAssignment.propertyId || p.visitId === roomAssignment.propertyId || p.propertyId === roomAssignment.propertyId);
      const payload = {
        name: basicDetails.fullName,
        email: basicDetails.email,
        phone: basicDetails.phone,
        propertyId: roomAssignment.propertyId,
        propertyTitle: selectedPropObj?.title || "",
        roomNo: roomAssignment.roomUnit || [roomAssignment.floor, roomAssignment.roomType].filter(Boolean).join(" - ") || roomAssignment.floor,
        bedNo: roomAssignment.bed,
        floor: roomAssignment.floor,
        building: roomAssignment.building,
        moveInDate: tenancyDetails.moveInDate,
        baseRoomRent: tenancyDetails.baseRoomRent,
        agreedRent: tenancyDetails.rentAmount,
        securityDepositTotal: tenancyDetails.depositAmount,
        securityDepositPaid: tenancyDetails.depositAmount || 0,
        dob: basicDetails.dob,
        gender: basicDetails.gender,
        rentAgreementType: roomAssignment.rentAgreementType,
        paymentFrequency: tenancyDetails.paymentFrequency,
        minStay: tenancyDetails.minStay,
        noticePeriod: tenancyDetails.noticePeriod,
        rentDueDate: tenancyDetails.rentDueDate,
        accommodationType: roomAssignment.roomType,
        lateFee: tenancyDetails.lateFee,
        licenseDuration: tenancyDetails.licenseDuration,
        moveOutCharges: tenancyDetails.moveOutCharges,
        noticePeriodCharges: tenancyDetails.noticePeriodCharges,
        inclusions: tenancyDetails.inclusions,
        gstCharges: tenancyDetails.gstCharges,
        advanceChargeAmount: tenancyDetails.advanceChargeAmount,
        propertyAddress: roomAssignment.propertyAddress,
        permanentAddress: additionalDetails.permanentAddress,
        idProofNumber: basicDetails.idProofNumber,
        aadhaarNumber: basicDetails.idProofNumber,
        idProof: {
          type: basicDetails.idProofType,
          number: basicDetails.idProofNumber,
          file: basicDetails.idProofFile || basicDetails.aadhaarFront,
          aadhaarFront: basicDetails.aadhaarFront,
          aadhaarBack: basicDetails.aadhaarBack
        },

        additional: additionalDetails,
      };


      let res;
      if (editMode && editTenantId) {
        // UPDATE existing tenant
        res = await fetch(`${apiUrl}/api/tenants/${editTenantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify(payload),
        });
      } else {
        // ADD new tenant
        payload.status = "pending";
        res = await fetch(`${apiUrl}/api/tenants/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (res.ok) {
        clearOwnerFetchCache(owner.loginId);
        if (editMode) {
          toast.success("Tenant updated successfully!");
          setTimeout(() => window.location.href = "/propertyowner/tenants", 1000);
        } else {
          setNewTenant(json.tenant);
          setShowSuccess(true);
          toast.success("Tenant Onboarded Successfully!");
        }
      } else {
        toast.error(json.message || (editMode ? "Failed to update tenant" : "Failed to onboard tenant"));
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };


  const handlePhotoUpload = async (file) => {
    if (!file) return;

    const loadingToast = toast.loading("Uploading ID Proof...");
    const data = new FormData();
    data.append("image", file);

    try {
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: data,
        headers: getAuthHeader()
      });

      let json;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        json = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP error ${res.status}`);
      }

      if (!res.ok) throw new Error(json.error || "Upload failed");

      if (json.url) {
        setBasicDetails(prev => ({ ...prev, idProofFile: json.url }));
        toast.success("ID Proof uploaded!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const extractOcrDataFront = async (file, uploadedUrl) => {
    setOcrLoadingFront(true);
    const toastId = toast.loading("Scanning Aadhaar Front with OCR...");
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result?.data?.text || "";
      console.log("OCR Front text:", text);

      // Extract Aadhaar Number
      const aadhaarMatch = text.match(/[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}/) || text.replace(/[\s\-]/g, "").match(/[2-9]\d{11}/);
      const aadhaarNum = aadhaarMatch ? aadhaarMatch[0].replace(/[\s\-]/g, "") : "";

      // Extract DOB
      let dobVal = "";
      const dobMatch = text.match(/(?:dob|date\s*of\s*birth|d\.?\s*o\.?\s*b\.?)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i) || text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
      if (dobMatch) {
        const parts = dobMatch[0].match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (parts) {
          const [, d, m, y] = parts;
          dobVal = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }

      // Extract Gender
      let genderVal = "";
      if (/\b(female|महिला)\b/i.test(text)) genderVal = "Female";
      else if (/\b(male|पुरुष)\b/i.test(text)) genderVal = "Male";
      else if (/\b(transgender)\b/i.test(text)) genderVal = "Other";

      // Extract Name from Aadhaar Front
      let extractedName = "";
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

      // Tier 1: Check for explicit "Name:" tag
      for (const line of lines) {
        const match = line.match(/^(?:name|naam|नाम)[:\s]+([A-Za-z.\s]{2,40})/i);
        if (match) {
          extractedName = match[1].replace(/[^A-Za-z\s.]/g, " ").replace(/\s+/g, " ").trim();
          break;
        }
      }

      // Tier 2: Look for line above DOB / Gender / Aadhaar Number anchor
      if (!extractedName) {
        let anchorIdx = lines.findIndex(l => /(?:dob|date\s*of\s*birth|d\.o\.b|gender|male|female|year\s*of\s*birth|\d{2}[\/-]\d{2}[\/-]\d{4})/i.test(l));
        if (anchorIdx === -1) {
          anchorIdx = lines.findIndex(l => /[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}/.test(l));
        }

        const searchRange = anchorIdx > 0 
          ? lines.slice(Math.max(0, anchorIdx - 4), anchorIdx) 
          : lines.slice(0, 6);

        for (let i = searchRange.length - 1; i >= 0; i--) {
          const raw = searchRange[i];
          const clean = raw.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();
          
          if (/^(government|india|uidai|unique|identification|authority|male|female|address|dob|date|birth|year|father|mother|husband|aadhaar|card|enrollment|help|issue|download|re[li]|e[eoi]|govt)$/i.test(clean)) continue;
          if (clean.length < 2 || clean.length > 40) continue;

          const words = clean.split(" ").filter(w => !/^(rel|govt|india|uidai|card|issue|help|download|govt)$/i.test(w) && w.length >= 2);
          if (words.length >= 1) {
            extractedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            break;
          }
        }
      }

      // Tier 3: Fallback - grab first valid non-header English line
      if (!extractedName) {
        for (const line of lines) {
          const clean = line.replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim();
          if (/government|india|uidai|unique|identification|authority|male|female|address|dob|date|birth|year|father|mother|husband|aadhaar|card/i.test(clean)) continue;
          const words = clean.split(" ").filter(w => w.length >= 2 && !/^(rel|govt|india|uidai|card|issue|help|download)$/i.test(w));
          if (words.length >= 1 && clean.length >= 3 && clean.length <= 40) {
            extractedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            break;
          }
        }
      }

      // Format Name: Title Case
      if (extractedName) {
        extractedName = extractedName
          .split(" ")
          .filter(w => w.length >= 2 && !/^(REL|Ee|EE|EO|EN|Govt|India|UIDAI|Aadhaar|Card)$/i.test(w))
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
          .trim();
        
        if (extractedName.length < 2) extractedName = "";
      }


      setBasicDetails(prev => ({
        ...prev,
        idProofFile: uploadedUrl || prev.idProofFile,
        aadhaarFront: uploadedUrl || prev.aadhaarFront,
        ...(aadhaarNum ? { idProofNumber: aadhaarNum, idProofType: "Aadhaar Card" } : {}),
        ...(dobVal ? { dob: dobVal } : {}),
        ...(genderVal ? { gender: genderVal } : {}),
        ...(extractedName ? { fullName: extractedName } : {})
      }));

      toast.success("Aadhaar Front Scanned! Details auto-filled.");
    } catch (err) {
      console.error("OCR Front error:", err);
      toast.error("Could not scan text automatically. Please enter details manually.");
    } finally {
      setOcrLoadingFront(false);
      toast.dismiss(toastId);
    }
  };

  const extractOcrDataBack = async (file, uploadedUrl) => {
    setOcrLoadingBack(true);
    const toastId = toast.loading("Scanning Aadhaar Back with OCR...");
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result?.data?.text || "";
      console.log("OCR Back text:", text);

      // Extract Address
      let extractedAddress = "";
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      let addrIdx = lines.findIndex(l => /(?:address|पता|s\/o|d\/o|w\/o|c\/o)[:\s]/i.test(l));
      if (addrIdx !== -1) {
        extractedAddress = lines.slice(addrIdx, addrIdx + 4)
          .map(l => l.replace(/^(?:address|पता)[:\s]*/i, "").trim())
          .filter(l => !/aa?dh?[ao]a?r|u[il1][do][ai4]|unique|government|india|help/i.test(l))
          .join(", ");
      } else {
        const pinMatch = text.match(/\b\d{6}\b/);
        if (pinMatch) {
          const pinIdx = text.indexOf(pinMatch[0]);
          const snippet = text.substring(Math.max(0, pinIdx - 120), pinIdx + 8);
          extractedAddress = snippet.split("\n").map(l => l.trim()).filter(l => l.length > 5 && !/aa?dh?[ao]a?r|u[il1]|government|india/i.test(l)).join(", ");
        }
      }

      // Extract Father / Guardian / Husband Name & Relationship
      let fatherName = "";
      let relationType = "";
      const relMatch = text.match(/(?:s\/o|d\/o|w\/o|c\/o|son\s+of|daughter\s+of|wife\s+of|care\s+of|father['’]?s?\s+name|father|fathername|पिता|संरक्षक)[:\s]+([A-Za-z.\s]{2,40})/i);
      if (relMatch) {
        fatherName = relMatch[1].split(/,|\n|\/|HOUSE|NO|CAT|GEA|NEAR|SECTOR|ROAD|DIST|DISTRICT|PIN/i)[0].trim();
        const tag = relMatch[0].toLowerCase();
        if (tag.includes("w/o") || tag.includes("wife")) {
          relationType = "Spouse";
        } else if (tag.includes("c/o") || tag.includes("care") || tag.includes("संरक्षक")) {
          relationType = "Guardian";
        } else {
          relationType = "Father";
        }
      }

      // Clean & Sanitize Permanent Address
      if (extractedAddress) {
        let clean = extractedAddress
          .replace(/(?:s\/o|d\/o|w\/o|c\/o|son\s+of|daughter\s+of|wife\s+of|care\s+of)[:\s]+[A-Za-z.\s]{2,40}(?:,|\n|$)/gi, "")
          .replace(/\b(?:address|पता|addr)[:\s,.-]*/gi, "")
          .replace(/^[:\s,.-]+/, "");

        // Trim after 6-digit pincode if present
        const pinMatch = clean.match(/\b(\d{6})\b/);
        if (pinMatch) {
          const pIdx = clean.indexOf(pinMatch[0]);
          clean = clean.substring(0, pIdx + 6);
        }

        // Clean noise tokens
        clean = clean
          .replace(/\b(?:le|GT|eg|Cat|GEA|dx|AE|ie|Le|peels|fi|v|i|s|Sar\s+a|vi)\b/gi, " ")
          .replace(/[^a-zA-Z0-9\s#\/\-\.,]/g, " ")
          .replace(/\s+/g, " ");

        // Deduplicate comma-separated parts & remove leftover Address tag
        const rawParts = clean.split(",").map(p => p.trim()).filter(Boolean);
        const uniqueParts = [];
        const seen = new Set();

        for (let p of rawParts) {
          p = p.replace(/^(?:address|पता|addr)[:\s,.-]*/i, "").replace(/\bNER\b/i, "NEAR").replace(/\s+/g, " ").trim();
          if (p.length < 2) continue;
          const lower = p.toLowerCase();
          if (!seen.has(lower) && !/^(address|पता|india|govt|unique|aadhaar|help)$/i.test(p)) {
            seen.add(lower);
            uniqueParts.push(p);
          }
        }

        extractedAddress = uniqueParts.join(", ").replace(/,\s*,/g, ",").trim();
      }

      setAdditionalDetails(prev => ({
        ...prev,
        ...(extractedAddress ? { permanentAddress: extractedAddress } : {}),
        ...(fatherName ? { emergencyName: fatherName, relationship: relationType || "Father" } : {})
      }));

      if (extractedAddress || fatherName) {
        toast.success(`Aadhaar Back Scanned! ${fatherName ? `Father (${fatherName}) & ` : ''}Address auto-filled.`);
      } else {
        toast.success("Aadhaar Back uploaded!");
      }






      setBasicDetails(prev => ({
        ...prev,
        aadhaarBack: uploadedUrl || prev.aadhaarBack
      }));
    } catch (err) {
      console.error("OCR Back error:", err);
      toast.error("Back uploaded. Enter address manually if needed.");
    } finally {
      setOcrLoadingBack(false);
      toast.dismiss(toastId);
    }
  };

  const handleAadhaarFrontUpload = async (file) => {
    if (!file) return;
    const loadingToast = toast.loading("Uploading Aadhaar Front...");
    const data = new FormData();
    data.append("image", file);
    try {
      const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: data, headers: getAuthHeader() });
      const json = await res.json();
      if (json.url) {
        extractOcrDataFront(file, json.url);
      }
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const handleAadhaarBackUpload = async (file) => {
    if (!file) return;
    const loadingToast = toast.loading("Uploading Aadhaar Back...");
    const data = new FormData();
    data.append("image", file);
    try {
      const res = await fetch(`${apiUrl}/api/upload`, { method: "POST", body: data, headers: getAuthHeader() });
      const json = await res.json();
      if (json.url) {
        extractOcrDataBack(file, json.url);
      }
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };


  return (
    <PropertyOwnerLayout
      owner={owner}
      title={editMode ? "Edit Tenant" : "Add Tenant"}
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-4 border-b border-border">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">
            {editMode ? 'Edit Tenant Details' : 'Add New Tenant'}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {editMode ? 'Update tenant information, room assignment and tenancy details.' : 'Register details, assign beds and trigger automatic E-KYC verification.'}
          </p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <button onClick={() => navigate(-1)} className="px-4 h-10 rounded-lg border border-border text-xs font-bold hover:bg-muted transition-colors">
            Cancel
          </button>
          {(!isMobile || activeMobileTab === 4) && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-slate-900/10"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editMode ? "Save Changes" : "Save & Onboard"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Sections */}
        <div className="lg:col-span-8 space-y-8">
          {isMobile && (
            <div className="flex gap-2 border-b border-slate-100 pb-3 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { id: 1, label: "Personal Details" },
                { id: 2, label: "Room Allocation" },
                { id: 3, label: "Stay & Billing" },
                { id: 4, label: "Occupation & Summary" }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMobileTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap shrink-0",
                    activeMobileTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Section 1 */}
          {(!isMobile || activeMobileTab === 1) && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
              <h3 className="font-serif text-[20px] text-slate-800 flex items-center gap-2">
                <User size={18} className="text-primary" />
                1. Resident Personal Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Full Name"
                  required
                  value={basicDetails.fullName}
                  onChange={e => setBasicDetails({ ...basicDetails, fullName: e.target.value })}
                  placeholder="Enter full name"
                  error={errors.fullName}
                />
                <FormField
                  label="Email Address"
                  required
                  value={basicDetails.email}
                  onChange={e => setBasicDetails({ ...basicDetails, email: e.target.value })}
                  placeholder="Enter email address"
                  type="email"
                  error={errors.email}
                />
                <FormField
                  label="Phone Number"
                  required
                  value={basicDetails.phone}
                  onChange={e => setBasicDetails({ ...basicDetails, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="Enter phone number"
                  prefix="+91"
                  error={errors.phone}
                />
                <CustomDatePicker
                  label="Date of Birth"
                  required
                  value={basicDetails.dob}
                  onChange={val => setBasicDetails({ ...basicDetails, dob: val })}
                  placeholder="Select date of birth"
                  error={errors.dob}
                />
                <FormSelect
                  label="Gender"
                  required
                  value={basicDetails.gender}
                  onChange={e => setBasicDetails({ ...basicDetails, gender: e.target.value })}
                  options={["Male", "Female", "Other"]}
                  placeholder="Select gender"
                  error={errors.gender}
                />
                <FormSelect
                  label="ID Proof Type"
                  required
                  value={basicDetails.idProofType}
                  onChange={e => setBasicDetails({ ...basicDetails, idProofType: e.target.value })}
                  options={["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport"]}
                />
                <FormField
                  label="ID Proof Number"
                  required
                  value={basicDetails.idProofNumber}
                  onChange={e => setBasicDetails({ ...basicDetails, idProofNumber: e.target.value })}
                  placeholder="Enter ID proof number"
                  error={errors.idProofNumber}
                />
                {basicDetails.idProofType === "Aadhaar Card" ? (
                  <div className="sm:col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-800 uppercase block tracking-tight">
                      Aadhaar Card Upload (Front & Back) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Front Upload */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          Front Upload {ocrLoadingFront && <Loader2 className="w-3 h-3 animate-spin text-blue-500 inline" />}
                        </span>
                        <MultiSourceUpload
                          value={basicDetails.aadhaarFront || basicDetails.idProofFile}
                          onUpload={handleAadhaarFrontUpload}
                          error={errors.idProofFile}
                        />
                        {basicDetails.aadhaarFront && (
                          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Front Uploaded & Scanned
                          </span>
                        )}
                      </div>

                      {/* Back Upload */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          Back Upload {ocrLoadingBack && <Loader2 className="w-3 h-3 animate-spin text-blue-500 inline" />}
                        </span>
                        <MultiSourceUpload
                          value={basicDetails.aadhaarBack}
                          onUpload={handleAadhaarBackUpload}
                        />
                        {basicDetails.aadhaarBack && (
                          <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Back Uploaded & Scanned
                          </span>
                        )}
                      </div>
                    </div>
                    {errors.idProofFile && <span className="text-[8px] font-bold text-rose-500 mt-1 uppercase tracking-widest block">{errors.idProofFile}</span>}
                    <p className="text-[10px] text-blue-600 bg-blue-50/70 p-2.5 rounded-xl font-medium flex items-center gap-1.5">
                      <Info size={14} className="shrink-0" /> Upload front & back to automatically extract Name, Aadhaar No, DOB, Gender & Permanent Address!
                    </p>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">
                      Upload ID Proof File <span className="text-rose-500">*</span>
                    </label>
                    <MultiSourceUpload
                      value={basicDetails.idProofFile}
                      onUpload={handlePhotoUpload}
                      error={errors.idProofFile}
                    />
                    {errors.idProofFile && <span className="text-[8px] font-bold text-rose-500 mt-2 uppercase tracking-widest block">{errors.idProofFile}</span>}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Section 2 */}
          {(!isMobile || activeMobileTab === 2) && (() => {
            const availableRooms = rooms.filter(r => {
              const matchesSelected = roomAssignment.roomUnit && (r.title === roomAssignment.roomUnit || r.number === roomAssignment.roomUnit || r.roomNo === roomAssignment.roomUnit);
              if (matchesSelected) return true;

              // Filter out unavailable or deleted rooms (status=inactive is the Room model default — it controls public listing, not assignability)
              if (r.isAvailable === false || r.isDeleted === true) {
                return false;
              }
              // Filter out rooms with no vacant beds
              // A bed is vacant if it's not explicitly occupied and has no tenant assigned
              const bedsList = toLegacyBeds(r);
              return bedsList.some(b => {
                const s = String(b.status || '').toLowerCase().trim();
                return s !== 'occupied' && !b.tenantId;
              });
            });

            const floorOptions = [...new Set(availableRooms.map(r => r.floor).filter(Boolean))].sort();
            const roomsForFloor = roomAssignment.floor
              ? availableRooms.filter(r => !r.floor || r.floor === roomAssignment.floor)
              : availableRooms;
            
            const selectedRoom = availableRooms.find(r => (r.title || r.number || r.roomNo) === roomAssignment.roomUnit);
            const bedsList = selectedRoom ? toLegacyBeds(selectedRoom) : [];
            const bedOptions = bedsList
              .map((b, i) => ({ label: `Bed ${i + 1}`, value: String(i + 1), status: b.status, tenantId: b.tenantId }))
              .filter(opt => {
                const s = String(opt.status || '').toLowerCase().trim();
                return s !== 'occupied' && !opt.tenantId;
              });

            const handleRoomSelect = (roomTitle) => {
              const room = rooms.find(r => (r.title || r.number || r.roomNo) === roomTitle);
              setRoomAssignment(prev => ({
                ...prev,
                roomUnit: roomTitle,
                floor: room?.floor || prev.floor,
                roomType: room?.type || room?.roomType || prev.roomType,
                bed: ""
              }));
              if (room?.rent || room?.price) {
                const p = String(room.rent || room.price || "");
                setTenancyDetails(prev => ({
                  ...prev,
                  baseRoomRent: p,
                  rentAmount: p,
                  discount: "0"
                }));
              }
            };

            return (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
                <h3 className="font-serif text-[20px] text-slate-800 flex items-center gap-2">
                  <Home size={18} className="text-primary" />
                  2. Room & Bed Allocation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormSelect
                    label="Property"
                    required
                    value={roomAssignment.propertyId}
                    onChange={e => setRoomAssignment({ propertyId: e.target.value, building: "", floor: "", roomUnit: "", roomType: "", bed: "", rentAgreementType: roomAssignment.rentAgreementType, propertyAddress: roomAssignment.propertyAddress })}
                    options={properties.map(p => ({ label: p.title, value: p._id }))}
                    placeholder="Select property"
                    error={errors.propertyId}
                  />
                  <FormSelect
                    label="Floor"
                    required
                    value={roomAssignment.floor}
                    onChange={e => setRoomAssignment({ ...roomAssignment, floor: e.target.value, roomUnit: "", bed: "" })}
                    options={
                      floorOptions.length > 0
                        ? floorOptions.map(f => ({ label: f, value: f }))
                        : ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor"]
                    }
                    placeholder={roomAssignment.propertyId ? "Select floor" : "Select property first"}
                    error={errors.floor}
                  />
                  <FormSelect
                    label="Room Number"
                    required
                    value={roomAssignment.roomUnit}
                    onChange={e => handleRoomSelect(e.target.value)}
                    options={
                      roomsForFloor.length > 0
                        ? roomsForFloor.map(r => {
                          const label = r.title || r.number || r.roomNo || r._id;
                          return { label, value: label };
                        })
                        : []
                    }
                    placeholder={roomAssignment.propertyId ? (rooms.length === 0 ? "No rooms found" : "Select room") : "Select property first"}
                    error={errors.roomUnit}
                  />
                  <FormSelect
                    label="Room Type"
                    value={roomAssignment.roomType}
                    onChange={e => setRoomAssignment({ ...roomAssignment, roomType: e.target.value })}
                    options={(() => {
                      const selectedProp = properties.find(p => p._id === roomAssignment.propertyId);
                      if (selectedProp && Array.isArray(selectedProp.roomTypes) && selectedProp.roomTypes.length > 0) {
                        return selectedProp.roomTypes.map(rt => ({ label: rt.type, value: rt.type }));
                      }
                      return ["AC", "Non-AC", "Single", "Double", "Triple"];
                    })()}
                    placeholder="Select room type"
                  />
                  <FormSelect
                    label="Bed"
                    value={roomAssignment.bed}
                    onChange={e => setRoomAssignment({ ...roomAssignment, bed: e.target.value })}
                    options={
                      selectedRoom
                        ? bedOptions
                        : [{ label: "Bed 1", value: "1" }, { label: "Bed 2", value: "2" }, { label: "Bed 3", value: "3" }, { label: "Bed 4", value: "4" }]
                    }
                    placeholder={roomAssignment.roomUnit ? "Select bed" : "Select room first"}
                  />
                  <FormSelect
                    label="Rent Agreement Type"
                    required
                    value={roomAssignment.rentAgreementType}
                    onChange={e => setRoomAssignment({ ...roomAssignment, rentAgreementType: e.target.value })}
                    options={["Standard", "Short Term", "Long Term", "Custom"]}
                    error={errors.rentAgreementType}
                  />
                  <div className="sm:col-span-3">
                    <FormField
                      label="Property Address"
                      value={roomAssignment.propertyAddress}
                      onChange={e => setRoomAssignment({ ...roomAssignment, propertyAddress: e.target.value })}
                      placeholder="Full address of the property"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Section 3 */}
          {(!isMobile || activeMobileTab === 3) && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
              <h3 className="font-serif text-[20px] text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                3. Stay & Billing Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormField
                  label="Base Room Price (₹)"
                  value={tenancyDetails.baseRoomRent}
                  onChange={e => {
                    const actual = parseFloat(e.target.value) || 0;
                    const disc = parseFloat(tenancyDetails.discount) || 0;
                    const finalRent = Math.max(0, actual - disc);
                    setTenancyDetails({
                      ...tenancyDetails,
                      baseRoomRent: e.target.value,
                      rentAmount: finalRent.toString()
                    });
                  }}
                  placeholder="Base room price"
                  type="number"
                />

                <FormField
                  label="Agreed Rent (₹)"
                  required
                  value={tenancyDetails.rentAmount}
                  onChange={e => {
                    const actual = parseFloat(tenancyDetails.baseRoomRent) || 0;
                    const finalRent = parseFloat(e.target.value) || 0;
                    if (actual === 0) {
                      setTenancyDetails({
                        ...tenancyDetails,
                        baseRoomRent: e.target.value,
                        rentAmount: e.target.value,
                        discount: "0"
                      });
                    } else {
                      const disc = Math.max(0, actual - finalRent);
                      setTenancyDetails({
                        ...tenancyDetails,
                        rentAmount: e.target.value,
                        discount: disc.toString()
                      });
                    }
                  }}
                  placeholder="Rent agreed with tenant"
                  type="number"
                  error={errors.rentAmount}
                />
                <FormField
                  label="Deposit Amount (₹)"
                  required
                  value={tenancyDetails.depositAmount}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, depositAmount: e.target.value })}
                  placeholder="Enter deposit amount"
                  type="number"
                  error={errors.depositAmount}
                />
                <FormField
                  label="Move-in Date"
                  required
                  value={tenancyDetails.moveInDate}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, moveInDate: e.target.value })}
                  type="date"
                  error={errors.moveInDate}
                />
                <FormField
                  label="Minimum Stay (Months)"
                  required
                  value={tenancyDetails.minStay}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, minStay: e.target.value })}
                  placeholder="Enter minimum stay"
                  type="number"
                />
                <FormField
                  label="Notice Period (Days)"
                  required
                  value={tenancyDetails.noticePeriod}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, noticePeriod: e.target.value })}
                  placeholder="Enter notice period"
                  type="number"
                />
                <FormField
                  label="License Fee Due Date (day of month)"
                  value={tenancyDetails.rentDueDate}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, rentDueDate: e.target.value })}
                  placeholder="e.g. 5"
                  type="number"
                />
                <FormField
                  label="License Duration (months)"
                  value={tenancyDetails.licenseDuration}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, licenseDuration: e.target.value })}
                  placeholder="e.g. 11"
                  type="number"
                />
                <FormSelect
                  label="Payment Frequency"
                  required
                  value={tenancyDetails.paymentFrequency}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, paymentFrequency: e.target.value })}
                  options={["Monthly", "Quarterly", "Semi-Annually", "Annually"]}
                  error={errors.paymentFrequency}
                />
                <FormField
                  label="Move Out Charges (₹)"
                  value={tenancyDetails.moveOutCharges}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, moveOutCharges: e.target.value })}
                  placeholder="0"
                  type="number"
                />
                <FormField
                  label="Notice Period Charges (₹)"
                  value={tenancyDetails.noticePeriodCharges}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, noticePeriodCharges: e.target.value })}
                  placeholder="0"
                  type="number"
                />
                <FormField
                  label="Advance / Move-in Charge (₹)"
                  value={tenancyDetails.advanceChargeAmount}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, advanceChargeAmount: e.target.value })}
                  placeholder="0"
                  type="number"
                />
                <FormField
                  label="GST Charges (₹)"
                  value={tenancyDetails.gstCharges}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, gstCharges: e.target.value })}
                  placeholder="0"
                  type="number"
                />
                <FormField
                  label="Late Fee (₹)"
                  value={tenancyDetails.lateFee}
                  onChange={e => setTenancyDetails({ ...tenancyDetails, lateFee: e.target.value })}
                  placeholder="0"
                  type="number"
                />
                <div className="sm:col-span-4">
                  <FormField
                    label="Inclusions (WiFi, meals, etc.)"
                    value={tenancyDetails.inclusions}
                    onChange={e => setTenancyDetails({ ...tenancyDetails, inclusions: e.target.value })}
                    placeholder="e.g. WiFi, 2 meals/day, housekeeping"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4 */}
          {(!isMobile || activeMobileTab === 4) && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
              <h3 className="font-serif text-[20px] text-slate-800 flex items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                4. Occupation & Emergencies
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Occupation"
                  value={additionalDetails.occupation}
                  onChange={e => setAdditionalDetails({ ...additionalDetails, occupation: e.target.value })}
                  placeholder="Enter occupation"
                />
                <FormField
                  label="Company / Organization"
                  value={additionalDetails.company}
                  onChange={e => setAdditionalDetails({ ...additionalDetails, company: e.target.value })}
                  placeholder="Enter company name"
                />
                <FormField
                  label="Emergency Contact Name"
                  required
                  value={additionalDetails.emergencyName}
                  onChange={e => setAdditionalDetails({ ...additionalDetails, emergencyName: e.target.value })}
                  placeholder="Enter contact name"
                  error={errors.emergencyName}
                />
                <FormField
                  label="Emergency Contact Number"
                  required
                  value={additionalDetails.emergencyPhone}
                  onChange={e => setAdditionalDetails({ ...additionalDetails, emergencyPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="Enter phone number"
                  prefix="+91"
                  error={errors.emergencyPhone}
                />
                <FormField
                  label="Relationship"
                  required
                  value={additionalDetails.relationship}
                  onChange={e => setAdditionalDetails({ ...additionalDetails, relationship: e.target.value })}
                  placeholder="Select relationship"
                  error={errors.relationship}
                />
                <div className="sm:col-span-3">
                  <FormField
                    label="Permanent Address (optional — tenant can fill in KYC)"
                    value={additionalDetails.permanentAddress}
                    onChange={e => setAdditionalDetails({ ...additionalDetails, permanentAddress: e.target.value })}
                    placeholder="House/Flat No., Street, Area, City, State, PIN"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black text-slate-800 uppercase mb-3 block tracking-tight">Remarks (Optional)</label>
                  <textarea
                    value={additionalDetails.remarks}
                    onChange={e => setAdditionalDetails({ ...additionalDetails, remarks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11.5px] font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-200 transition-all h-24 resize-none"
                    placeholder="Enter remarks..."
                  />
                </div>
              </div>
            </div>
          )}

          {(!isMobile || activeMobileTab === 4) && (
            <div className="flex items-center gap-3 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div
                onClick={() => setConfirmDetails(!confirmDetails)}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all",
                  confirmDetails ? "bg-slate-900 border-slate-900 shadow-md" : "bg-white border-slate-200"
                )}
              >
                {confirmDetails && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">I confirm the above details are correct.</p>
            </div>
          )}

          {isMobile && activeMobileTab === 4 && (
            <div className="flex items-center justify-between gap-2 mt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-10 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editMode ? "Save Changes" : "Save & Onboard"}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        {(!isMobile || activeMobileTab === 4) && (
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              {/* Onboarding Summary */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-serif text-[16px] text-foreground">
                  {editMode ? "Tenant Details Summary" : "Onboarding Summary"}
                </h3>
                <div className="divide-y divide-border">
                  {(() => {
                    const propName = properties.find(p => p._id === roomAssignment.propertyId)?.title;
                    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                    const rows = [
                      { label: "Tenant Name", val: basicDetails.fullName },
                      { label: "Email", val: basicDetails.email },
                      { label: "Phone", val: basicDetails.phone },
                      { label: "Property", val: propName },
                      { label: "Floor", val: roomAssignment.floor },
                      { label: "Room Number", val: roomAssignment.roomUnit },
                      { label: "Accommodation Type", val: roomAssignment.roomType },
                      { label: "Bed", val: roomAssignment.bed },
                      { label: "Agreed Rent (₹)", val: tenancyDetails.rentAmount ? `₹${tenancyDetails.rentAmount}` : null },
                      { label: "Deposit", val: tenancyDetails.depositAmount ? `₹${tenancyDetails.depositAmount}` : null },
                      { label: "Move-in Date", val: fmtDate(tenancyDetails.moveInDate) !== "—" ? fmtDate(tenancyDetails.moveInDate) : null },
                      { label: "Minimum Stay", val: tenancyDetails.minStay ? `${tenancyDetails.minStay} months` : null },
                      { label: "Notice Period", val: tenancyDetails.noticePeriod ? `${tenancyDetails.noticePeriod} days` : null },
                      { label: "Rent Due Date", val: tenancyDetails.rentDueDate },
                    ];
                    return rows.map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center py-2 gap-2">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight shrink-0">{label}</span>
                        <span className="text-[10.5px] font-black text-slate-700 text-right truncate max-w-[55%]">{val || "—"}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Onboarding Timeline */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="font-serif text-[16px] text-foreground">Onboarding Timeline</h3>
                <div className="space-y-6">
                  {[
                    { step: 1, title: "Personal Details & Room", sub: "Add tenant details, assign room and tenancy information.", status: "In Progress" },
                    { step: 2, title: "E-KYC Verification", sub: "An E-KYC link will be sent to the tenant's email and phone.", status: "Pending" },
                    { step: 3, title: "E-Sign Agreement", sub: "After successful KYC, rental agreement link will be sent for e-sign.", status: "Pending" },
                    { step: 4, title: "Tenant Added", sub: "Tenant will be added after agreement is signed successfully.", status: "Pending" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 relative group">
                      {i !== 3 && <div className="absolute left-[11px] top-6 bottom-[-20px] w-[2px] bg-slate-100 group-last:hidden" />}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 relative z-10",
                        item.status === "In Progress" ? "bg-slate-900 text-white ring-4 ring-slate-100" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.step}
                      </div>
                      <div>
                        <h4 className={cn("text-[10px] font-black uppercase tracking-tight mb-1", item.status === "In Progress" ? "text-slate-800" : "text-slate-400")}>{item.title}</h4>
                        <p className="text-[9.5px] font-bold text-slate-400 leading-normal max-w-[200px]">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end scrollable sticky wrapper */}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && newTenant && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => navigate("/propertyowner/tenants")} />
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
              </div>

              <button
                onClick={() => navigate("/propertyowner/tenants")}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
              >
                Go to Tenant List
              </button>
            </div>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
