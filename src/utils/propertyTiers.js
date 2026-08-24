export const PROPERTY_TIERS = [
  { key: "basic", label: "Basic", publicName: "ROOMHYPROP-Essence", word: "ESSENCE" },
  { key: "prime", label: "Prime", publicName: "ROOMHYPROP-Crest", word: "CREST" },
  { key: "luxury", label: "Luxury", publicName: "ROOMHYPROP-Estate", word: "ESTATE" },
];

const TIER_BY_KEY = Object.fromEntries(PROPERTY_TIERS.map((t) => [t.key, t]));

export const normalizeTierKey = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return TIER_BY_KEY[key] ? key : "";
};

export const getTierMeta = (value) => TIER_BY_KEY[normalizeTierKey(value)] || null;

// Falls back to the plain name when no valid tier is set, so untiered
// properties keep displaying exactly as they do today.
export const composeTieredPropertyName = (tierKey, propertyName) => {
  const meta = getTierMeta(tierKey);
  const name = propertyName || "Property";
  return meta ? `ROOMHYPROP ${meta.word} ${name}` : name;
};
