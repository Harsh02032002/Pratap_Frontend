// ============================================================================
// Unified Staff Access Engine
// ----------------------------------------------------------------------------
// Single source of truth for:
//   • the canonical permission vocabulary shared by owner staff creation,
//     the staff shell navigation, and staff route protection
//   • the staff session (owner-scoped employee record)
//   • permission checks + permission-driven navigation
//
// Staff are simply owner-scoped *employee* records (parentLoginId = owner)
// created and managed by the Owner. They authenticate through the same login
// form as everyone else and their permissions live in the same `permissions`
// array used across the employee model — no separate permission engine.
// ============================================================================

import {
  LayoutDashboard, Users, Home, AlertCircle, ClipboardList,
  UserPlus, CalendarCheck, Zap, ShieldCheck, Building2,
  Target, Calendar, CalendarDays, IndianRupee, Wallet, BarChart3, FileText, UserCheck, Wrench,
} from "lucide-react";
import { PROPERTY_OWNER_NAV } from "../components/propertyowner/navConfig";

// ----------------------------------------------------------------------------
// Canonical permission catalog.
// `key` is what is persisted in the employee `permissions` array (capitalized
// vocabulary — the one owner staff creation already writes, so existing data is
// preserved). `path` is the staff destination for permission-driven nav; owner
// modules without a dedicated staff screen have `path: null` and are assignable
// but simply do not render a nav link until a staff screen exists.
// ----------------------------------------------------------------------------
export const STAFF_ACCESS_MODULES = [
  // ── Staff Panel operational modules (have working staff screens) ──
  { key: "Dashboard", label: "Dashboard", path: "/staff", icon: LayoutDashboard, group: "Staff Panel", always: true },
  { key: "Tenants", label: "Tenants", path: "/staff/tenants", icon: Users, group: "Staff Panel" },
  { key: "Rooms", label: "Room Inventory", path: "/staff/rooms", icon: Home, group: "Staff Panel" },
  { key: "Complaints", label: "Complaints", path: "/staff/complaints", icon: AlertCircle, group: "Staff Panel" },
  { key: "Tasks", label: "Daily Tasks", path: "/staff/tasks", icon: ClipboardList, group: "Staff Panel" },
  { key: "Visitors", label: "Visitors Log", path: "/staff/visitors", icon: UserPlus, group: "Staff Panel" },
  { key: "Visitor Passes", label: "Visitor Pass Requests", path: "/staff/visitor-passes", icon: ShieldCheck, group: "Staff Panel" },
  { key: "Attendance", label: "Attendance", path: "/staff/attendance", icon: CalendarCheck, group: "Staff Panel" },
  // Sub-capability of the Attendance screen: marking *tenant* attendance. Without
  // it a staff member can only mark their own attendance. No nav entry (path: null)
  // — it toggles the "Tenant Attendance" tab inside the Attendance screen.
  { key: "Tenant Attendance", label: "Tenant Attendance", path: null, icon: UserCheck, group: "Staff Panel" },
  { key: "Electricity Readings", label: "Electricity", path: "/staff/electricity", icon: Zap, group: "Staff Panel" },

  // ── Owner Panel modules (granted by the owner). When a staff member holds one
  // of these, it appears in their sidebar and opens the corresponding owner page,
  // scoped to their parent owner via the "staff proxy" session (see
  // getOwnerRuntimeSession). Access is enforced by canAccessOwnerPathAsStaff. ──
  { key: "Properties", label: "Properties", path: "/propertyowner/properties", icon: Building2, group: "Owner Panel" },
  { key: "Leads", label: "Leads & Enquiries", path: "/propertyowner/enquiry", icon: Target, group: "Owner Panel" },
  { key: "Bookings", label: "Bookings", path: "/propertyowner/booking", icon: Calendar, group: "Owner Panel" },
  { key: "Rent Collection", label: "Rent Collection", path: "/propertyowner/payment", icon: IndianRupee, group: "Owner Panel" },
  { key: "Payments", label: "Payments", path: "/propertyowner/payment-received", icon: Wallet, group: "Owner Panel" },
  { key: "Reports", label: "Reports", path: "/propertyowner/reports", icon: BarChart3, group: "Owner Panel" },
  { key: "Documents", label: "Documents", path: "/propertyowner/documents", icon: FileText, group: "Owner Panel" },
  { key: "Maintenance", label: "Maintenance Requests", path: "/propertyowner/maintenance-requests", icon: Wrench, group: "Owner Panel" },
];

// Sensible default granted to a new staff member. Per product requirement a new
// staff member only sees Dashboard, Attendance and Daily Tasks until the owner
// grants more.
export const DEFAULT_STAFF_PERMISSIONS = [
  "Dashboard", "Attendance", "Tasks",
];

