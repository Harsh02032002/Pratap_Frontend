export const PROPERTY_TIERS = [
  { key: "basic", label: "Basic", publicName: "RoomhyProp Essence", word: "Essence" },
  { key: "prime", label: "Prime", publicName: "RoomhyProp Crest", word: "Crest" },
  { key: "luxury", label: "Luxury", publicName: "RoomhyProp Estate", word: "Estate" },
];

const TIER_BY_KEY = Object.fromEntries(PROPERTY_TIERS.map((t) => [t.key, t]));

export const normalizeTierKey = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return TIER_BY_KEY[key] ? key : "";
};

export const getTierMeta = (value) => TIER_BY_KEY[normalizeTierKey(value)] || null;

// Matches both "ROOMHYPROP ESSENCE ", "RoomhyProp-Essence - ", and "RoomhyProp Essence - "
const TIER_PREFIX_RE = new RegExp(
  `^\\s*ROOMHYPROP[\\s-]+(ESSENCE|CREST|ESTATE)[\\s-]+`,
  "i"
);

// "RoomhyProp Essence - Rajnesh Hostel" -> "Rajnesh Hostel".
export const stripTieredPropertyName = (value) =>
  String(value || "").replace(TIER_PREFIX_RE, "").trim();

export const composeTieredPropertyName = (tierKey, propertyName) => {
  const meta = getTierMeta(tierKey);
  const rawName = stripTieredPropertyName(propertyName) || "Property";

  // Clean title casing (e.g. "kjhjuhju" -> "Kjhjuhju", "harsh place" -> "Harsh Place")
  const cleanName = rawName.replace(/\w\S*/g, (txt) => {
    const upper = txt.toUpperCase();
    if (['PG', 'AC', 'TV', 'CCTV', 'WIFI'].includes(upper)) {
      return upper;
    }
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });

  return meta ? `RoomhyProp ${meta.word} - ${cleanName}` : cleanName;
};
