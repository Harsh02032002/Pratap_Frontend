import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Loader2, CheckCircle2, FileText } from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";

export default function AddOwner() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form State matching PDF Page 9 exactly
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("");

  const [idProof, setIdProof] = useState(null);
  const [addressProof, setAddressProof] = useState(null);
  const [ownershipProof, setOwnershipProof] = useState(null);

  const idProofRef = useRef(null);
  const addressProofRef = useRef(null);
  const ownershipProofRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: fullName,
        phone,
        email,
        address: [addressLine, city, pincode].filter(Boolean).join(", "),
        propertyName,
        propertyType,
        subscriptionPlan,
      };

      const res = await fetchJson("/api/owners", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });

      alert(res.message || "Property Owner registered successfully!");
      navigate("/superadmin/owner");
    } catch (err) {
      alert("Failed to add owner: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#10242A] max-w-5xl">
      {/* Header - PDF Page 9 Spec */}
      <div>
        <h1 className="text-[26px] font-bold text-[#10242A] tracking-tight leading-tight">Add Owner</h1>
        <p className="text-sm text-[#4A5961] mt-1 font-normal">Register a new property owner</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card 1: Personal details */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#10242A] mb-4">Personal details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Full name</label>
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="[Full name]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Phone</label>
              <input
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="[Phone]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="[Email]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Address */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#10242A] mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Address line</label>
              <input
                value={addressLine}
                onChange={e => setAddressLine(e.target.value)}
                placeholder="[Address line]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="[City]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Pincode</label>
              <input
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="[Pincode]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Property & plan */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#10242A] mb-4">Property & plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Property name</label>
              <input
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                placeholder="[Property name]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Property type</label>
              <input
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                placeholder="[Property type]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#10242A]">Subscription plan</label>
              <input
                value={subscriptionPlan}
                onChange={e => setSubscriptionPlan(e.target.value)}
                placeholder="[Subscription plan]"
                className="w-full h-[44px] bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 text-sm text-[#10242A] placeholder:text-[#4A5961] outline-none focus:border-[#0E7C86]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: KYC documents */}
        <div className="bg-white rounded-[12px] border border-[#E1E6EA] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#10242A] mb-4">KYC documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ID Proof Box */}
            <input
              type="file"
              ref={idProofRef}
              className="hidden"
              onChange={e => setIdProof(e.target.files[0] || null)}
            />
            <div
              onClick={() => idProofRef.current?.click()}
              className="border-2 border-dashed border-[#CBD3D9] rounded-[12px] p-6 text-center hover:border-[#0E7C86] transition-colors cursor-pointer bg-slate-50/50"
            >
              <p className="text-xs font-bold text-[#10242A] mb-1">ID proof</p>
              {idProof ? (
                <p className="text-xs text-[#0E7C86] font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {idProof.name}
                </p>
              ) : (
                <p className="text-xs text-[#4A5961]">Click to upload</p>
              )}
            </div>

            {/* Address Proof Box */}
            <input
              type="file"
              ref={addressProofRef}
              className="hidden"
              onChange={e => setAddressProof(e.target.files[0] || null)}
            />
            <div
              onClick={() => addressProofRef.current?.click()}
              className="border-2 border-dashed border-[#CBD3D9] rounded-[12px] p-6 text-center hover:border-[#0E7C86] transition-colors cursor-pointer bg-slate-50/50"
            >
              <p className="text-xs font-bold text-[#10242A] mb-1">Address proof</p>
              {addressProof ? (
                <p className="text-xs text-[#0E7C86] font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {addressProof.name}
                </p>
              ) : (
                <p className="text-xs text-[#4A5961]">Click to upload</p>
              )}
            </div>

            {/* Ownership Proof Box */}
            <input
              type="file"
              ref={ownershipProofRef}
              className="hidden"
              onChange={e => setOwnershipProof(e.target.files[0] || null)}
            />
            <div
              onClick={() => ownershipProofRef.current?.click()}
              className="border-2 border-dashed border-[#CBD3D9] rounded-[12px] p-6 text-center hover:border-[#0E7C86] transition-colors cursor-pointer bg-slate-50/50"
            >
              <p className="text-xs font-bold text-[#10242A] mb-1">Ownership proof</p>
              {ownershipProof ? (
                <p className="text-xs text-[#0E7C86] font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {ownershipProof.name}
                </p>
              ) : (
                <p className="text-xs text-[#4A5961]">Click to upload</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/superadmin/owner")}
            className="bg-white border border-[#CBD3D9] hover:bg-slate-50 text-[#10242A] font-semibold text-sm px-5 py-2.5 rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0E7C86] hover:bg-[#0B666E] text-white font-semibold text-sm px-6 py-2.5 rounded-[8px] flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{saving ? "Registering..." : "+ Register Owner"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