// Every assignable permission key (used by "Select All").
export const ALL_STAFF_PERMISSION_KEYS = STAFF_ACCESS_MODULES.map((m) => m.key);

// Modules grouped for the owner's permission picker.
export const STAFF_MODULE_GROUPS = STAFF_ACCESS_MODULES.reduce((acc, m) => {
  (acc[m.group] = acc[m.group] || []).push(m);
  return acc;
}, {});

// ----------------------------------------------------------------------------
// Permission checks (tolerant of legacy lowercase / label-based values).
// ----------------------------------------------------------------------------
const normalize = (v) => String(v || "").trim().toLowerCase();

export function hasStaffPermission(session, moduleOrKey) {
  const mod = typeof moduleOrKey === "string"
    ? STAFF_ACCESS_MODULES.find((m) => m.key === moduleOrKey)
    : moduleOrKey;
  const key = mod?.key || moduleOrKey;
  if (mod?.always || key === "Dashboard") return true;
  const perms = (session?.permissions || []).map(normalize);
  const candidates = [normalize(key), normalize(mod?.label)].filter(Boolean);
  return candidates.some((c) => perms.includes(c));
}

// Can this staff member manage *tenant* attendance (vs. only their own)?
// Wardens always can (role fallback keeps pre-existing wardens working even if
// their stored permissions predate this key); anyone else needs the explicit
// "Tenant Attendance" permission the owner can grant.
export function canManageTenantAttendance(session) {
  if (String(session?.role || "").trim().toLowerCase() === "warden") return true;
  return hasStaffPermission(session, "Tenant Attendance");
}

// Default permissions for a newly created staff member of a given role.
export function getDefaultPermissionsForRole(role) {
  const base = [...DEFAULT_STAFF_PERMISSIONS];
  const r = String(role || "").trim().toLowerCase();

  if (r === "warden") {
    if (!base.includes("Tenant Attendance")) base.push("Tenant Attendance");
    if (!base.includes("Maintenance")) base.push("Maintenance");
  }
  return base;
}

// Permission-driven navigation: only modules with a staff screen the member
// is permitted to see. Replaces every hardcoded staff nav list.
export function getStaffNav(session) {
  return STAFF_ACCESS_MODULES.filter(
    (m) => m.path && (m.always || hasStaffPermission(session, m))
  );
}

// Is the given staff member allowed to view the given /staff route?
export function canAccessStaffPath(session, pathname) {
  const path = String(pathname || "").split("?")[0].replace(/\/+$/, "") || "/staff";
  if (path === "/staff") return true; // dashboard is always allowed
  const mod = STAFF_ACCESS_MODULES.find((m) => m.path && m.path.startsWith("/staff") && m.path !== "/staff" && path.startsWith(m.path));
  if (!mod) return true; // unknown /staff sub-route — let the page handle it
  return hasStaffPermission(session, mod);
}

