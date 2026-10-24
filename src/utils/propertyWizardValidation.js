// Required-field rules for the superadmin Add Property wizard.
// Each rule returns an error message, or "" when the field is fine.
const blank = (v) => !String(v ?? "").trim();
const digits = (v) => String(v ?? "").replace(/\D/g, "");

export const validateStep = (step, d) => {
  const errors = [];
  if (step === 1) {
    if (blank(d.propertyName)) errors.push("Property name is required");
    if (blank(d.propertyCategory)) errors.push("Property category is required");
    if (blank(d.address)) errors.push("Address is required");
    if (blank(d.locality)) errors.push("Locality / area is required");
    if (blank(d.city)) errors.push("City is required");
    if (blank(d.state)) errors.push("State is required");
    if (!/^\d{6}$/.test(String(d.pincode ?? "").trim())) errors.push("Pincode must be 6 digits");
    if (blank(d.contactName)) errors.push("Contact person is required");
    if (digits(d.contactNumber).length < 10) errors.push("Contact number must be at least 10 digits");
    if (!/^\S+@\S+\.\S+$/.test(String(d.email ?? "").trim())) errors.push("A valid email address is required");
  }
  if (step === 2) {
    const rooms = d.roomTypes || [];
    if (!rooms.length) errors.push("Add at least one room type");
    rooms.forEach((r, i) => {
      const n = i + 1;
      if (blank(r.type)) errors.push(`Room type ${n}: name is required`);
      if (!(Number(r.totalRooms) > 0)) errors.push(`Room type ${n}: total rooms must be more than 0`);
      if (!(Number(r.totalBeds) > 0)) errors.push(`Room type ${n}: total beds must be more than 0`);
      if (!(Number(r.pricePerBed) > 0)) errors.push(`Room type ${n}: price per bed must be more than 0`);
    });
  }
  if (step === 4) {
    if (!(d.propertyPhotos || []).length) errors.push("Upload at least one property photo");
  }
  return errors;
};

// First step (1..upTo) that has errors, or null when all are valid.
export const firstInvalidStep = (upTo, d) => {
  for (let s = 1; s <= upTo; s++) {
    const errors = validateStep(s, d);
    if (errors.length) return { step: s, errors };
  }
  return null;
};

// Live Quality Check items shown on the review step.
export const getQualityChecks = (d) => {
  const lat = Number(d.latitude);
  const lng = Number(d.longitude);
  const hasCoords = d.latitude != null && d.longitude != null && d.latitude !== "" && d.longitude !== ""
    && Number.isFinite(lat) && Number.isFinite(lng);
  const rooms = d.roomTypes || [];
  return [
    { label: "All mandatory fields are filled", ok: [1, 2, 4].every((s) => validateStep(s, d).length === 0) },
    { label: "Photos uploaded", ok: (d.propertyPhotos || []).length > 0 },
    { label: "Accurate location coordinates", ok: hasCoords },
    { label: "Transparent pricing details", ok: rooms.length > 0 && rooms.every((r) => Number(r.pricePerBed) > 0) },
  ];
};
