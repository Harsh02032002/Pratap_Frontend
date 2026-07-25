export const getPermissionForPath = (path) => {
  const cleanPath = (path || "").replace(/^\/employee\//, "/superadmin/");
  if (cleanPath === "/superadmin/superadmin" || cleanPath === "/superadmin/areaadmin") return "dashboard";

  if (cleanPath.startsWith("/superadmin/home-overview") || 
      cleanPath.startsWith("/superadmin/home/revenue-overview") ||
      cleanPath.startsWith("/superadmin/total-properties")) return "home";

  if (cleanPath.startsWith("/superadmin/user-overview") || 
      cleanPath.startsWith("/superadmin/manager") || 
      cleanPath.startsWith("/superadmin/profile") || 
      cleanPath.startsWith("/superadmin/roles-permissions") || 
      cleanPath.startsWith("/superadmin/log") || 
      cleanPath.startsWith("/superadmin/owner") || 
      cleanPath.startsWith("/superadmin/tenant") || 
      cleanPath.startsWith("/superadmin/add-tenant") || 
      cleanPath.startsWith("/superadmin/kyc_verification") || 
      cleanPath.startsWith("/superadmin/new_signups")) return "user_management";

  if (cleanPath.startsWith("/superadmin/property") || 
      cleanPath.startsWith("/superadmin/add-property") || 
      cleanPath.startsWith("/superadmin/employee-properties") || 
      cleanPath.startsWith("/superadmin/rooms") || 
      cleanPath.startsWith("/superadmin/enquiry") || 
      cleanPath.startsWith("/superadmin/amenities") || 
      cleanPath.startsWith("/superadmin/featured")) return "property_management";

  if (cleanPath.startsWith("/superadmin/accounting") || 
      cleanPath.startsWith("/superadmin/refund") || 
      cleanPath.startsWith("/superadmin/rentcollection")) return "accounting";

  if (cleanPath.startsWith("/superadmin/superchat") || 
      cleanPath.startsWith("/superadmin/chat")) return "chat_management";

  if (cleanPath.startsWith("/superadmin/visit")) return "visits";

  if (cleanPath.startsWith("/superadmin/reports")) return "report_analytics";

  if (cleanPath.startsWith("/superadmin/booking") || 
      cleanPath.startsWith("/superadmin/direct-bookings")) return "booking_leads";

  if (cleanPath.startsWith("/superadmin/reviews")) return "review";

  if (cleanPath.startsWith("/superadmin/complaint") || 
      cleanPath.startsWith("/superadmin/complaints") || 
      cleanPath.startsWith("/superadmin/support")) return "support";

  if (cleanPath.startsWith("/superadmin/settings")) return "settings";

  return null;
};

export const hasEmployeePermission = (userObj, path) => {
  if (!userObj) return true;
  const role = String(userObj.role || "").toLowerCase();
  if (role === "superadmin" || role === "admin") return true;

  let perms = userObj.permissions;
  if (!perms) return true;
  if (typeof perms === "string") {
    perms = perms.split(",").map(p => p.trim());
  } else if (Array.isArray(perms)) {
    perms = perms.map(p => (typeof p === "object" ? p.id || p.value || p.key : p));
  }

  if (perms.length === 0) return true;

  const reqPerm = getPermissionForPath(path);
  if (!reqPerm) return true;

  if (reqPerm === "visits") return true;

  return perms.includes(reqPerm);
};

export const getFirstAllowedEmployeeRoute = (userObj) => {
  let perms = userObj?.permissions || [];
  if (typeof perms === "string") perms = perms.split(",").map(p => p.trim());
  else if (Array.isArray(perms)) perms = perms.map(p => (typeof p === "object" ? p.id || p.value || p.key : p));

  const permToRoute = {
    dashboard: "/employee/superadmin",
    home: "/employee/home-overview",
    user_management: "/employee/user-overview",
    property_management: "/employee/property-overview",
    accounting: "/employee/accounting",
    chat_management: "/employee/superchat",
    visits: "/employee/visit",
    report_analytics: "/employee/reports",
    booking_leads: "/employee/booking",
    review: "/employee/reviews",
    support: "/employee/complaint-history",
    settings: "/employee/settings"
  };

  for (const perm of perms) {
    if (permToRoute[perm]) return permToRoute[perm];
  }
  return "/employee/superadmin";
};