// May a staff member (acting as a proxy for their parent owner) open this owner
// page? Allowed if it is a self-service screen, or the section (or any of its
// submenus) belongs to a section the staff is permitted to see. Everything else
// (staff management, settings, marketing, …) stays owner-only.
export function canAccessOwnerPathAsStaff(session, pathname) {
  const norm = (href) => String(href || "").split("?")[0].replace(/\/+$/, "");
  const path = norm(pathname);
  const matches = (href) => {
    const h = norm(href);
    return h && h !== "#" && (path === h || path.startsWith(`${h}/`));
  };

  const restrictedList = Array.isArray(session?.restrictedModules) ? session.restrictedModules : [];

  for (const m of STAFF_SELF_SERVICE_NAV) {
    if ((m.always || hasStaffPermission(session, m.key)) && matches(m.href)) return true;
  }

  for (const section of PROPERTY_OWNER_NAV) {
    const perms = OWNER_SECTION_PERMISSIONS[section.label];
    if (!perms || !staffHasAnyPermission(session, perms)) continue;
    if (matches(section.href)) return true;
    if (section.submenus) {
      for (const s of section.submenus) {
        if (matches(s.href)) {
          const subKey = s.key || `sm_${s.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
          if (restrictedList.includes(subKey) || restrictedList.includes(s.label)) {
            return false;
          }
          return true;
        }
      }
    }
  }
  return false;
}

// ----------------------------------------------------------------------------
// Staff session (owner-scoped employee). Kept in `staff_session` so the twelve
// existing staff screens keep working unchanged, and so an employee-login JWT is
// never handed to /api/auth/me (which only validates website/owner tokens).
// All access flows through these helpers — this module owns the session.
// ----------------------------------------------------------------------------
export function normalizeStaffRecord(emp = {}) {
  return {
    _id: emp._id || emp.id || "",
    loginId: emp.loginId || emp.login_id || emp.staffId || "",
    name: emp.name || "",
    role: emp.role || "Staff",
    parentLoginId: emp.parentLoginId || "",
    permissions: Array.isArray(emp.permissions) ? emp.permissions : [],
    assignedPropertyName: emp.assignedPropertyName || "",
    assignedProperty: emp.assignedProperty || "",
    photoDataUrl: emp.photoDataUrl || "",
  };
}

export function setStaffSession(emp, token) {
  const s = JSON.stringify(normalizeStaffRecord(emp));
  try { sessionStorage.setItem("staff_session", s); } catch (_) { }
  try { localStorage.setItem("staff_session", s); } catch (_) { }
  if (token) {
    try { sessionStorage.setItem("token", token); } catch (_) { }
    try { localStorage.setItem("token", token); } catch (_) { }
  }
}

export function getStaffSession() {
  try {
    const raw = sessionStorage.getItem("staff_session") || localStorage.getItem("staff_session");
    if (raw) return JSON.parse(raw);
  } catch (_) { }
  return null;
}

export function clearStaffSession() {
  ["staff_session", "employee_session", "token"].forEach((k) => {
    try { sessionStorage.removeItem(k); } catch (_) { }
    try { localStorage.removeItem(k); } catch (_) { }
  });
}

// Single canonical login destination for the whole app.
export const UNIFIED_LOGIN_PATH = "/propertyowner/ownerlogin";
// There is ONE panel — the Property Owner Panel. Staff land on their dashboard
// inside it. No separate staff panel exists.
export const STAFF_HOME_PATH = "/propertyowner/staff-home";

// ----------------------------------------------------------------------------
// Staff navigation INSIDE the single Property Owner Panel.
//
// Staff see the SAME owner sidebar sections (with their submenus) — just filtered
// to what they are permitted, plus three self-service screens at the top. So a
// staff member granted "Leads" sees the full "Leads & Bookings" section exactly
// as the owner does (All Leads, New Enquiries, Follow Ups, …), not a flat link.
// ----------------------------------------------------------------------------

// Staff-designed screens, re-homed from the old staff panel (NOT the owner
// versions). When the owner grants one of these permissions the staff member
// gets the simpler staff page — e.g. "Complaints" opens the staff complaints
// screen, not the owner's full Complaints & Maintenance management section.
export const STAFF_SELF_SERVICE_NAV = [
  { key: "Dashboard", label: "Dashboard", href: "/propertyowner/staff-home", icon: LayoutDashboard, always: true },
  { key: "Attendance", label: "Attendance", href: "/propertyowner/my-attendance", icon: CalendarCheck },
  { key: "Tasks", label: "Daily Tasks", href: "/propertyowner/my-tasks", icon: ClipboardList },
  { key: "Rooms", label: "Room Inventory", href: "/propertyowner/staff-rooms", icon: Home },
  { key: "Complaints", label: "Complaints", href: "/propertyowner/staff-complaints", icon: AlertCircle },
  { key: "Visitors", label: "Visitors Log", href: "/propertyowner/staff-visitors", icon: UserPlus },
  { key: "Visitor Passes", label: "Visitor Passes", href: "/propertyowner/staff-visitor-passes", icon: ShieldCheck },
  { key: "Electricity Readings", label: "Electricity", href: "/propertyowner/staff-electricity", icon: Zap },
  { key: "Maintenance", label: "Maintenance", href: "/propertyowner/maintenance-requests", icon: Wrench },
  { key: "Maintenance Calendar", label: "Maintenance Calendar", href: "/propertyowner/maintenance-calendar", icon: CalendarDays, always: true },
];

// Which OWNER-PANEL permission(s) unlock each owner-panel section (keyed by its
// label). Only owner-exclusive features live here. Staff-panel modules (Tenants,
// Rooms, Complaints, Visitors, Visitor Passes, Electricity, …) have staff-designed
// screens in STAFF_SELF_SERVICE_NAV and must NEVER be mapped here — otherwise a
// staff-panel grant (e.g. "Room Inventory") would leak an owner section
// (Properties → Add Property).
export const OWNER_SECTION_PERMISSIONS = {
  "Dashboard": ["Dashboard"],
  "Properties": ["Properties"],
  "Tenants": ["Tenants"],
  "Leads & Bookings": ["Leads & Bookings", "Leads", "Bookings"],
  "Rent & Payments": ["Rent & Payments", "Rent Collection", "Payments"],
  "Complaints & Maintenance": ["Complaints & Maintenance", "Complaints", "Maintenance"],
  "Staff Management": ["Staff Management"],
  "Attendance & Entry": ["Attendance & Entry"],
  "Communication": ["Communication"],
  "Reports": ["Reports"],
  "Settings": ["Settings"],
};

const staffHasAnyPermission = (session, keys) =>
  Array.isArray(keys) && keys.some((k) => hasStaffPermission(session, k));

// Filtered owner-panel sidebar for a staff member (self-service items + granted
// owner sections, submenus preserved and filtered by restrictedModules).
export function getStaffPanelNav(session) {
  const restrictedList = Array.isArray(session?.restrictedModules) ? session.restrictedModules : [];
  const nav = STAFF_SELF_SERVICE_NAV.filter((m) => m.always || hasStaffPermission(session, m.key));

  PROPERTY_OWNER_NAV.forEach((section) => {
    const perms = OWNER_SECTION_PERMISSIONS[section.label];
    if (perms && staffHasAnyPermission(session, perms)) {
      const clonedSection = { ...section };
      if (Array.isArray(section.submenus)) {
        clonedSection.submenus = section.submenus.filter((sub) => {
          const subKey = sub.key || `sm_${sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
          return !restrictedList.includes(subKey) &&
                 !restrictedList.includes(sub.label) &&
                 !restrictedList.includes(`custom_${sub.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`);
        });
      }
      nav.push(clonedSection);
    }
  });
  return nav;
}

