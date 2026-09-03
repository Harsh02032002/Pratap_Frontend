import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, RefreshCw,
  Sparkles, Layers, Box, Globe2, IndianRupee,
  Plus, Loader2, Save, Smartphone, Monitor, Info,
  UserPlus, Send, Lock, ChevronDown, Wifi, ShieldCheck,
  UtensilsCrossed, Cigarette, PawPrint, BedDouble, DoorOpen
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchJson, getAuthHeader, getApiBase } from "../../utils/api";
import { compressImage, PRESETS } from "../../utils/imageCompression";
import { PROPERTY_TIERS, normalizeTierKey } from "../../utils/propertyTiers";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const bankNameMatches = (enteredName, apiBankName) => {
  const ignored = new Set(["BANK", "OF", "THE", "LIMITED", "LTD", "INDIA"]);
  const tokens = (value) => String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !ignored.has(token));
  const entered = tokens(enteredName);
  const expected = tokens(apiBankName);
  return !enteredName || entered.some((token) => expected.includes(token));
};

/** One photo tile. `badge` says which of the two groups it belongs to. */
function PhotoThumb({ url, badge, onRemove }) {
  return (
    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 aspect-video">
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        onError={e => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"}
      />
      <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs p-2 text-[9px] font-bold">
        {badge}
      </div>
      <button type="button" onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Toasts ───────────────────────────────────────────────────────────────────
// Submitting a report has more to say than a one-liner — which owner was
// mailed, that the property is not live yet — and a native alert() forced all
// of it into one blocking string the user had to dismiss before carrying on.
// A toast can carry a title, that detail, and a dismiss, without stealing focus
// from the form. The <Toaster/> is already mounted app-wide in App.jsx.

const TOAST_VARIANTS = {
  success: { Icon: CheckCircle2,   ring: "ring-emerald-500/20", chip: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
  warning: { Icon: AlertTriangle,  ring: "ring-amber-500/20",   chip: "bg-amber-50 text-amber-600",     bar: "bg-amber-500"   },
  error:   { Icon: XCircle,        ring: "ring-rose-500/20",    chip: "bg-rose-50 text-rose-600",       bar: "bg-rose-500"    },
  info:    { Icon: Info,           ring: "ring-blue-500/20",    chip: "bg-blue-50 text-blue-600",       bar: "bg-blue-500"    },
};

/**
 * One toast card: coloured rail, icon chip, title, optional detail, dismiss.
 *
 * `t.visible` is what react-hot-toast flips to drive enter/leave, so the
 * transition is expressed here rather than left to the library's default.
 */
function ActionToast({ t, variant = "info", title, detail, hint }) {
  const { Icon, ring, chip, bar } = TOAST_VARIANTS[variant] || TOAST_VARIANTS.info;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-xl ring-1",
        ring,
        "transition-all duration-200 ease-out",
        t.visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-1 opacity-0 scale-95"
      )}
    >
      <div className="flex">
        <div className={cn("w-1 shrink-0", bar)} />
        <div className="flex flex-1 items-start gap-3 p-3.5">
          <div className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl", chip)}>
            <Icon className="size-[18px]" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-slate-900">{title}</p>
            {detail && <p className="mt-0.5 break-words text-[12px] leading-relaxed text-slate-600">{detail}</p>}
            {hint && (
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{hint}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Dismiss"
            className="-m-1 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Errors linger; the rest clear themselves. */
const notify = (variant, title, detail, hint) =>
  toast.custom(
    (t) => <ActionToast t={t} variant={variant} title={title} detail={detail} hint={hint} />,
    { duration: variant === "error" ? 6000 : variant === "success" ? 4500 : 5000 }
  );

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "hostel", label: "Hostel / PG", icon: Users, color: "blue" },
  { value: "pg", label: "PG / Paying Guest", icon: User, color: "indigo" },
  { value: "apartment", label: "Apartment", icon: Building2, color: "emerald" },
];

const GENDER_OPTIONS = ["Co-ed", "Male Only", "Female Only"];

const AMENITY_LIST = [
  "WiFi", "Power Backup", "24x7 Water", "RO Water", "Air Conditioning",
  "CCTV", "Security Guard", "Attached Bathroom", "Study Table", "Wardrobe",
  "Bed with Mattress", "Kitchen", "Refrigerator", "Geyser",
  "Parking", "Washing Machine", "Gym", "Housekeeping", "Food",
  "TV", "Lounge", "Balcony / Terrace", "Garden", "Lift"
];

const FURNISHING_OPTIONS = ["Fully Furnished", "Semi Furnished", "Unfurnished"];

// ─── Shared Components ────────────────────────────────────────────────────────

const FormField = ({ label, value, onChange, placeholder, type = "text", suffix, prefix, required, className }) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
      {prefix && <span className="text-[10px] font-black text-slate-400 mr-2">{prefix}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
      />
      {suffix && <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-tight">{suffix}</span>}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, open, onToggle, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-slate-50/50 transition-all group">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", open && "rotate-180")} />
    </button>
  );
};

const SECTION_COLORS = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
};

const DetailSection = ({ icon: Icon, title, color = "slate", children }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm", SECTION_COLORS[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{title}</p>
    </div>
    {children}
  </div>
);

const DetailGrid = ({ cols = 2, children }) => (
  <div className={cn("grid gap-4", cols === 3 ? "grid-cols-2 md:grid-cols-3" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2")}>
    {children}
  </div>
);

// Approval is gated on the owner finishing digital KYC. The backend keeps
// VisitData.kycStatus in sync with the owner's check-in progress and enforces the
// same rule on POST /api/visits/approve — this is the UI half of that gate.
const KYC_STATES = {
  completed: { label: "KYC Completed", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  sent: { label: "KYC Pending", cls: "bg-amber-50 text-amber-600 border-amber-100" },
  not_sent: { label: "KYC Not Sent", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const kycState = (v) => KYC_STATES[v?.kycStatus] || KYC_STATES.not_sent;
const isKycDone = (v) => v?.kycStatus === "completed";

const tierMeta = (key) => PROPERTY_TIERS.find(t => t.key === key) || null;

// A visit captures rent either as one monthly figure or per room type. Fall back
// to the cheapest room-type price so a property that *does* have pricing never
// renders as ₹0 — and surface a real 0 as "not set" rather than a free room.
const visitRent = (v) => {
  const base = Number(v?.monthlyRent) || 0;
  if (base > 0) return base;
  const prices = (v?.roomTypes || [])
    .map(rt => Number(rt?.pricePerBed) || Number(rt?.pricePerRoom) || 0)
    .filter(n => n > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const formatRent = (v) => {
  const rent = visitRent(v);
  return rent > 0 ? `₹${rent.toLocaleString("en-IN")}/mo` : null;
};

const DetailItem = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-700 break-words">{value || value === 0 ? String(value) : "-"}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Visit() {
  const [currentView, setCurrentView] = useState("list");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingVisit, setViewingVisit] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [ownerKyc, setOwnerKyc] = useState(null);
  const [ownerKycLoading, setOwnerKycLoading] = useState(false);
  // Tier a superadmin assigns during review, gating Approve alongside KYC.
  // Keyed by visitId/_id, same idiom as `openSections` below.
  const [selectedTiers, setSelectedTiers] = useState({});

  // This component is mounted at both /superadmin/visit and /employee/visit
  // (see pages/employee/visit.jsx). Approving publishes a property to the public
  // site, so that action stays superadmin-only; staff get read + resend KYC.
  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
  const canApprove = !isEmployeeView;

  const tierFor = (v) => selectedTiers[v?.visitId || v?._id] ?? normalizeTierKey(v?.tier);
  const isTierSelected = (v) => Boolean(tierFor(v));
  const setTierForVisit = (v, tier) => {
    const id = v?.visitId || v?._id;
    setSelectedTiers(prev => ({ ...prev, [id]: tier }));
  };

  // ─── Form State ─────────────────────────────────────────────────────────────
  // Owner Identity
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOwnerCity, setFormOwnerCity] = useState("");

  // Property Details
  const [formPropertyName, setFormPropertyName] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("hostel");
  const [formGender, setFormGender] = useState("Co-ed");
  const [formRent, setFormRent] = useState("");
  const [formDeposit, setFormDeposit] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Location
  const [formArea, setFormArea] = useState("");
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [locationCities, setLocationCities] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  const [formAddress, setFormAddress] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formLandmark, setFormLandmark] = useState("");

  // Occupancy
  const [formVacantRooms, setFormVacantRooms] = useState("");
  const [formOccupiedRooms, setFormOccupiedRooms] = useState("");
  const [formOccupiedBeds, setFormOccupiedBeds] = useState("");

  // Features
  const [formAmenities, setFormAmenities] = useState(new Set(["WiFi", "Power Backup"]));
  const [formFurnishing, setFormFurnishing] = useState("Fully Furnished");
  const [formVentilation, setFormVentilation] = useState("");
  const [formMinStay, setFormMinStay] = useState("");
  const [formEntryExit, setFormEntryExit] = useState("");

  // Policies
  const [formVisitorsAllowed, setFormVisitorsAllowed] = useState(true);
  const [formCookingAllowed, setFormCookingAllowed] = useState(false);
  const [formSmokingAllowed, setFormSmokingAllowed] = useState(false);
  const [formPetsAllowed, setFormPetsAllowed] = useState(false);

  // Ratings & Notes
  const [formCleanlinessRating, setFormCleanlinessRating] = useState(0);
  const [formOwnerBehaviour, setFormOwnerBehaviour] = useState("");
  const [formStudentReviews, setFormStudentReviews] = useState("");
  const [formInternalRemarks, setFormInternalRemarks] = useState("");

  // Photos & Camera with Timestamps
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formPhotos, setFormPhotos] = useState([]);         // flat list of all uploaded proof photos
  const [formPhotoDetails, setFormPhotoDetails] = useState([]); // [{ url, capturedAt, source }]
  const [formRoomTypes, setFormRoomTypes] = useState([]);

  // PropertyViews — same structure as AddPropertyWizard
  // [{ label: "Main", images: [url, url] }, { label: "Room", images: [...] }]
  const [propertyViews, setPropertyViews] = useState([
    { label: "Main", images: [] },
    { label: "Room", images: [] },
  ]);
  const [activeCatIdx, setActiveCatIdx] = useState(0);  // which category tab is open
  const [newCatLabel, setNewCatLabel] = useState("");    // for adding new category
  const [addingCat, setAddingCat] = useState(false);    // show input field

  // Owner Bank Details
  const [formBankHolderName, setFormBankHolderName] = useState("");
  const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
  const [formReBankAccountNumber, setFormReBankAccountNumber] = useState("");
  const [formBankIfscCode, setFormBankIfscCode] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formBankBranchName, setFormBankBranchName] = useState("");
  const [formBankUpiId, setFormBankUpiId] = useState("");
  const [ifscLookupLoading, setIfscLookupLoading] = useState(false);
  const [ifscLookupStatus, setIfscLookupStatus] = useState(null);

  const handleIfscBlur = async (code) => {
    const cleanCode = (code || '').replace(/[^a-z0-9]/gi, '').trim().toUpperCase();
    setFormBankIfscCode(cleanCode);
    if (!cleanCode) {
      setIfscLookupStatus(null);
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanCode)) {
      setIfscLookupStatus({ valid: false, message: 'Invalid format: Must start with 4 letters + 0 (e.g. SBIN0001234 or HDFC0000060)' });
      return;
    }
    try {
      setIfscLookupLoading(true);
      let res;
      try {
        res = await fetchJson(`/api/bank/ifsc/${cleanCode}`);
      } catch (localError) {
        if (localError?.status !== 404) throw localError;
        const razorpayResponse = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(cleanCode)}`);
        const razorpayData = await razorpayResponse.json().catch(() => ({}));
        if (!razorpayResponse.ok) {
          throw new Error('IFSC code not found in Razorpay bank database.');
        }
        res = {
          success: Boolean(razorpayData.BANK),
          ifscStatus: razorpayData.BANK ? 'valid' : 'invalid',
          bankName: razorpayData.BANK || '',
          branchName: razorpayData.BRANCH || ''
        };
      }
      if (res && res.success && res.ifscStatus === 'valid') {
        if (res.bankName && formBankName && !bankNameMatches(formBankName, res.bankName)) {
          setIfscLookupStatus({
            valid: false,
            message: `This IFSC belongs to ${res.bankName}, not ${formBankName}.`,
            bankName: res.bankName,
            branchName: res.branchName
          });
          return;
        }
        if (res.bankName && !formBankName) setFormBankName(res.bankName);
        if (res.branchName && !formBankBranchName) setFormBankBranchName(res.branchName);
        setIfscLookupStatus({ valid: true, message: `Verified IFSC: ${res.bankName} (${res.branchName})`, bankName: res.bankName, branchName: res.branchName });
      } else {
        setIfscLookupStatus({ valid: false, message: res?.message || 'Invalid IFSC code' });
      }
    } catch (err) {
      setIfscLookupStatus({ valid: false, message: err?.message || 'IFSC service unavailable. Please try again.' });
    } finally {
      setIfscLookupLoading(false);
    }
  };

  // Live Camera modal state & refs
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const geoLocationRef = React.useRef(null);
  const [geoStatus, setGeoStatus] = useState("idle");

  const [photoUploading, setPhotoUploading] = useState(0);

  /**
   * Put a photo in Cloudinary and return its https URL.
   *
   * Visit photos used to be stored as base64 data: URLs straight in Mongo, and
   * the public listing endpoint drops anything starting with "data:" — so every
   * photo taken through this form was invisible on the website no matter how it
   * was classified. Uploading gives a real URL the site can actually render,
   * and keeps multi-megabyte base64 blobs out of the visit document.
   */
  const uploadPhotoToCloud = async (blob, filename) => {
    const body = new FormData();
    body.append("file", blob, filename);
    const res = await fetch(`${getApiBase()}/api/upload`, {
      method: "POST",
      headers: { ...getAuthHeader() },   // NOT Content-Type: the browser sets the multipart boundary
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !(data.url || data.secure_url)) {
      throw new Error(data.message || data.error || `Upload failed (${res.status})`);
    }
    return data.url || data.secure_url;
  };

  const addPhotoWithUrl = (urlStr) => {
    if (!urlStr) return;
    setFormPhotos(prev => [...prev, urlStr]);
    setFormPhotoDetails(prev => [...prev, { url: urlStr, source: "url" }]);
    setFormPhotoUrl("");
  };

  const removePhoto = (idx) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== idx));
    setFormPhotoDetails(prev => prev.filter((_, i) => i !== idx));
  };

  const startCamera = async () => {
    try {
      setCameraModalOpen(true);
      setGeoStatus("loading");
      getGeoLocation().then((location) => {
        geoLocationRef.current = location;
        setGeoStatus(location?.placeName ? "ready" : location ? "coordinates-only" : "unavailable");
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      notify("warning", "Camera unavailable", `${err.message}. You can upload a photo file instead.`);
      setCameraModalOpen(false);
    }
  };

  // Try to get device GPS location
  const getGeoLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = {
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
          accuracy: Math.round(pos.coords.accuracy || 0),
          placeName: "",
          placeAddress: ""
        };
        try {
          const params = new URLSearchParams({
            lat: location.lat,
            lon: location.lon,
            accuracy: String(location.accuracy),
            ...(formCity ? { expectedCity: formCity } : {})
          });
          const reverse = await fetchJson(`/api/locations/reverse-geocode?${params.toString()}`);
          location.placeName = reverse?.shortName || reverse?.placeName || reverse?.displayName || "";
          location.placeAddress = reverse?.displayName || "";
          location.locationTrusted = reverse?.verification?.trusted !== false;
        } catch (_) {}
        if (!location.placeName) {
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lon}&zoom=18&addressdetails=1`);
            const data = await response.json();
            const address = data?.address || {};
            const locality = address.suburb || address.neighbourhood || address.village || address.town || "";
            const city = address.city || address.town || address.village || address.state_district || "";
            location.placeName = [locality, city].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ") || String(data?.display_name || "").split(",").slice(0, 3).join(", ").trim();
            location.placeAddress = data?.display_name || "";
          } catch (_) {}
        }
        resolve(location);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraModalOpen(false);
    setGeoStatus("idle");
  };

  /**
   * Snap the frame and burn the timestamp + location into the pixels.
   * Live captures = INTERNAL PROOF ONLY — they go to superadmin, not the website.
   * Only category-upload photos (Step 2 below) are published to the website.
   */
  const capturePhotoFromCamera = async () => {
    if (!videoRef.current || !streamRef.current) {
      notify("warning", "Camera is not ready", "Please wait for the camera preview and try again.");
      return;
    }
    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      notify("warning", "Camera is still loading", "Please wait a moment for the preview, then take the photo again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get location in parallel with drawing
    const geo = geoLocationRef.current || await getGeoLocation();
    geoLocationRef.current = geo;

    const timeStr = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });

    const geoStr = geo
      ? `📍 ${geo.placeName || `${geo.lat}, ${geo.lon}`}`
      : "📍 Location unavailable";

    // Scale every dimension off the image height so the banner is equally
    // legible on a 720p webcam frame and a 12MP phone capture.
    const unit = Math.max(11, Math.round(canvas.height * 0.022));
    const pad = Math.round(unit * 0.8);
    const bannerHeight = (unit + pad * 2) * 2; // 2 lines now: time + geo

    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(0, canvas.height - bannerHeight, Math.max(3, Math.round(unit * 0.28)), bannerHeight);

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `bold ${unit}px sans-serif`;
    // Line 1: timestamp
    ctx.fillText(
      `ROOMHY LIVE VISIT  •  ${timeStr}`,
      pad + Math.round(unit * 0.9),
      canvas.height - bannerHeight + (bannerHeight / 2) - unit * 0.6
    );
    // Line 2: geo
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${Math.round(unit * 0.85)}px sans-serif`;
    ctx.fillText(
      geoStr,
      pad + Math.round(unit * 0.9),
      canvas.height - bannerHeight + (bannerHeight / 2) + unit * 0.6
    );

    stopCamera();

    setPhotoUploading(n => n + 1);
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not read the captured frame")), "image/jpeg", 0.85);
      });
      const url = await uploadPhotoToCloud(blob, `live-capture-${Date.now()}.jpg`);
      setFormPhotos(prev => [...prev, url]);
      setFormPhotoDetails(prev => [...prev, {
        url,
        capturedAt: timeStr,
        geoLocation: geo ? `${geo.lat}, ${geo.lon}` : null,
        placeName: geo?.placeName || "",
        placeAddress: geo?.placeAddress || "",
        latitude: geo ? Number(geo.lat) : null,
        longitude: geo ? Number(geo.lon) : null,
        accuracy: geo?.accuracy || null,
        locationTrusted: geo?.locationTrusted !== false,
        source: "camera",
        websiteVisible: false
      }]);
    } catch (err) {
      notify("error", "Could not save the photo", `${err.message}. The capture was not added — please take it again.`);
    } finally {
      setPhotoUploading(n => n - 1);
    }
  };

  const handleFileUpload = async (e, category = null) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      setPhotoUploading(n => n + 1);
      try {
        const small = await compressImage(file, PRESETS.PHOTO);
        const url = await uploadPhotoToCloud(small, small.name || file.name || "photo.jpg");
        if (category) {
          // Category upload → goes to website
          setCategoryPhotos(prev => ({
            ...prev,
            [category]: [...(prev[category] || []), url]
          }));
        } else {
          // Generic upload
          setFormPhotos(prev => [...prev, url]);
          setFormPhotoDetails(prev => [...prev, { url, source: "upload", websiteVisible: true }]);
        }
      } catch (err) {
        notify("error", "Photo upload failed", `${file.name}: ${err.message}. It was not added — please try again.`);
      } finally {
        setPhotoUploading(n => n - 1);
      }
    }
  };

  // UI state
  const [saving, setSaving] = useState(false);
  // Rejection is a two-step action: the comment is optional, but it is the only
  // thing that tells the employee WHY their report came back, so it gets a
  // proper modal rather than a window.prompt.
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  // Id for the report currently being filled in. Held in a ref so a retry after
  // a failed submit reuses it instead of minting a new one — a fresh id per
  // click made every retry a NEW visit report and a SECOND KYC email to the
  // owner. Cleared by resetForm() once the report is actually filed.
  const draftVisitIdRef = useRef(null);
  const [openSections, setOpenSections] = useState({
    owner: true, property: true, location: true, occupancy: false,
    features: false, roomTypes: false, policies: false, ratings: false, photos: false
  });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  // Photos grouped by HOW they were added — a live capture is timestamped on
  // the spot, an upload is a file chosen from disk. This is a presentation
  // split only: both kinds are published to the website exactly the same.
  //
  // The original index is carried along because formPhotos and formPhotoDetails
  // stay a single parallel pair — removePhoto(idx) addresses the flat list.
  const indexedPhotos = formPhotos.map((url, idx) => ({ url, idx, detail: formPhotoDetails[idx] || { url } }));
  const livePhotos = indexedPhotos.filter(p => p.detail.source === "camera");
  // Anything not marked as a live capture, including older entries saved before
  // `source` was recorded.
  const uploadedPhotos = indexedPhotos.filter(p => p.detail.source !== "camera");

  const toggleAmenity = (a) => setFormAmenities(prev => { const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n; });

  // ─── Data Loading ───────────────────────────────────────────────────────────

  const loadVisits = async () => {
    try {
      setLoading(true);
      const isEmpPage = window.location.pathname.startsWith("/employee");
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      let url = "/api/visits";
      if (isEmpPage && (storedUser.loginId || storedUser.employeeId || storedUser.name)) {
        const sid = storedUser.loginId || storedUser.employeeId || storedUser.name;
        url += `?staffId=${encodeURIComponent(sid)}&staffName=${encodeURIComponent(storedUser.name || "")}`;
      }
      const data = await fetchJson(url);
      const list = data?.visits || data || [];
      setVisits(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVisits(); }, []);

  useEffect(() => {
    fetchJson("/api/locations/cities")
      .then((response) => setLocationCities(Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])))
      .catch(() => setLocationCities([]));
  }, []);

  useEffect(() => {
    if (!formCity) { setLocationAreas([]); return; }
    fetchJson(`/api/locations/areas/city/${encodeURIComponent(formCity)}`)
      .then((response) => setLocationAreas(Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : [])))
      .catch(() => setLocationAreas([]));
  }, [formCity]);

  // Pull the owner's submitted digital-KYC record for the details modal.
  // GET /api/owners/:loginId already merges Owner + CheckinRecord + VisitData,
  // so it is the one place holding everything the owner filled in.
  useEffect(() => {
    const loginId = viewingVisit?.generatedCredentials?.loginId;
    if (!viewingVisit || !loginId) { setOwnerKyc(null); return; }
    let cancelled = false;
    setOwnerKycLoading(true);
    fetchJson(`/api/owners/${encodeURIComponent(loginId)}`)
      .then(data => { if (!cancelled) setOwnerKyc(data?.owner || data || null); })
      .catch(err => { if (!cancelled) { console.warn("Owner KYC fetch failed:", err.message); setOwnerKyc(null); } })
      .finally(() => { if (!cancelled) setOwnerKycLoading(false); });
    return () => { cancelled = true; };
  }, [viewingVisit]);

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormOwnerCity("");
    setFormBankHolderName(""); setFormBankAccountNumber(""); setFormReBankAccountNumber(""); setFormBankIfscCode(""); setFormBankName(""); setFormBankBranchName(""); setFormBankUpiId("");
    setFormPropertyName(""); setFormPropertyType("hostel"); setFormGender("Co-ed");
    setFormRent(""); setFormDeposit(""); setFormDescription("");
    setFormState(""); setFormArea(""); setFormCity(""); setFormAddress(""); setFormPincode(""); setFormLandmark("");
    setFormVacantRooms(""); setFormOccupiedRooms(""); setFormOccupiedBeds("");
    setFormAmenities(new Set(["WiFi", "Power Backup"])); setFormFurnishing("Fully Furnished");
    setFormVentilation(""); setFormMinStay(""); setFormEntryExit("");
    setFormVisitorsAllowed(true); setFormCookingAllowed(false); setFormSmokingAllowed(false); setFormPetsAllowed(false);
    setFormCleanlinessRating(0); setFormOwnerBehaviour(""); setFormStudentReviews(""); setFormInternalRemarks("");
    setFormPhotoUrl(""); setFormPhotos([]); setFormPhotoDetails([]); setFormRoomTypes([]);
    setPropertyViews([{ label: "Main", images: [] }, { label: "Room", images: [] }]);
    setActiveCatIdx(0); setNewCatLabel(""); setAddingCat(false);
    setOpenSections({ owner: true, property: true, location: true, occupancy: false, features: false, roomTypes: false, policies: false, ratings: false, photos: false });
    draftVisitIdRef.current = null;
  };

  // ─── Onboarding Handler ─────────────────────────────────────────────────────

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail || !formPropertyName) {
      return notify("warning", "Missing required details", "Owner name, email, phone and property name are all needed before this report can be filed.");
    }
    // Rent drives the public listing price — a property published at ₹0 is not usable.
    if (!(parseInt(formRent, 10) > 0)) {
      return notify("warning", "Monthly rent is required", "Rent drives the public listing price — a property published at ₹0 is not usable.");
    }
    // Account Number matching validation
    if (formBankAccountNumber || formReBankAccountNumber) {
      if (formBankAccountNumber !== formReBankAccountNumber) {
        return notify("warning", "Account Numbers Do Not Match", "Bank Account Number and Re-entered Account Number must match exactly.");
      }
    }
    if (ifscLookupStatus?.valid === false) {
      return notify("warning", "Bank details do not match", ifscLookupStatus.message);
    }
    setSaving(true);
    try {
      // Submit the visit report. The backend files it and replies immediately,
      // then issues the owner's credentials and emails the digital-KYC link in
      // the background — doing that inline took the request past the server's
      // 10s deadline. The property is only created and published once the owner
      // finishes KYC and a superadmin approves.
      if (!draftVisitIdRef.current) draftVisitIdRef.current = `v_${Date.now()}`;
      const visitId = draftVisitIdRef.current;
      const submitRes = await fetchJson("/api/visits/submit", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: formName,
          visitorEmail: formEmail,
          visitorPhone: formPhone,
          propertyName: formPropertyName,
          propertyType: formPropertyType,
          genderSuitability: formGender,
          monthlyRent: formRent ? parseInt(formRent) : 0,
          deposit: formDeposit,
          description: formDescription,
          city: formCity || formOwnerCity,
          state: formState,
          area: formArea,
          address: formAddress,
          pincode: formPincode,
          landmark: formLandmark,
          ownerName: formName,
          ownerEmail: formEmail,
          ownerPhone: formPhone,
          ownerCity: formOwnerCity || formCity,
          vacantRooms: formVacantRooms ? parseInt(formVacantRooms) : 0,
          occupiedRooms: formOccupiedRooms ? parseInt(formOccupiedRooms) : 0,
          occupiedBeds: formOccupiedBeds ? parseInt(formOccupiedBeds) : 0,
          amenities: Array.from(formAmenities),
          furnishing: formFurnishing,
          ventilation: formVentilation,
          minStay: formMinStay,
          entryExit: formEntryExit,
          visitorsAllowed: formVisitorsAllowed ? "yes" : "no",
          cookingAllowed: formCookingAllowed ? "yes" : "no",
          smokingAllowed: formSmokingAllowed ? "yes" : "no",
          petsAllowed: formPetsAllowed ? "yes" : "no",
          cleanlinessRating: formCleanlinessRating,
          ownerBehaviour: formOwnerBehaviour,
          studentReviews: formStudentReviews,
          internalRemarks: formInternalRemarks,
          photos: formPhotos,
          photoDetails: formPhotoDetails,
          // Only live captures have a verified time, so only they appear here.
          // Uploads used to get an entry too, which made a file chosen from disk
          // look like it had been timestamped at the property.
          photoTimestamps: formPhotoDetails.reduce(
            (acc, p) => (p.capturedAt ? { ...acc, [p.url]: p.capturedAt } : acc), {}
          ),
          roomTypes: formRoomTypes,
          bankAccountHolderName: formBankHolderName,
          bankAccountNumber: formBankAccountNumber,
          bankIfscCode: formBankIfscCode,
          bankName: formBankName,
          bankBranchName: formBankBranchName,
          bankUpiId: formBankUpiId,
          staffName: JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}").name || "Staff Member",
          staffId: JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}").loginId || "STAFF",
          _id: visitId,
        }),
      });

      // The backend now files the report and replies immediately, then sends
      // the KYC email in the background — mailing inside the request pushed it
      // past the server's 10s deadline, which answered 503 for a submission
      // that had actually succeeded. So delivery is reported as in-flight here;
      // the report's KYC column shows the real outcome, and "Resend KYC" is
      // there if it did not arrive.
      if (submitRes?.duplicate) {
        notify(
          "info",
          "Already submitted",
          "This report was filed a moment ago, so it was not filed again. The owner has only been contacted once.",
          "No duplicate created"
        );
      } else if (submitRes?.kycLinkSent === false) {
        notify(
          "warning",
          "Report saved, KYC email not sent",
          `${submitRes?.kycLinkError || `Could not email ${formEmail}.`} Use “Resend KYC” on the report to try again.`
        );
      } else {
        notify(
          "success",
          "Visit report submitted",
          `The digital KYC link is on its way to ${formEmail}.`,
          "Publishes after KYC + approval"
        );
      }
      resetForm();
      setCurrentView("list");
      loadVisits();
    } catch (err) {
      notify("error", "Could not submit the report", err?.message || "Something went wrong. Nothing was saved — please try again.");
      console.error("Visit submit error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ─── KYC / Approval Actions ─────────────────────────────────────────────────

  const resendKyc = async (v) => {
    const id = v.visitId || v._id;
    setActingId(id);
    try {
      const res = await fetchJson(`/api/visits/${encodeURIComponent(id)}/send-kyc-link`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      });
      notify(
        "success",
        "KYC link sent",
        `Emailed to ${v.ownerEmail || "the owner"}.`,
        res?.loginId ? `Owner login ID: ${res.loginId}` : null
      );
      loadVisits();
    } catch (err) {
      notify("error", "Could not send the KYC link", err?.message || "The email did not go out. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const rejectVisit = async () => {
    const v = rejectModal;
    if (!v) return;
    const id = v.visitId || v._id;
    setActingId(id);
    try {
      await fetchJson("/api/visits/reject", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: id,
          // Trimmed so a stray space is not stored as a reason and shown to the
          // employee as an empty comment bubble.
          rejectReason: rejectReason.trim(),
          rejectAction: "cancel",
        }),
      });
      notify(
        "success",
        "Report rejected",
        rejectReason.trim()
          ? `${v.staffName || "The employee"} will see your comment on this report.`
          : `${v.propertyName || "The report"} was rejected without a comment.`,
        rejectReason.trim() ? null : "Add a reason next time so staff know why"
      );
      setRejectModal(null);
      setRejectReason("");
      setViewingVisit(null);
      loadVisits();
    } catch (err) {
      notify("error", "Could not reject", err?.message || "The rejection did not go through. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const approveVisit = async (v) => {
    const id = v.visitId || v._id;
    if (!isTierSelected(v)) {
      notify("warning", "Select a property tier", "A tier has to be assigned before the property can be published.");
      return;
    }
    if (!window.confirm(`Approve "${v.propertyName || "this property"}" and publish it on the website?`)) return;
    setActingId(id);
    try {
      const res = await fetchJson("/api/visits/approve", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: id,
          status: "approved",
          isLiveOnWebsite: true,
          loginId: v.generatedCredentials?.loginId || "",
          tempPassword: v.generatedCredentials?.tempPassword || "",
          tier: tierFor(v),
        }),
      });
      const name = v.propertyName || "The property";
      if (res?.alreadyApproved) {
        notify("info", "Already approved", `${name} was approved earlier, so nothing changed.`, "No duplicate approval");
      } else if (res?.ownerProperty && res.ownerProperty.isPublished === false) {
        // Approval and listing are not the same step: the backend only lists a
        // property that has vacancy, so claiming it is live here would be wrong.
        notify("warning", "Approved, but not listed yet", `${name} has no vacant rooms, so it stays off the website until vacancy is added.`);
      } else {
        notify("success", "Property published", `${name} is now live on the website.`, "Owner emailed their credentials");
      }
      setViewingVisit(null);
      loadVisits();
    } catch (err) {
      notify("error", "Could not approve", err?.message || "The approval did not go through. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  // ─── Photo Helpers ──────────────────────────────────────────────────────────

  const addPhotoUrl = () => {
    if (formPhotoUrl.trim()) {
      setFormPhotos(prev => [...prev, formPhotoUrl.trim()]);
      setFormPhotoUrl("");
    }
  };

  // ─── List helpers ───────────────────────────────────────────────────────────

  const filteredVisits = useMemo(() => {
    const q = search.toLowerCase();
    return visits.filter(v => {
      const propName = (v.propertyName || v.propertyInfo?.name || "").toLowerCase();
      const staffName = (v.staffName || v.submittedBy || "").toLowerCase();
      return propName.includes(q) || staffName.includes(q);
    });
  }, [visits, search]);

  const stats = useMemo(() => {
    const total = visits.length;
    const approved = visits.filter(v => v.status === "approved").length;
    return { total, approved, pending: total - approved };
  }, [visits]);

  // ─── Toggle Pill Component ──────────────────────────────────────────────────
  const TogglePill = ({ label, icon: Icon, active, onClick }) => (
    <button type="button" onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
      )}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <div className={cn("w-8 h-4 rounded-full relative transition-all ml-1", active ? "bg-emerald-500" : "bg-slate-200")}>
        <div className={cn("w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all shadow-sm", active ? "left-[18px]" : "left-0.5")} />
      </div>
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Visit Reports</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">View and manage property visit reports</p>
         </div>
         <div className="flex items-center gap-3">
            {currentView === "list" && (
              <button onClick={() => setCurrentView("addOwner")} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
                 <Plus className="w-3.5 h-3.5" /> Add New Visit
              </button>
            )}
            {currentView === "addOwner" && (
              <button onClick={() => { resetForm(); setCurrentView("list"); }} className="bg-white text-slate-600 border border-slate-100 shadow-slate-200 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-2">
                 <RefreshCw className="w-3.5 h-3.5" /> Back to Visits
              </button>
            )}
         </div>
      </div>

      {currentView === "addOwner" ? (
        /* ═══ ADD PROPERTY OWNER — COMPREHENSIVE FORM ═══ */
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 mt-4">
          {/* Form Header */}
          <div className="bg-white rounded-t-[2rem] border border-b-0 border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 bg-gradient-to-br from-slate-50 to-white flex items-center gap-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/30">
                <UserPlus size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Onboard Property Owner</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fill in property visit details and onboard owner with auto KYC</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleOnboard}>
            <div className="bg-white border-x border-slate-100 shadow-2xl divide-y divide-slate-50">

              {/* ─── Section 1: Owner Identity ──────────────────────────────── */}
              <div>
                <SectionHeader icon={User} title="Owner Identity & Bank Details" subtitle="Primary contact & payout information" open={openSections.owner} onToggle={() => toggleSection("owner")} color="blue" />
                {openSections.owner && (
                  <div className="px-8 pb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Owner Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
                      <FormField label="Email Address" value={formEmail} onChange={e => setFormEmail(e.target.value)} type="email" placeholder="rahul@example.com" required />
                      <FormField label="Phone Number" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91 XXXX XXXXXX" prefix="+91" required />
                      <FormField label="Owner City" value={formOwnerCity} onChange={e => setFormOwnerCity(e.target.value)} placeholder="e.g. Indore" />
                    </div>

                    {/* Bank & Payout Details */}
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Bank &amp; Payout Details</p>
                        {ifscLookupLoading && <span className="text-[10px] text-blue-600 font-bold animate-pulse">Verifying IFSC…</span>}
                        {ifscLookupStatus && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ifscLookupStatus.valid ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                            {ifscLookupStatus.message}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Account Holder Name" value={formBankHolderName} onChange={e => setFormBankHolderName(e.target.value)} placeholder="Name as per bank account" />
                        <FormField
                          label="Bank Name"
                          value={formBankName}
                          onChange={e => {
                            const value = e.target.value;
                            setFormBankName(value);
                            if (ifscLookupStatus?.valid && ifscLookupStatus.bankName && !bankNameMatches(value, ifscLookupStatus.bankName)) {
                              setIfscLookupStatus({
                                ...ifscLookupStatus,
                                valid: false,
                                message: `This IFSC belongs to ${ifscLookupStatus.bankName}, not ${value}.`
                              });
                            }
                          }}
                          placeholder="e.g. HDFC Bank, SBI..."
                        />
                        <FormField label="Account Number" type="password" value={formBankAccountNumber} onChange={e => setFormBankAccountNumber(e.target.value)} placeholder="••••••••••••" />
                        <FormField label="Re-enter Account Number" type="password" value={formReBankAccountNumber} onChange={e => setFormReBankAccountNumber(e.target.value)} placeholder="••••••••••••" />
                        <div className="flex flex-col">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">
                            IFSC Code
                          </label>
                          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-2.5 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                            <input 
                              type="text" 
                              value={formBankIfscCode} 
                              onChange={e => { 
                                const val = e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 11); 
                                setFormBankIfscCode(val); 
                                if (ifscLookupStatus) setIfscLookupStatus(null); 
                              }} 
                              maxLength={11}
                              onBlur={e => handleIfscBlur(e.target.value)}
                              placeholder="e.g. HDFC0000060" 
                              className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300 uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => handleIfscBlur(formBankIfscCode)}
                              disabled={ifscLookupLoading || !formBankIfscCode.trim()}
                              className="ml-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              {ifscLookupLoading ? "Verifying..." : "Verify"}
                            </button>
                          </div>
                        </div>
                        <FormField label="UPI ID" value={formBankUpiId} onChange={e => setFormBankUpiId(e.target.value)} placeholder="e.g. rahul@upi" />
                      </div>
                      {formBankAccountNumber && formReBankAccountNumber && formBankAccountNumber !== formReBankAccountNumber && (
                        <p className="text-xs font-bold text-rose-500 mt-3 flex items-center gap-1">⚠️ Account numbers do not match!</p>
                      )}
                      {formBankAccountNumber && formReBankAccountNumber && formBankAccountNumber === formReBankAccountNumber && (
                        <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1">✓ Account numbers match</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 2: Property Details ────────────────────────────── */}
              <div>
                <SectionHeader icon={Building2} title="Property Details" subtitle="Property name, type, rent & deposit" open={openSections.property} onToggle={() => toggleSection("property")} color="indigo" />
                {openSections.property && (
                  <div className="px-8 pb-8 space-y-6">
                    <FormField label="Property Name" value={formPropertyName} onChange={e => setFormPropertyName(e.target.value)} placeholder="e.g. Sunshine Boys PG" required />
                    
                    {/* Property Type Cards */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Property Type</label>
                      <div className="grid grid-cols-3 gap-4">
                        {PROPERTY_TYPES.map(pt => {
                          const Icon = pt.icon;
                          const active = formPropertyType === pt.value;
                          return (
                            <button key={pt.value} type="button" onClick={() => setFormPropertyType(pt.value)}
                              className={cn("p-4 rounded-2xl border-2 text-left transition-all relative group",
                                active ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"
                              )}>
                              {active && <div className="absolute top-3 right-3 bg-blue-600 rounded-full p-0.5 shadow-lg"><Check className="w-3 h-3 text-white" /></div>}
                              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all", active ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400")}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-700">{pt.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gender Selector */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Gender Suitability</label>
                      <div className="flex gap-3">
                        {GENDER_OPTIONS.map(g => (
                          <button key={g} type="button" onClick={() => setFormGender(g)}
                            className={cn("px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              formGender === g ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            )}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="Monthly Rent" value={formRent} onChange={e => setFormRent(e.target.value)} placeholder="8000" prefix="₹" suffix="/mo" type="number" required />
                      <FormField label="Security Deposit" value={formDeposit} onChange={e => setFormDeposit(e.target.value)} placeholder="10000" prefix="₹" type="number" />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Description</label>
                      <textarea rows={3} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief property description..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none resize-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 3: Location ─────────────────────────────────────── */}
              <div>
                <SectionHeader icon={MapPin} title="Location" subtitle="Area, city, address & pincode" open={openSections.location} onToggle={() => toggleSection("location")} color="emerald" />
                {openSections.location && (
                  <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      State
                      <select value={formState} onChange={e => { setFormState(e.target.value); setFormCity(""); setFormArea(""); }} className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none">
                        <option value="">Select state</option>
                        {[...new Set(locationCities.map(city => city.state).filter(Boolean))].sort().map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </label>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      City <span className="text-red-400">*</span>
                      <select value={formCity} onChange={e => { setFormCity(e.target.value); setFormArea(""); }} className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none">
                        <option value="">Select city</option>
                        {locationCities.filter(city => !formState || !city.state || city.state === formState).map(city => <option key={city._id || city.name} value={city.name}>{city.name}</option>)}
                      </select>
                    </label>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Area / Locality <span className="text-red-400">*</span>
                      <select value={formArea} onChange={e => setFormArea(e.target.value)} className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none">
                        <option value="">Select area</option>
                        {locationAreas.map(area => <option key={area._id || area.name} value={area.name}>{area.name}</option>)}
                      </select>
                    </label>
                    <FormField label="Full Address" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="House/building, street..." className="md:col-span-2" />
                    <FormField label="Pincode" value={formPincode} onChange={e => setFormPincode(e.target.value)} placeholder="560034" />
                    <FormField label="Nearby Landmark" value={formLandmark} onChange={e => setFormLandmark(e.target.value)} placeholder="Near Christ University" />
                  </div>
                )}
              </div>

              {/* ─── Section 4: Occupancy ────────────────────────────────────── */}
              <div>
                <SectionHeader icon={BedDouble} title="Occupancy" subtitle="Rooms & beds info" open={openSections.occupancy} onToggle={() => toggleSection("occupancy")} color="amber" />
                {openSections.occupancy && (
                  <div className="px-8 pb-8 grid grid-cols-3 gap-6">
                    <FormField label="Vacant Rooms" value={formVacantRooms} onChange={e => setFormVacantRooms(e.target.value)} placeholder="10" type="number" />
                    <FormField label="Occupied Rooms" value={formOccupiedRooms} onChange={e => setFormOccupiedRooms(e.target.value)} placeholder="5" type="number" />
                    <FormField label="Occupied Beds" value={formOccupiedBeds} onChange={e => setFormOccupiedBeds(e.target.value)} placeholder="12" type="number" />
                  </div>
                )}
              </div>

              {/* ─── Section 5: Features & Amenities ─────────────────────────── */}
              <div>
                <SectionHeader icon={Zap} title="Features & Amenities" subtitle="Amenities, furnishing, ventilation" open={openSections.features} onToggle={() => toggleSection("features")} color="violet" />
                {openSections.features && (
                  <div className="px-8 pb-8 space-y-6">
                    {/* Amenities Chips */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_LIST.map(a => (
                          <button key={a} type="button" onClick={() => toggleAmenity(a)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all",
                              formAmenities.has(a)
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            )}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Furnishing */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Furnishing</label>
                      <div className="flex gap-3">
                        {FURNISHING_OPTIONS.map(f => (
                          <button key={f} type="button" onClick={() => setFormFurnishing(f)}
                            className={cn("px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              formFurnishing === f ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            )}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <FormField label="Ventilation" value={formVentilation} onChange={e => setFormVentilation(e.target.value)} placeholder="Good / Average" />
                      <FormField label="Minimum Stay" value={formMinStay} onChange={e => setFormMinStay(e.target.value)} placeholder="e.g. 3 Months" />
                      <FormField label="Entry / Exit" value={formEntryExit} onChange={e => setFormEntryExit(e.target.value)} placeholder="e.g. 24/7" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 5.5: Room Configurations ────────────────────────── */}
              <div>
                <SectionHeader icon={BedDouble} title="Room Configurations" subtitle="Configure room types and pricing" open={openSections.roomTypes} onToggle={() => toggleSection("roomTypes")} color="violet" />
                {openSections.roomTypes && (
                  <div className="px-8 pb-8 space-y-6">
                    <div className="space-y-4">
                      {formRoomTypes.map((rt, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative space-y-4">
                          <button type="button" onClick={() => setFormRoomTypes(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-4 right-4 bg-rose-50 text-rose-600 p-2 rounded-xl border border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition-all">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Room Type / Sharing</label>
                              <input type="text" value={rt.type} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].type = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. Double Sharing AC" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                              <input type="text" value={rt.desc} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].desc = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. Attached washroom, study desk" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Occupancy (Beds per Room)</label>
                              <input type="number" value={rt.occupancy} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].occupancy = parseInt(e.target.value) || 1;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 2" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Rooms</label>
                              <input type="text" value={rt.totalRooms} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].totalRooms = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 5" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Beds</label>
                              <input type="text" value={rt.totalBeds} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].totalBeds = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 10" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Price Per Bed (₹/mo)</label>
                              <input type="text" value={rt.pricePerBed} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].pricePerBed = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 7500" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Price Per Room (₹/mo)</label>
                              <input type="text" value={rt.pricePerRoom} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].pricePerRoom = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 15000" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setFormRoomTypes(prev => [...prev, { type: "", desc: "", totalRooms: "", totalBeds: "", occupancy: 1, pricePerBed: "", pricePerRoom: "" }])}
                      className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-white">
                      <Plus className="w-4 h-4" /> Add Room Configuration
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Section 6: Policies ──────────────────────────────────────── */}
              <div>
                <SectionHeader icon={ShieldCheck} title="Policies" subtitle="Visitors, cooking, smoking, pets" open={openSections.policies} onToggle={() => toggleSection("policies")} color="cyan" />
                {openSections.policies && (
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <TogglePill label="Visitors" icon={Users} active={formVisitorsAllowed} onClick={() => setFormVisitorsAllowed(!formVisitorsAllowed)} />
                      <TogglePill label="Cooking" icon={UtensilsCrossed} active={formCookingAllowed} onClick={() => setFormCookingAllowed(!formCookingAllowed)} />
                      <TogglePill label="Smoking" icon={Cigarette} active={formSmokingAllowed} onClick={() => setFormSmokingAllowed(!formSmokingAllowed)} />
                      <TogglePill label="Pets" icon={PawPrint} active={formPetsAllowed} onClick={() => setFormPetsAllowed(!formPetsAllowed)} />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 7: Ratings & Notes ───────────────────────────────── */}
              <div>
                <SectionHeader icon={Star} title="Ratings &amp; Notes" subtitle="Cleanliness, reviews, internal remarks" open={openSections.ratings} onToggle={() => toggleSection("ratings")} color="orange" />
                {openSections.ratings && (
                  <div className="px-8 pb-8 space-y-6">
                    {/* Star Rating */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Cleanliness Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setFormCleanlinessRating(s)}
                            className="transition-all hover:scale-110 active:scale-95">
                            <Star className={cn("w-8 h-8 transition-colors", s <= formCleanlinessRating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                          </button>
                        ))}
                        <span className="ml-3 text-sm font-bold text-slate-500">{formCleanlinessRating}/5</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Owner Behaviour" value={formOwnerBehaviour} onChange={e => setFormOwnerBehaviour(e.target.value)} placeholder="Cooperative, Friendly..." />
                      <FormField label="Student Reviews" value={formStudentReviews} onChange={e => setFormStudentReviews(e.target.value)} placeholder="What students say..." />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Internal Remarks (Private)</label>
                      <textarea rows={3} value={formInternalRemarks} onChange={e => setFormInternalRemarks(e.target.value)} placeholder="Internal notes for superadmin only..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none resize-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 8: Photos & Camera ───────────────────────────────── */}
              <div>
                <SectionHeader icon={Camera} title="Photos" subtitle="Live visit proof + website listing photos by category" open={openSections.photos} onToggle={() => toggleSection("photos")} color="rose" />

                {openSections.photos && (
                  <div className="px-8 pb-8 space-y-6">

                    {/* ── 1. Live camera (INTERNAL PROOF ONLY) ── */}
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest">
                            Step 1 — Live camera (Internal proof only)
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1 max-w-md leading-relaxed">
                            Stamped with date, time &amp; GPS location. These photos go to superadmin as visit proof — <strong>NOT shown on website</strong>.
                          </p>
                        </div>
                        <button type="button" onClick={startCamera}
                          className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 shrink-0">
                          <Camera className="w-4 h-4" /> Open Live Camera
                        </button>
                      </div>

                      {livePhotos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          {livePhotos.map(({ url, detail, idx }) => (
                            <PhotoThumb key={idx} url={url} onRemove={() => removePhoto(idx)}
                              badge={<span className="truncate flex items-center gap-1 text-sky-400">
                                <Clock size={10} className="shrink-0" /> {detail.capturedAt}
                                {(detail.placeName || detail.geoLocation) && <span className="text-[8px] text-slate-400 ml-1">📍 {detail.placeName || detail.geoLocation}</span>}
                              </span>} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-4 italic">No live photos captured yet.</p>
                      )}
                    </div>

                    {/* ── 2. Property Gallery (AddPropertyWizard style) ── */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                            Step 2 — Property Gallery Photos (Shown on Website)
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Add categories &amp; upload photos — same as Add Property wizard. These appear on the public listing.
                          </p>
                        </div>
                        <button type="button" onClick={() => setAddingCat(true)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shrink-0">
                          <Plus className="w-3.5 h-3.5" /> Add Category
                        </button>
                      </div>

                      {/* Add category inline input */}
                      {addingCat && (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={newCatLabel}
                            onChange={e => setNewCatLabel(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newCatLabel.trim()) {
                                  setPropertyViews(prev => [...prev, { label: newCatLabel.trim(), images: [] }]);
                                  setActiveCatIdx(propertyViews.length);
                                  setNewCatLabel(""); setAddingCat(false);
                                }
                              }
                              if (e.key === "Escape") { setAddingCat(false); setNewCatLabel(""); }
                            }}
                            placeholder="Category name (e.g. Kitchen, Bathroom)…"
                            className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                          <button type="button"
                            onClick={() => {
                              if (newCatLabel.trim()) {
                                setPropertyViews(prev => [...prev, { label: newCatLabel.trim(), images: [] }]);
                                setActiveCatIdx(propertyViews.length);
                                setNewCatLabel(""); setAddingCat(false);
                              }
                            }}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
                            Add
                          </button>
                          <button type="button" onClick={() => { setAddingCat(false); setNewCatLabel(""); }}
                            className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Category tabs */}
                      {propertyViews.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {propertyViews.map((view, idx) => (
                            <div key={idx} className="relative group">
                              <button type="button" onClick={() => setActiveCatIdx(idx)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition-all pr-7",
                                  activeCatIdx === idx
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                                )}>
                                {view.label}
                                {view.images.length > 0 && (
                                  <span className={cn("ml-1.5 rounded-full px-1 text-[9px]", activeCatIdx === idx ? "bg-white/30 text-white" : "bg-slate-100 text-slate-500")}>
                                    {view.images.length}
                                  </span>
                                )}
                              </button>
                              {/* Delete category */}
                              {propertyViews.length > 1 && (
                                <button type="button"
                                  onClick={() => {
                                    setPropertyViews(prev => prev.filter((_, i) => i !== idx));
                                    setActiveCatIdx(Math.max(0, activeCatIdx - 1));
                                  }}
                                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Active category upload + grid */}
                      {propertyViews[activeCatIdx] && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <label className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-slate-900/10">
                              <ImageIcon className="w-4 h-4" /> Upload {propertyViews[activeCatIdx].label} Photos
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={async (e) => {
                                  const files = Array.from(e.target.files || []);
                                  e.target.value = "";
                                  for (const file of files) {
                                    setPhotoUploading(n => n + 1);
                                    try {
                                      const { compressImage: ci, PRESETS: PR } = await import("../../utils/imageCompression");
                                      const small = await ci(file, PR.PHOTO);
                                      const url = await uploadPhotoToCloud(small, small.name || file.name || "photo.jpg");
                                      setPropertyViews(prev => {
                                        const next = prev.map((v, i) => i === activeCatIdx ? { ...v, images: [...v.images, url] } : v);
                                        return next;
                                      });
                                    } catch (err) {
                                      notify("error", "Upload failed", err.message);
                                    } finally {
                                      setPhotoUploading(n => n - 1);
                                    }
                                  }
                                }} />
                            </label>
                            {photoUploading > 0 && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" />
                                Uploading {photoUploading} photo{photoUploading > 1 ? "s" : ""}…
                              </span>
                            )}
                          </div>

                          {propertyViews[activeCatIdx].images.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {propertyViews[activeCatIdx].images.map((url, i) => (
                                <PhotoThumb key={i} url={url}
                                  onRemove={() => setPropertyViews(prev =>
                                    prev.map((v, vi) => vi === activeCatIdx
                                      ? { ...v, images: v.images.filter((_, ii) => ii !== i) }
                                      : v)
                                  )}
                                  badge={<span className="truncate flex items-center gap-1 text-emerald-400">
                                    <ImageIcon size={10} className="shrink-0" /> {propertyViews[activeCatIdx].label}
                                  </span>} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">No {propertyViews[activeCatIdx].label} photos yet. Upload some above.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* ─── Credentials Card + Actions ───────────────────────────────── */}
            <div className="bg-white rounded-b-[2rem] border border-t-0 border-slate-100 shadow-2xl p-8 space-y-6">
              {/* Credentials are issued by the backend on submit (ROOMHY####) and emailed
                  to the owner with the digital-KYC link, so nothing is generated here. */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-900/10">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                  <Send size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">What happens next</p>
                  <p className="text-sm font-bold mt-1 leading-relaxed">
                    On submit, owner credentials are generated and a <span className="text-blue-400">digital KYC link</span> is emailed to{" "}
                    <span className="font-mono text-emerald-400">{formEmail || "the owner"}</span>.
                    <br />
                    <span className="text-slate-400 font-medium">
                      The property goes live only after the owner completes KYC and a superadmin approves this report.
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { resetForm(); setCurrentView("list"); }} className="px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Onboarding Owner..." : "Onboard Property Owner"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ═══ VISITS LIST VIEW ═══ */
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Visit Reports</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved / Onboarded</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property name or staff member..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
            </div>
            <button onClick={loadVisits} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-all">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Property / Owner</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Type / Rent</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4">KYC</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">Loading visits...</td></tr>
                ) : filteredVisits.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">No visit reports found</td></tr>
                ) : (
                  filteredVisits.map((v, i) => (
                    <tr key={v._id || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800">{v.propertyName || v.propertyInfo?.name || "Unnamed Property"}</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{v.ownerName || v.visitorName} • {v.ownerPhone || v.visitorPhone}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700">{v.area || v.city || "-"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{v.city}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 uppercase">{v.propertyType || "Hostel"}</p>
                        {formatRent(v)
                          ? <p className="text-[10px] text-blue-600 font-bold">{formatRent(v)}</p>
                          : <p className="text-[10px] text-amber-600 font-bold">Rent not set</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700">{v.staffName || v.submittedBy || "Staff"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{new Date(v.submittedAt || Date.now()).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <span className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border", kycState(v).cls)}>
                          {kycState(v).label}
                        </span>
                      </td>
                      <td className="p-4">
                        {canApprove && v.status !== "approved" ? (
                          <select
                            value={tierFor(v)}
                            onChange={(e) => setTierForVisit(v, e.target.value)}
                            className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <option value="">Select tier…</option>
                            {PROPERTY_TIERS.map(t => (
                              <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {tierMeta(tierFor(v))?.label || "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                          v.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : v.status === "rejected" ? "bg-rose-50 text-rose-600 border border-rose-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          {v.status || "pending"}
                        </span>
                        {/* The reason belongs next to the status, not buried in
                            the detail modal — this row is what the employee scans. */}
                        {v.status === "rejected" && v.rejectReason && (
                          <p className="mt-1 max-w-[180px] text-[10px] font-normal leading-snug text-rose-500" title={v.rejectReason}>
                            “{v.rejectReason}”
                          </p>
                        )}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewingVisit(v)}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all">
                            View
                          </button>
                          {v.status !== "approved" && v.status !== "rejected" && (
                            <>
                              <button
                                onClick={() => resendKyc(v)}
                                disabled={actingId === (v.visitId || v._id) || isKycDone(v)}
                                title={isKycDone(v) ? "Owner has already completed KYC" : "Resend the digital KYC link to the owner"}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold uppercase transition-all border border-blue-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 disabled:cursor-not-allowed"
                              >
                                Resend KYC
                              </button>
                              {canApprove && (
                                <button
                                  onClick={() => approveVisit(v)}
                                  disabled={!isKycDone(v) || !isTierSelected(v) || actingId === (v.visitId || v._id)}
                                  title={!isKycDone(v) ? "Owner must complete digital KYC before approval" : !isTierSelected(v) ? "Select a property tier before approval" : "Approve and publish this property"}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                                >
                                  {actingId === (v.visitId || v._id) ? "..." : "Approve"}
                                </button>
                              )}
                              {canApprove && (
                                <button
                                  onClick={() => { setRejectModal(v); setRejectReason(""); }}
                                  disabled={actingId === (v.visitId || v._id)}
                                  title="Reject this report and send the employee a reason"
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                                >
                                  Reject
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW DETAILS MODAL ═══ */}
      {viewingVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingVisit(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20 shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{viewingVisit.propertyName || viewingVisit.propertyInfo?.name || "Unnamed Property"}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Submitted by {viewingVisit.staffName || viewingVisit.submittedBy || "Staff"} • {new Date(viewingVisit.submittedAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn("px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border", kycState(viewingVisit).cls)}>
                  {kycState(viewingVisit).label}
                </span>
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  viewingVisit.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                )}>
                  {viewingVisit.status || "pending"}
                </span>
                <button onClick={() => setViewingVisit(null)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              {/* Owner's submitted digital KYC — this is what gates approval */}
              {/* First thing in the report when it has come back — an employee
                  opening this needs the reason before anything else. */}
              {viewingVisit.status === "rejected" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
                      <XCircle size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">
                        Report rejected
                        {viewingVisit.rejectedAt && (
                          <span className="ml-2 font-bold normal-case tracking-normal text-rose-400">
                            {new Date(viewingVisit.rejectedAt).toLocaleString("en-IN")}
                          </span>
                        )}
                      </p>
                      {viewingVisit.rejectReason ? (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-rose-900">“{viewingVisit.rejectReason}”</p>
                      ) : (
                        <p className="mt-1.5 text-[12px] italic text-rose-500">No reason was given.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DetailSection icon={ShieldCheck} title="Owner Digital KYC" color="emerald">
                {!viewingVisit.generatedCredentials?.loginId ? (
                  <p className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    No KYC link has been issued for this report yet. Use “Resend KYC” to send it to the owner.
                  </p>
                ) : ownerKycLoading ? (
                  <p className="text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl p-4 border border-slate-100">Loading owner KYC…</p>
                ) : (
                  <>
                    <DetailGrid>
                      <DetailItem label="Owner Login ID" value={viewingVisit.generatedCredentials?.loginId} />
                      <DetailItem label="KYC Status" value={kycState(viewingVisit).label} />
                      <DetailItem label="Aadhaar Number" value={ownerKyc?.aadharNumber} />
                      <DetailItem label="Aadhaar Linked Phone" value={ownerKyc?.checkinAadhaarLinkedPhone} />
                      <DetailItem label="Date of Birth" value={ownerKyc?.checkinDob} />
                      <DetailItem label="KYC Address" value={ownerKyc?.checkinAddress} />
                    </DetailGrid>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">Bank / Payout Details</p>
                    <DetailGrid>
                      <DetailItem label="Account Holder" value={ownerKyc?.checkinAccountHolderName} />
                      <DetailItem label="Bank Name" value={ownerKyc?.checkinBankName} />
                      <DetailItem label="Account Number" value={ownerKyc?.checkinBankAccountNumber} />
                      <DetailItem label="IFSC Code" value={ownerKyc?.checkinIfscCode} />
                      <DetailItem label="Branch" value={ownerKyc?.checkinBranchName} />
                      <DetailItem label="UPI ID" value={ownerKyc?.checkinUpiId} />
                    </DetailGrid>
                    {(ownerKyc?.checkinOwnerPhoto || ownerKyc?.checkinAadhaarImage || ownerKyc?.checkinBankProof) && (
                      <>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-3">Uploaded Documents</p>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { src: ownerKyc?.checkinOwnerPhoto, label: "Owner Photo" },
                            { src: ownerKyc?.checkinAadhaarImage, label: "Aadhaar" },
                            { src: ownerKyc?.checkinBankProof, label: "Bank Proof" },
                          ].filter(d => d.src).map((d, idx) => (
                            <a key={idx} href={d.src} target="_blank" rel="noreferrer" className="group">
                              <img src={d.src} alt={d.label} className="w-28 h-28 rounded-xl object-cover border border-slate-200 shadow-sm group-hover:ring-4 group-hover:ring-emerald-100 transition-all" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">{d.label}</p>
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </DetailSection>

              <DetailSection icon={Star} title="Publish Tier" color="indigo">
                {canApprove && viewingVisit.status !== "approved" && viewingVisit.status !== "rejected" && (
                  <button
                    onClick={() => { setRejectModal(viewingVisit); setRejectReason(""); }}
                    className="px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-all"
                  >
                    Reject
                  </button>
                )}
                {canApprove && viewingVisit.status !== "approved" ? (
                  <select
                    value={tierFor(viewingVisit)}
                    onChange={(e) => setTierForVisit(viewingVisit, e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <option value="">Select tier…</option>
                    {PROPERTY_TIERS.map(t => (
                      <option key={t.key} value={t.key}>{t.label} — {t.publicName}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {tierMeta(tierFor(viewingVisit))?.publicName || "No tier assigned yet."}
                  </p>
                )}
              </DetailSection>

              <DetailSection icon={User} title="Owner & Bank Information" color="blue">
                <DetailGrid>
                  <DetailItem label="Owner Name" value={viewingVisit.ownerName || viewingVisit.visitorName} />
                  <DetailItem label="Email" value={viewingVisit.ownerEmail || viewingVisit.visitorEmail} />
                  <DetailItem label="Phone" value={viewingVisit.ownerPhone || viewingVisit.visitorPhone} />
                  <DetailItem label="Owner City" value={viewingVisit.ownerCity} />
                </DetailGrid>
                {(viewingVisit.bankAccountHolderName || viewingVisit.bankAccountNumber || viewingVisit.bankIfscCode || viewingVisit.bankUpiId || ownerKyc?.checkinBankAccountNumber) && (
                  <>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2">Visit Report Bank &amp; Payout Details</p>
                    <DetailGrid>
                      <DetailItem label="Account Holder" value={viewingVisit.bankAccountHolderName || ownerKyc?.checkinAccountHolderName || "—"} />
                      <DetailItem label="Bank Name" value={viewingVisit.bankName || ownerKyc?.checkinBankName || "—"} />
                      <DetailItem 
                        label="Account Number" 
                        value={(() => {
                          const acct = String(viewingVisit.bankAccountNumber || ownerKyc?.checkinBankAccountNumber || "");
                          if (!acct) return "—";
                          return acct.length > 4 ? `••••••••${acct.slice(-4)}` : acct;
                        })()} 
                      />
                      <DetailItem label="IFSC Code" value={viewingVisit.bankIfscCode || ownerKyc?.checkinIfscCode || "—"} />
                      <DetailItem label="IFSC Status" value={viewingVisit.bankIfscCode ? "Format Validated" : "Not Provided"} />
                      <DetailItem label="Account Verification" value="Pending SuperAdmin Audit" />
                      <DetailItem label="Branch" value={viewingVisit.bankBranchName || ownerKyc?.checkinBranchName || "—"} />
                      <DetailItem label="UPI ID" value={viewingVisit.bankUpiId || ownerKyc?.checkinUpiId || "—"} />
                    </DetailGrid>
                  </>
                )}
              </DetailSection>

              <DetailSection icon={Building2} title="Property Details" color="indigo">
                <DetailGrid>
                  <DetailItem label="Property Type" value={viewingVisit.propertyType} />
                  <DetailItem label="Gender Suitability" value={viewingVisit.genderSuitability || viewingVisit.gender} />
                  <DetailItem label="Monthly Rent" value={formatRent(viewingVisit) || "Not set"} />
                  <DetailItem label="Deposit" value={viewingVisit.deposit ? `₹${viewingVisit.deposit}` : ""} />
                </DetailGrid>
                {viewingVisit.description && (
                  <p className="mt-4 text-xs font-semibold text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">{viewingVisit.description}</p>
                )}
              </DetailSection>

              <DetailSection icon={MapPin} title="Location" color="emerald">
                <DetailGrid>
                  <DetailItem label="Area" value={viewingVisit.area} />
                  <DetailItem label="City" value={viewingVisit.city} />
                  <DetailItem label="Pincode" value={viewingVisit.pincode} />
                  <DetailItem label="Landmark" value={viewingVisit.landmark} />
                </DetailGrid>
                {viewingVisit.address && (
                  <p className="mt-4 text-xs font-semibold text-slate-600">{viewingVisit.address}</p>
                )}
              </DetailSection>

              <DetailSection icon={BedDouble} title="Occupancy" color="amber">
                <DetailGrid cols={3}>
                  <DetailItem label="Vacant Rooms" value={viewingVisit.vacantRooms} />
                  <DetailItem label="Occupied Rooms" value={viewingVisit.occupiedRooms} />
                  <DetailItem label="Occupied Beds" value={viewingVisit.occupiedBeds} />
                </DetailGrid>
              </DetailSection>

              {viewingVisit.amenities?.length > 0 && (
                <DetailSection icon={Zap} title="Amenities & Features" color="violet">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {viewingVisit.amenities.map((a, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">{a}</span>
                    ))}
                  </div>
                  <DetailGrid cols={3}>
                    <DetailItem label="Furnishing" value={viewingVisit.furnishing} />
                    <DetailItem label="Ventilation" value={viewingVisit.ventilation} />
                    <DetailItem label="Min Stay" value={viewingVisit.minStay} />
                  </DetailGrid>
                </DetailSection>
              )}

              {viewingVisit.roomTypes?.length > 0 && (
                <DetailSection icon={BedDouble} title="Room Configurations" color="violet">
                  <div className="space-y-3">
                    {viewingVisit.roomTypes.map((rt, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailItem label="Type" value={rt.type} />
                        <DetailItem label="Rooms / Beds" value={`${rt.totalRooms || 0} / ${rt.totalBeds || 0}`} />
                        <DetailItem label="Price / Bed" value={rt.pricePerBed ? `₹${rt.pricePerBed}` : ""} />
                        <DetailItem label="Price / Room" value={rt.pricePerRoom ? `₹${rt.pricePerRoom}` : ""} />
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection icon={ShieldCheck} title="Policies" color="cyan">
                <DetailGrid cols={4}>
                  <DetailItem label="Visitors" value={viewingVisit.visitorsAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Cooking" value={viewingVisit.cookingAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Smoking" value={viewingVisit.smokingAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Pets" value={viewingVisit.petsAllowed ? "Allowed" : "Not Allowed"} />
                </DetailGrid>
              </DetailSection>

              {(viewingVisit.cleanlinessRating > 0 || viewingVisit.ownerBehaviour || viewingVisit.studentReviews || viewingVisit.internalRemarks) && (
                <DetailSection icon={Star} title="Ratings & Notes" color="orange">
                  {viewingVisit.cleanlinessRating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn("w-5 h-5", s <= viewingVisit.cleanlinessRating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                      ))}
                      <span className="text-xs font-bold text-slate-500 ml-1">{viewingVisit.cleanlinessRating}/5 Cleanliness</span>
                    </div>
                  )}
                  <DetailGrid>
                    <DetailItem label="Owner Behaviour" value={viewingVisit.ownerBehaviour} />
                    <DetailItem label="Student Reviews" value={viewingVisit.studentReviews} />
                  </DetailGrid>
                  {viewingVisit.internalRemarks && (
                    <p className="mt-4 text-xs font-semibold text-slate-600 bg-amber-50/50 rounded-xl p-4 border border-amber-100">{viewingVisit.internalRemarks}</p>
                  )}
                </DetailSection>
              )}

              {viewingVisit.photos?.length > 0 && (
                <DetailSection icon={Camera} title="Photos" color="rose">
                  {(() => {
                    // Same grouping as the form: by how the photo was taken.
                    // Both kinds are published; this only makes the report
                    // readable at a glance.
                    const rows = (viewingVisit.photos || []).map((url, idx) => {
                      const detail = viewingVisit.photoDetails?.[idx] || {};
                      const capturedAt = detail.capturedAt ||
                        (viewingVisit.photoTimestamps && viewingVisit.photoTimestamps[url]) || null;
                      return { url, idx, capturedAt, isLive: detail.source === "camera" };
                    });
                    const live = rows.filter(r => r.isLive);
                    const uploaded = rows.filter(r => !r.isLive);

                    const Tile = ({ r, badge }) => (
                      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                        <div className="relative aspect-video">
                          <img src={r.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 backdrop-blur-xs p-2 text-[9px] font-bold">
                            {badge}
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div className="space-y-5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">
                            Live camera captures ({live.length})
                          </p>
                          {live.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {live.map(r => (
                                <Tile key={r.idx} r={r} badge={
                                  <span className="truncate flex items-center gap-1.5 text-sky-400">
                                    <Clock size={11} className="shrink-0" />{r.capturedAt || "Live capture"}
                                  </span>
                                } />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] italic text-slate-400">No live photos were captured.</p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
                            Uploaded photos ({uploaded.length})
                          </p>
                          {uploaded.length ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {uploaded.map(r => (
                                <Tile key={r.idx} r={r} badge={
                                  <span className="truncate flex items-center gap-1.5 text-slate-300">
                                    <ImageIcon size={11} className="shrink-0" /> Uploaded file
                                  </span>
                                } />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] italic text-slate-400">No photos were uploaded.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </DetailSection>
              )}
            </div>

            {/* Footer actions */}
            {viewingVisit.status !== "approved" && (
              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {!isKycDone(viewingVisit)
                    ? "Waiting for the owner to complete digital KYC"
                    : !isTierSelected(viewingVisit)
                    ? "Select a property tier to publish"
                    : "Owner KYC complete — ready to publish"}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => resendKyc(viewingVisit)}
                    disabled={actingId === (viewingVisit.visitId || viewingVisit._id) || isKycDone(viewingVisit)}
                    className="px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white border border-blue-100 text-blue-600 hover:bg-blue-50 transition-all disabled:text-slate-300 disabled:border-slate-100 disabled:cursor-not-allowed"
                  >
                    Resend KYC
                  </button>
                  {canApprove && (
                    <button
                      onClick={() => approveVisit(viewingVisit)}
                      disabled={!isKycDone(viewingVisit) || !isTierSelected(viewingVisit) || actingId === (viewingVisit.visitId || viewingVisit._id)}
                      title={!isKycDone(viewingVisit) ? "Owner must complete digital KYC before approval" : !isTierSelected(viewingVisit) ? "Select a property tier before approval" : "Approve and publish this property"}
                      className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {actingId === (viewingVisit.visitId || viewingVisit._id) ? "Approving…" : "Approve & Publish"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ LIVE CAMERA MODAL ═══ */}
      {/* ═══ REJECT MODAL ═══ */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                <XCircle size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900">Reject this visit report</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {rejectModal.propertyName || "Unnamed property"} — submitted by {rejectModal.staffName || "staff"}
                </p>
              </div>
            </div>

            <div className="p-5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Reason for rejection <span className="text-slate-300">(optional)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                autoFocus
                maxLength={500}
                placeholder="e.g. Photos are unclear and the rent does not match what the owner quoted."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-rose-400 focus:bg-white resize-none"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Shown to {rejectModal.staffName || "the employee"} on their copy of this report.
                </p>
                <p className="text-[10px] text-slate-300 tabular-nums">{rejectReason.length}/500</p>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={rejectVisit}
                disabled={actingId === (rejectModal.visitId || rejectModal._id)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {actingId === (rejectModal.visitId || rejectModal._id) && <Loader2 size={13} className="animate-spin" />}
                Reject report
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Camera size={16} /> Live Visit Property Photo Capture
              </div>
              <button onClick={stopCamera} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* Mirrors the stamp that will be burnt into the photo. */}
              <div className="absolute bottom-2 left-2 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-mono text-sky-400 font-bold">
                {new Date().toLocaleString("en-IN")}
              </div>
              <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-[10px] font-bold ${geoStatus === "ready" ? "bg-emerald-500/90 text-white" : geoStatus === "unavailable" ? "bg-amber-500/90 text-white" : "bg-slate-950/80 text-sky-300"}`}>
                {geoStatus === "ready" ? "GPS location ready" : geoStatus === "coordinates-only" ? "GPS ready - place name unavailable" : geoStatus === "unavailable" ? "GPS unavailable - allow browser location" : "Detecting GPS location..."}
              </div>
            </div>
            <div className="p-5 flex items-center justify-between bg-slate-900 gap-4">
              <button type="button" onClick={stopCamera} className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="button" onClick={capturePhotoFromCamera} className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all">
                <Camera size={16} /> Snap Photo & Watermark Timestamp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
