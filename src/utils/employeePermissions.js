import { RESTRICTED_KEYS } from './permissionKeys';

const KNOWN_MODULES = new Set([
  "dashboard",
  "home",
  "user_management",
  "property_management",
  "accounting",
  "chat_management",
  "visits",
  "report_analytics",
  "booking_leads",
  "review",
  "support",
  "settings",
]);

export const getPermissionForPath = (path) => {
  if (!path) return null;
  if (KNOWN_MODULES.has(path)) return path;

  const cleanPath = String(path || "").split("?")[0].toLowerCase().replace(/^\/employee\//, "/superadmin/");
  if (cleanPath === "/superadmin/superadmin" || cleanPath === "/superadmin/areaadmin") return "dashboard";

  if (cleanPath.startsWith("/superadmin/home-overview") || 
      cleanPath.startsWith("/superadmin/home/revenue-overview")) return "home";

  if (cleanPath.startsWith("/superadmin/user-overview") || 
      cleanPath.startsWith("/superadmin/manager") || 
      cleanPath.startsWith("/superadmin/profile") || 
      cleanPath.startsWith("/superadmin/roles-permissions") || 
      cleanPath.startsWith("/superadmin/log") || 
      cleanPath.startsWith("/superadmin/attendance") ||
      cleanPath.startsWith("/superadmin/owner") || 
      cleanPath.startsWith("/superadmin/add-owner") ||
      cleanPath.startsWith("/superadmin/agreements") ||
      cleanPath.startsWith("/superadmin/tenant") || 
      cleanPath.startsWith("/superadmin/add-tenant") || 
      cleanPath.startsWith("/superadmin/kyc_verification") || 
      cleanPath.startsWith("/superadmin/new_signups")) return "user_management";

  if (cleanPath.startsWith("/superadmin/property") || 
      cleanPath.startsWith("/superadmin/properties") ||
      cleanPath.startsWith("/superadmin/total-properties") ||
      cleanPath.startsWith("/superadmin/add-property") || 
      cleanPath.startsWith("/superadmin/employee-properties") || 
      cleanPath.startsWith("/superadmin/rooms") || 
      cleanPath.startsWith("/superadmin/enquiry") || 
      cleanPath.startsWith("/superadmin/amenities") || 
      cleanPath.startsWith("/superadmin/featured") ||
      cleanPath.startsWith("/superadmin/location")) return "property_management";

  if (cleanPath.startsWith("/superadmin/accounting") || 
      cleanPath.startsWith("/superadmin/refund") || 
      cleanPath.startsWith("/superadmin/rentcollection") ||
      cleanPath.startsWith("/superadmin/payment_disputes") ||
      cleanPath.startsWith("/superadmin/admin-wallet") ||
      cleanPath.startsWith("/superadmin/monthly")) return "accounting";

  if (cleanPath.startsWith("/superadmin/superchat") || 
      cleanPath.startsWith("/superadmin/chat")) return "chat_management";

  if (cleanPath.startsWith("/superadmin/visit")) return "visits";

  if (cleanPath.startsWith("/superadmin/reports") ||
      cleanPath.startsWith("/superadmin/platform_reports")) return "report_analytics";

  if (cleanPath.startsWith("/superadmin/booking") || 
      cleanPath.startsWith("/superadmin/direct-bookings")) return "booking_leads";

  if (cleanPath.startsWith("/superadmin/reviews") ||
      cleanPath.startsWith("/superadmin/review")) return "review";

  if (cleanPath.startsWith("/superadmin/complaint") || 
      cleanPath.startsWith("/superadmin/complaints") || 
      cleanPath.startsWith("/superadmin/tickets") ||
      cleanPath.startsWith("/superadmin/websiteenq") ||
      cleanPath.startsWith("/superadmin/support")) return "support";

  if (cleanPath.startsWith("/superadmin/settings") ||
      cleanPath.startsWith("/superadmin/security") ||
      cleanPath.startsWith("/superadmin/backup")) return "settings";

  return null;
};

export const isCreateOnlyPath = (path) => {
  const cleanPath = String(path || "").split("?")[0].toLowerCase().replace(/^\/employee\//, "/superadmin/");
  return (
    cleanPath.startsWith("/superadmin/add-owner") ||
    cleanPath.startsWith("/superadmin/add-tenant") ||
    cleanPath.startsWith("/superadmin/add-property")
  );
};

export const toPanelPath = (path, pathname) => {
  const prefix = String(pathname || "").startsWith("/employee") ? "/employee" : "/superadmin";
  return String(path || "").replace(/^\/superadmin/, prefix);
};

export const readEmployeePermissionKeys = (userObj) => {
  let perms = userObj?.permissions;
  if (!perms) return null;
  if (typeof perms === "string") perms = perms.split(",").map(p => p.trim()).filter(Boolean);
  else if (Array.isArray(perms)) {
    perms = perms
      .map(p => (typeof p === "object" ? (p.module || p.id || p.value || p.key || "") : p))
      .map(p => String(p || "").trim())
      .filter(Boolean);
  } else {
    return null;
  }
  return perms;
};

/**
 * Resolve the 4 CRUD permissions ({ view, create, edit, delete }) for a given
 * module key or route path.
 */
export const getModuleActionPermissions = (userObj, moduleOrPath) => {
  const fullAccess = { view: true, create: true, edit: true, delete: true };
  if (!userObj) return fullAccess;
  const role = String(userObj.role || "").toLowerCase();
  if (role === "superadmin" || role === "admin") return fullAccess;

  const moduleKey = getPermissionForPath(moduleOrPath);
  if (!moduleKey) return fullAccess;

  const effectiveKey = moduleKey === "home" && userObj?.actions && !userObj.actions.home
    ? "dashboard"
    : moduleKey;

  if (userObj?.actions && typeof userObj.actions === "object") {
    const row = userObj.actions[effectiveKey] || userObj.actions[moduleKey];
    if (row && typeof row === "object") {
      const view = Boolean(row.view || row.create || row.edit || row.delete);
      return {
        view,
        create: Boolean(row.create),
        edit: Boolean(row.edit),
        delete: Boolean(row.delete),
      };
    }
    if (userObj.permissionSource === "role") {
      return { view: false, create: false, edit: false, delete: false };
    }
  }

  // Fallback if permissions array contains structured objects [{ module, view, create, edit, delete }]
  if (Array.isArray(userObj?.permissions)) {
    const objRow = userObj.permissions.find(
      (p) => p && typeof p === "object" && (p.module === effectiveKey || p.module === moduleKey)
    );
    if (objRow) {
      return {
        view: Boolean(objRow.view || objRow.create || objRow.edit || objRow.delete),
        create: Boolean(objRow.create),
        edit: Boolean(objRow.edit),
        delete: Boolean(objRow.delete),
      };
    }
  }

  const perms = readEmployeePermissionKeys(userObj);
  if (!perms) return fullAccess;
  if (perms.length === 0 && userObj.permissionSource === "role") {
    return { view: false, create: false, edit: false, delete: false };
  }

  const hasView =
    moduleKey === "visits"
      ? (userObj.permissionSource === "role" ? perms.includes("visits") : true)
      : perms.includes(effectiveKey) || perms.includes(moduleKey);

  if (!hasView) {
    return { view: false, create: false, edit: false, delete: false };
  }

  const restricted = Array.isArray(userObj?.restrictedModules) ? userObj.restrictedModules : [];
  let canCreate = !perms.includes(`${moduleKey}:no_create`);
  let canEdit = !perms.includes(`${moduleKey}:no_edit`);
  let canDelete = !perms.includes(`${moduleKey}:no_delete`);

  if (moduleKey === "user_management") {
    if (restricted.includes(RESTRICTED_KEYS.UM_CREATE_USER)) canCreate = false;
    if (restricted.includes(RESTRICTED_KEYS.UM_EDIT_USER)) canEdit = false;
    if (restricted.includes(RESTRICTED_KEYS.UM_DELETE_USER)) canDelete = false;
  } else if (moduleKey === "property_management") {
    if (restricted.includes(RESTRICTED_KEYS.PM_ADD_PROPERTY)) canCreate = false;
    if (restricted.includes(RESTRICTED_KEYS.PM_DELETE)) canDelete = false;
  }

  return {
    view: true,
    create: canCreate,
    edit: canEdit,
    delete: canDelete,
  };
};

export const canEmployeePerformAction = (userObj, moduleOrPath, action = "view") => {
  const crud = getModuleActionPermissions(userObj, moduleOrPath);
  const key = String(action || "view").toLowerCase();
  if (key === "create" || key === "edit" || key === "delete" || key === "view") {
    return Boolean(crud[key]);
  }
  return Boolean(crud.view);
};

export const canCreateInModule = (userObj, moduleOrPath) =>
  canEmployeePerformAction(userObj, moduleOrPath, "create");

export const canEditInModule = (userObj, moduleOrPath) =>
  canEmployeePerformAction(userObj, moduleOrPath, "edit");

export const canDeleteInModule = (userObj, moduleOrPath) =>
  canEmployeePerformAction(userObj, moduleOrPath, "delete");

export const hasEmployeePermission = (userObj, path) => {
  if (!userObj) return true;
  const role = String(userObj.role || "").toLowerCase();
  if (role === "superadmin" || role === "admin") return true;

  const perms = readEmployeePermissionKeys(userObj);
  if (!perms) return true;

  // A role with an explicit empty matrix must not fall through to "allow all",
  // which is what made every module appear and then bounce the employee back.
  if (perms.length === 0) return userObj.permissionSource !== "role";

  const cleanPath = (path || "").replace(/^\/employee\//, "/superadmin/");
  if (cleanPath.startsWith("/superadmin/rentcollection")) {
    return perms.includes("accounting") || perms.includes("home") || perms.includes("user_management");
  }

  const reqPerm = getPermissionForPath(path);
  if (!reqPerm) return true;

  if (isCreateOnlyPath(cleanPath) && !canCreateInModule(userObj, reqPerm)) {
    return false;
  }

  if (reqPerm === "visits" && userObj.permissionSource !== "role") return true;

  return perms.includes(reqPerm);
};

export const getFirstAllowedEmployeeRoute = (userObj) => {
  let perms = readEmployeePermissionKeys(userObj) || [];

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

/**
 * isRestrictedModule(userObj, subModuleKey)
 * Returns true if the sub-module key is in the employee's restrictedModules[].
 * Superadmins and admins are never restricted.
 *
 * @param {object} userObj       — The logged-in user object (from session/context)
 * @param {string} subModuleKey  — A key from RESTRICTED_KEYS, e.g. 'rpt_revenue'
 */
export const isRestrictedModule = (userObj, subModuleKey) => {
  if (!userObj) return false;
  const role = String(userObj.role || '').toLowerCase();
  if (role === 'superadmin' || role === 'admin') return false;
  return (userObj.restrictedModules || []).includes(subModuleKey);
};

/**
 * canAccessSubModule(userObj, moduleKey, subModuleKey)
 * Returns true if:
 *   1. Employee has top-level module access (hasEmployeePermission)
 *   AND
 *   2. The sub-module is NOT in their restrictedModules[]
 *
 * Use this for fine-grained UI gating of sub-features.
 */
export const canAccessSubModule = (userObj, path, subModuleKey) => {
  return (
    hasEmployeePermission(userObj, path) &&
    !isRestrictedModule(userObj, subModuleKey)
  );
};
