const genderAliases = new Map(Object.entries({
  male: ["male", "boy", "boys", "boysonly", "boyspg", "boyhostel", "boyshostel", "men", "mens", "maleonly", "boysmale"],
  female: ["female", "girl", "girls", "girlsonly", "girlspg", "girlhostel", "girlshostel", "women", "womens", "femaleonly", "girlsfemale"],
  coed: ["coed", "coeducation", "coliving", "unisex", "mixed", "both", "other", "coedany"],
}).flatMap(([gender, aliases]) => aliases.map(alias => [alias, gender])));

const genderKey = value => typeof value === "string" ? value.toLowerCase().replace(/[^a-z]/g, "") : "";

export const normalizePropertyGender = value => genderAliases.get(genderKey(value)) || "";

export function getPropertyGender(property) {
  const values = [property?.gender, property?.genderSuitability, property?.propertyInfo?.genderSuitability,
    property?.propertyInfo?.gender, property?.propertyDetails?.genderPref,
    property?.propertyCategory, property?.category, property?.propertyInfo?.propertyCategory];
  return values.map(normalizePropertyGender).find(Boolean) || "";
}

export function matchesPropertyGender(property, selectedGender, { includeCoed = false } = {}) {
  const selectedKey = genderKey(selectedGender);
  if (!selectedKey || ["any", "all", "allgenders"].includes(selectedKey)) return true;
  const selected = normalizePropertyGender(selectedGender);
  const actual = getPropertyGender(property);
  return Boolean(selected && actual && (actual === selected || (includeCoed && actual === "coed")));
}
