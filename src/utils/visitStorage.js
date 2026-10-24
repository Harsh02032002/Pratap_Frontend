// Visit lists are cached in localStorage/sessionStorage by the enquiry screens.
// Anything readable by any script on the page or by the next person at a shared
// computer must never land there, so secrets are stripped before every write and
// scrubbed from copies saved by older versions.
const SECRET_FIELDS = [
  "tempPassword", "password", "kycToken", "kycTokenExpiry", "kycAadhaarNumber", "kycPanNumber", "kycPhone",
  "bankAccountNumber", "bankIfscCode", "bankUpiId", "bankAccountHolderName",
];

export const stripVisitSecrets = (visit) => {
  if (!visit || typeof visit !== "object") return visit;
  const clean = { ...visit };
  SECRET_FIELDS.forEach((f) => { delete clean[f]; });
  if (clean.generatedCredentials && typeof clean.generatedCredentials === "object") {
    const { tempPassword, password, ...rest } = clean.generatedCredentials; // eslint-disable-line no-unused-vars
    clean.generatedCredentials = rest;
  }
  return clean;
};

// Rewrites an already-stored visit list without secrets. No-op when nothing changes.
export const purgeStoredVisitSecrets = (key) => {
  [localStorage, sessionStorage].forEach((store) => {
    try {
      const raw = store.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      const cleaned = JSON.stringify(list.map(stripVisitSecrets));
      if (cleaned !== raw) store.setItem(key, cleaned);
    } catch (_) { /* storage blocked or corrupt: nothing to scrub */ }
  });
};
