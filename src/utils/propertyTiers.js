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

// Matches whatever composeTieredPropertyName produces, plus the hyphenated
// publicName spelling. Derived from PROPERTY_TIERS so adding a tier can never
// leave the stripper behind — a hand-written word list is how the slug helper in
// utils/api.js ended up covering only two of the three tiers.
const TIER_PREFIX_RE = new RegExp(
  `^\\s*ROOMHYPROP[\\s-]+(${PROPERTY_TIERS.map((t) => t.word).join("|")})\\s+`,
  "i"
);

// "ROOMHYPROP CREST Rajnesh Hostel" -> "Rajnesh Hostel".
// The website shows the decorated name and posts it on bookings, while the owner
// panel holds the plain title, so anything comparing the two has to strip first.
export const stripTieredPropertyName = (value) =>
  String(value || "").replace(TIER_PREFIX_RE, "").trim();

// Falls back to the plain name when no valid tier is set, so untiered
// properties keep displaying exactly as they do today.
export const composeTieredPropertyName = (tierKey, propertyName) => {
  const meta = getTierMeta(tierKey);
  const name = propertyName || "Property";
  return meta ? `ROOMHYPROP ${meta.word} ${name}` : name;
};
