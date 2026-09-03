/**
 * Device location + reverse geocoding for verified live visit captures.
 *
 * Everything here is DEVICE geolocation (`navigator.geolocation`) — never IP
 * lookup. An IP fix resolves to the ISP's exit node, which on Indian mobile
 * networks is routinely a different city from the property being visited, so it
 * is worthless as visit proof and worse than useless as evidence, because it
 * looks like a real reading.
 *
 * The geocoder is Nominatim (OpenStreetMap), which is what the rest of the app
 * already uses (`LocationMapPicker`, `fetchNearbyColleges`). It needs no API
 * key, so nothing secret ends up in the bundle.
 *
 * Coordinates that arrive from a browser are CLIENT-PROVIDED: a determined
 * employee can override them with devtools or a mock-location app. What this
 * records is the position the device reported at capture time, which is the
 * honest claim — not proof of presence.
 */

/** Nominatim asks that clients cap themselves at 1 req/sec; a visit capture is
 *  far below that, but the request still gets its own deadline so a slow
 *  geocoder cannot hold the capture button hostage. */
const GEOCODE_TIMEOUT_MS = 8000;

const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

/** Distinguishable failure reasons, so the UI can say something specific. */
export const LOCATION_ERROR = {
  UNSUPPORTED: "unsupported",
  INSECURE: "insecure",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
  TIMEOUT: "timeout",
  TOO_COARSE: "too_coarse",
};

/**
 * Accuracy bands, in metres.
 *
 * `navigator.geolocation` does NOT mean GPS. With no GPS chip — every laptop,
 * most desktops — the browser falls back to its network location provider,
 * which trilaterates from visible Wi-Fi networks or, failing that, the IP
 * address. Those answers still arrive through the same API, with the same
 * shape, and they are routinely tens or hundreds of kilometres wide: a real
 * reading of a circle so large that the address at its centre is fiction.
 *
 * `accuracy` is the only thing that separates the two, so it is what decides
 * whether a fix counts as visit evidence.
 *
 * A phone with GPS outdoors reports 5-30 m; indoors or in a dense market
 * street, 30-150 m. Past ~1 km nothing on a phone produces that, so the fix is
 * a network estimate and is rejected rather than shown as a place.
 */
export const PRECISE_ACCURACY_M = 150;
export const MAX_ACCEPTABLE_ACCURACY_M = 1000;

/** "precise" | "approximate" | "coarse" — see the thresholds above. */
export function classifyAccuracy(accuracy) {
  if (accuracy == null || !Number.isFinite(accuracy)) return "approximate";
  if (accuracy <= PRECISE_ACCURACY_M) return "precise";
  if (accuracy <= MAX_ACCEPTABLE_ACCURACY_M) return "approximate";
  return "coarse";
}

/** Human-readable radius: 45 m, 1.2 km, 588 km. */
export const formatAccuracy = (accuracy) => {
  if (accuracy == null || !Number.isFinite(accuracy)) return "unknown";
  if (accuracy < 1000) return `${Math.round(accuracy)} m`;
  return `${(accuracy / 1000).toFixed(accuracy < 10000 ? 1 : 0)} km`;
};

export class DeviceLocationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DeviceLocationError";
    this.code = code;
  }
}

/**
 * Read the device's current position, refining it until it is good enough to
 * stand as evidence.
 *
 * This uses `watchPosition`, not `getCurrentPosition`, on purpose. A phone
 * typically answers the first callback from the network provider while the GPS
 * radio is still acquiring satellites, then improves over the next few seconds
 * — 2000 m, then 300 m, then 18 m. Taking the first callback (what
 * `getCurrentPosition` effectively does) means stamping the photo with the
 * coarse one. So: keep the best fix seen, settle early once it is precise, and
 * otherwise settle on the best fix at the deadline.
 *
 * `maximumAge: 0` is deliberate — a cached fix could be hours old and from the
 * previous property, which is exactly the thing this feature exists to prevent.
 *
 * @param {object}   [opts]
 * @param {function} [opts.onProgress] called with each improved fix, so the UI
 *        can show accuracy tightening instead of a silent wait.
 * @returns {Promise<{latitude:number, longitude:number, accuracy:number|null, capturedAt:string}>}
 *          Rejects with a `DeviceLocationError`; `TOO_COARSE` means a position
 *          was obtained but is too wide to be a device fix.
 */
