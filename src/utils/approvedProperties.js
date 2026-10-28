import { fetchJson, getApiBase } from "./api";

const extractApprovedPropertyList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.visits)) return payload.visits;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const normalizeApprovedProperty = (prop = {}) => {
  const info = prop.propertyInfo || {};
  const visitId = prop.visitId || prop.propertyId || prop.enquiry_id || prop._id || "";
  return {
    ...prop,
    _id: prop._id || visitId,
    visitId,
    propertyId: prop.propertyId || visitId,
    enquiry_id: prop.enquiry_id || visitId,
    property_name: prop.property_name || info.name || prop.title || "Property",
    property_type: prop.property_type || info.propertyType || prop.type || "",
    locality: prop.locality || info.area || prop.area || "",
    city: prop.city || info.city || "",
    rent: prop.rent ?? info.rent ?? prop.monthlyRent ?? 0,
    monthlyRent: prop.monthlyRent ?? info.rent ?? prop.rent ?? 0,
    photos: Array.isArray(prop.photos) ? prop.photos : (Array.isArray(info.photos) ? info.photos : []),
    professionalPhotos: Array.isArray(prop.professionalPhotos) ? prop.professionalPhotos : [],
    isLiveOnWebsite: Boolean(prop.isLiveOnWebsite),
    status: prop.status || (prop.isLiveOnWebsite ? "live" : "approved"),
    generatedCredentials: prop.generatedCredentials || {},
    ownerLoginId: prop.ownerLoginId || prop.generatedCredentials?.loginId || ""
  };
};

const mergeByVisitId = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const normalized = normalizeApprovedProperty(item);
    const key = normalized.visitId || normalized._id || normalized.propertyId;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...normalized });
  });
  return Array.from(map.values());
};

export const loadApprovedProperties = async ({ includeOffline = true } = {}) => {
  const base = getApiBase();
  const endpoints = [`${base}/api/approved-properties/all`];

  let fallbackList = [];
  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];
    try {
      const data = endpoint.includes("/public/")
        ? await fetch(endpoint).then(async (res) => {
            if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
            return res.json();
          })
        : await fetchJson(endpoint);

      const list = extractApprovedPropertyList(data);
      if (list.length > 0) {
        return mergeByVisitId(list);
      }

      if (index === endpoints.length - 1) {
        fallbackList = list;
      }
    } catch (_) {
      // Try next source.
    }
  }

  if (fallbackList.length === 0) {
    return [];
  }

  return mergeByVisitId(fallbackList);
};

export const updateApprovedPropertyVisibility = async (visitId, isLiveOnWebsite) => {
  if (!visitId) {
    throw new Error("Missing visitId");
  }

  return fetchJson(`/api/approved-properties/${encodeURIComponent(visitId)}/toggle-live`, {
    method: "PUT",
    body: JSON.stringify({ isLiveOnWebsite })
  });
};

export const getApprovedPropertiesApiBase = () => getApiBase();
