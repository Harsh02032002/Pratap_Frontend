const WEBSITE_USER_KEY = "website_user";
const WEBSITE_TOKEN_KEY = "website_token";
const ACCESS_TOKEN_KEY = "accessToken";

export const getWebsiteApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : window.location.origin);

const safeParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getStoredWebsiteToken = () => {
  try {
    return (
      localStorage.getItem(WEBSITE_TOKEN_KEY) ||
      sessionStorage.getItem(WEBSITE_TOKEN_KEY) ||
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
      ""
    );
  } catch {
    return "";
  }
};

const normalizeWebsiteUser = (user) => {
  if (!user || typeof user !== "object") return null;
  // Administrative roles must NEVER be treated as website tenant users
  const role = String(user.role || "").toLowerCase();
  if (role === "superadmin" || role === "admin" || role === "areamanager" || role === "employee" || role === "owner" || role === "manager") {
    return null;
  }
  const loginId = user.loginId || user.email || user.id || user.userId || "";
  return {
    ...user,
    loginId,
    email: user.email || user.gmail || user.userEmail || "",
    role: user.role || "tenant"
  };
};

export const getWebsiteUser = () => {
  try {
    const user =
      safeParse(localStorage.getItem(WEBSITE_USER_KEY)) ||
      safeParse(sessionStorage.getItem(WEBSITE_USER_KEY)) ||
      null;
    return normalizeWebsiteUser(user);
  } catch {
    return null;
  }
};

export const setWebsiteSession = (user, token) => {
  const normalized = normalizeWebsiteUser(user);
  if (!normalized) return null;
  const safeToken = (token || "").toString().trim();
  try {
    localStorage.setItem(WEBSITE_USER_KEY, JSON.stringify(normalized));
    sessionStorage.setItem(WEBSITE_USER_KEY, JSON.stringify(normalized));

    if (safeToken) {
      localStorage.setItem(WEBSITE_TOKEN_KEY, safeToken);
      sessionStorage.setItem(WEBSITE_TOKEN_KEY, safeToken);
      localStorage.setItem(ACCESS_TOKEN_KEY, safeToken);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, safeToken);
    }
  } catch (error) {
    console.error("Failed to store website session:", error);
  }
  return normalized;
};

export const clearWebsiteSession = () => {
  try {
    const keys = [WEBSITE_USER_KEY, WEBSITE_TOKEN_KEY, ACCESS_TOKEN_KEY];
    keys.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch (error) {
    console.error("Failed to clear website session:", error);
  }
};

export const getWebsiteSession = () => {
  const user = getWebsiteUser();
  const token = getStoredWebsiteToken();
  return user && token ? { user, token } : null;
};

export const isWebsiteLoggedIn = () => {
  const user = getWebsiteUser();
  const token = getStoredWebsiteToken();
  return !!user && !!token;
};

export const getWebsiteUserId = () => {
  const user = getWebsiteUser();
  if (!user) return "";
  return user.id || user.userId || user.loginId || user.ownerId || "";
};

export const getWebsiteUserName = () => {
  const user = getWebsiteUser();
  if (!user) return "Guest";
  return user.firstName || user.name || user.fullName || "User";
};

export const getWebsiteUserEmail = () => {
  const user = getWebsiteUser();
  if (!user) return "";
  return user.email || user.gmail || user.userEmail || "";
};

export const logoutWebsite = (redirectPage = "/login") => {
  clearWebsiteSession();
  try {
    localStorage.removeItem("bookingRequestData");
  } catch {
    // ignore
  }
  window.location.href = redirectPage;
};