// A login ID belongs to a staff member (owner-scoped employee).
export function isStaffLoginId(loginId) {
  return String(loginId || "").trim().toUpperCase().startsWith("STAFF");
}

// ----------------------------------------------------------------------------
// Notification routing.
// A staff member shares the owner panel via a proxy session, so the panel fetches
// the OWNER's notification feed. This filter makes sure staff only ever see
// notifications relevant to their granted role — and NEVER owner-sensitive ones
// (payments/cash, OTPs, revenue, deposits, salaries, subscriptions, …), which
// stay with the owner only.
// ----------------------------------------------------------------------------

// Anything money/security-sensitive is owner-only, no matter what else it matches.
const OWNER_ONLY_NOTIFICATION_RE =
  /\botp\b|\bpayment|\bpaid\b|\brent\b|\bcash\b|revenue|refund|deposit|salary|payout|invoice|transaction|subscription|wallet|\bupi\b|\bbank\b|financ|\bdue\b|collection|receipt|penalt|\bfine\b|billing|\bamount\b|₹|withdraw|earning/i;

// Keyword → staff permission(s) that make a notification relevant to that staff.
const NOTIFICATION_PERMISSION_HINTS = [
  { re: /complaint|maintenance|ticket|repair|issue/i, perms: ["Complaints"] },
  { re: /task|duty|assignment|chore/i, perms: ["Tasks"] },
  { re: /attendance|check.?in|check.?out|leave|shift/i, perms: ["Attendance"] },
  { re: /visitor|guest|gate/i, perms: ["Visitors", "Visitor Passes"] },
  { re: /\bpass\b/i, perms: ["Visitor Passes"] },
  { re: /electric|meter|reading|units/i, perms: ["Electricity Readings"] },
  { re: /tenant|move.?in|move.?out|resident|kyc/i, perms: ["Tenants"] },
  { re: /lead|enquiry|inquiry/i, perms: ["Leads"] },
  { re: /booking/i, perms: ["Bookings", "Leads"] },
  { re: /room|bed|occupanc/i, perms: ["Rooms", "Properties"] },
];

export function filterNotificationsForStaff(session, notifications) {
  if (!Array.isArray(notifications)) return [];
  return notifications.filter((n) => {
    // Notifications addressed directly to this staff member (their own feed, e.g.
    // a task assigned to them) are always shown — the backend already decided to
    // notify them.
    if (n?._ownFeed) return true;

    // Items pulled from the OWNER's shared feed: never leak owner-sensitive ones
    // (cash/OTP/financial), and otherwise only surface those relevant to the
    // staff member's granted role.
    const text = `${n?.type || ""} ${n?.title || ""} ${n?.message || ""} ${n?.meta?.title || ""} ${n?.meta?.message || ""}`;
    if (OWNER_ONLY_NOTIFICATION_RE.test(text)) return false;
    const hint = NOTIFICATION_PERMISSION_HINTS.find((h) => h.re.test(text));
    if (!hint) return false;
    return hint.perms.some((p) => hasStaffPermission(session, p));
  });
}