export function getCurrentDeviceLocation({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
  refineForMs = 12000,
  onProgress,
} = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new DeviceLocationError(
        LOCATION_ERROR.UNSUPPORTED,
        "This browser cannot report a device location, so a verified visit photo cannot be captured here."
      ));
      return;
    }
    // Browsers refuse geolocation outside a secure context. Worth naming,
    // because the common way to hit it is testing the LAN dev server from a
    // phone over plain http:// — where the failure otherwise looks like a
    // permission denial the employee cannot fix.
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      reject(new DeviceLocationError(
        LOCATION_ERROR.INSECURE,
        "Location needs a secure (https) connection. Open this page over https and try again."
      ));
      return;
    }

    let best = null;
    let watchId = null;
    let deadline = null;
    let settled = false;

    const toFix = (pos) => ({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
      capturedAt: new Date(pos.timestamp || Date.now()).toISOString(),
    });

    const cleanup = () => {
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (deadline !== null) clearTimeout(deadline);
    };

    const settle = () => {
      if (settled) return;
      cleanup();
      if (!best) {
        reject(new DeviceLocationError(
          LOCATION_ERROR.TIMEOUT,
          "Unable to determine your current location. Please enable GPS/location services and try again."
        ));
      } else if (classifyAccuracy(best.accuracy) === "coarse") {
        // A fix this wide came from Wi-Fi/IP lookup, not the device's own
        // positioning. Rejected rather than returned, because the address at
        // the centre of a 500 km circle looks exactly as convincing as a real
        // one. The fix rides along on the error so a caller that has chosen to
        // allow unverified captures can still stamp it — labelled as what it
        // is — rather than having to ask for it again.
        const err = new DeviceLocationError(
          LOCATION_ERROR.TOO_COARSE,
          `Your device only reported an approximate area (±${formatAccuracy(best.accuracy)}), not a GPS position. ` +
          `Capture the photo on a phone with GPS/precise location turned on.`
        );
        err.fix = best;
        reject(err);
      } else {
        resolve(best);
      }
    };

    deadline = setTimeout(settle, refineForMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (settled) return;
        const fix = toFix(pos);
        // Only ever move to a tighter fix; providers interleave answers and a
        // later callback is not necessarily a better one.
        if (!best || (fix.accuracy ?? Infinity) < (best.accuracy ?? Infinity)) {
          best = fix;
          if (typeof onProgress === "function") onProgress(fix);
        }
        if (classifyAccuracy(best.accuracy) === "precise") settle();
      },
      (err) => {
        if (settled) return;
        // A late error after a usable fix (GPS dropping out mid-refinement)
        // should not throw away the fix we already have.
        if (best && err.code === err.TIMEOUT) {
          settle();
          return;
        }
        cleanup();
        if (err.code === err.PERMISSION_DENIED) {
          reject(new DeviceLocationError(
            LOCATION_ERROR.DENIED,
            "Location access is required to capture a verified visit photo. Please enable location permission and try again."
          ));
        } else if (err.code === err.TIMEOUT) {
          reject(new DeviceLocationError(
            LOCATION_ERROR.TIMEOUT,
            "Unable to determine your current location. Please enable GPS/location services and try again."
          ));
        } else {
          reject(new DeviceLocationError(
            LOCATION_ERROR.UNAVAILABLE,
            "Your device could not provide a location. Please enable GPS/location services and try again."
          ));
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

/**
 * Build the human-readable label out of a Nominatim `address` object.
 *
 * Nominatim fills a different key per country and per zoom level, so each slot
 * is a fallback chain rather than a single field.
 */
export function formatLocationName(address = {}, fallbackDisplayName = "") {
  const road = address.road || address.pedestrian || address.footway || "";
  const placeName =
    address.neighbourhood || address.suburb || address.quarter ||
    address.village || address.hamlet || address.town ||
    address.city_district || address.residential || road || "";
  const city =
    address.city || address.town || address.municipality ||
    address.village || address.county || "";
  const state = address.state || address.state_district || "";
  const country = address.country || "";

  // Road is only worth prefixing when it adds something the locality does not
  // already say — "80 Feet Road, Koramangala" is useful, "Koramangala,
  // Koramangala" is not.
  const parts = [];
  if (road && road !== placeName) parts.push(road);
  [placeName, city, state, country].forEach((part) => {
    if (part && !parts.includes(part)) parts.push(part);
  });

  const formattedAddress = parts.join(", ") || fallbackDisplayName || "";

  return {
    placeName: placeName || city || fallbackDisplayName.split(",")[0] || "",
    city,
    state,
    country,
    formattedAddress,
  };
}

/**
 * Turn coordinates into a place. Rejects on network/geocoder failure so the
 * caller can fall back to showing the raw coordinates rather than inventing a
 * plausible-looking address.
 *
 * @returns {Promise<{placeName:string, city:string, state:string, country:string, formattedAddress:string}>}
 */
export async function reverseGeocodeLocation(latitude, longitude, { signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const url =
      `${NOMINATIM_REVERSE}?format=jsonv2` +
      `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}` +
      `&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error(`Geocoder responded ${res.status}`);

    const data = await res.json();
    if (!data || data.error) throw new Error(data?.error || "No address for these coordinates");

    const place = formatLocationName(data.address || {}, data.display_name || "");
    if (!place.formattedAddress) throw new Error("No address for these coordinates");
    return place;
  } finally {
    clearTimeout(timer);
  }
}

/** `12.9352, 77.6245` — the fallback label when the geocoder is unreachable. */
export const formatCoordinates = (latitude, longitude) =>
  `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
