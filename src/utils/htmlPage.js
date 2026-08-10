import { useEffect, useLayoutEffect } from "react";
import { initTailwindHelper, rescanTailwind } from "./tailwindHelper";

const ensureElement = (key, createElement) => {
  const existing = document.querySelector(`[data-hp-key="${key}"]`);
  if (existing) {
    return { element: existing, owned: false };
  }
  const element = createElement();
  element.setAttribute("data-hp-key", key);
  document.head.appendChild(element);
  return { element, owned: true };
};

const applyAttributes = (element, attrs) => {
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === true) {
      element.setAttribute(key, "");
      return;
    }
    if (value === false || value == null) {
      return;
    }
    element.setAttribute(key, String(value));
  });
};

const attrsKey = (prefix, attrs) => {
  const parts = Object.entries(attrs || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`);
  return `${prefix}:${parts.join("|")}`;
};

const inlineExecutedKey = "__hp_inline_executed__";

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const suppressTailwindCdnWarnings = () => {
  if (typeof window === "undefined" || window.__tailwindCdnWarningSuppressed) return;
  window.__tailwindCdnWarningSuppressed = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const shouldSuppress = (args) =>
    args.some((arg) => {
      const text = String(arg || "");
      return (
        text.includes("cdn.tailwindcss.com should not be used in production") ||
        text.includes("To use Tailwind CSS in production")
      );
    });

  console.warn = (...args) => {
    if (shouldSuppress(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppress(args)) return;
    originalError(...args);
  };
};

const markInlineExecuted = (key) => {
  if (!window[inlineExecutedKey]) {
    window[inlineExecutedKey] = {};
  }
  window[inlineExecutedKey][key] = true;
};

const wasInlineExecuted = (key) => Boolean(window[inlineExecutedKey]?.[key]);

const getLegacyApiUrl = () => {
  if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === "undefined") return "https://roohmy-backend-xwa9.vercel.app";
  const host = window.location?.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:5001"
    : "https://roohmy-backend-xwa9.vercel.app";
};

const websiteFooterHtml = (year) => `
  <footer class="border-t border-gray-200 bg-white">
    <div class="container mx-auto px-4 sm:px-6 py-12">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div class="md:col-span-4">
          <a href="/website/index" class="inline-flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dpwgvcibj/image/upload/v1768990260/roomhy/website/logoroomhy.png"
              alt="Roomhy"
              class="h-10 w-auto"
            />
          </a>
          <p class="mt-4 text-sm text-gray-600 max-w-sm">
            Find student housing smarter, simpler, and broker-free.
          </p>
          <div class="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <a class="text-gray-600 hover:text-blue-600" href="/website/contact">Help & Support</a>
            <span class="text-gray-300">•</span>
            <a class="text-gray-600 hover:text-blue-600" href="mailto:team@roomhy.com">team@roomhy.com</a>
          </div>

          <div class="mt-6 flex items-center gap-4 text-gray-600">
            <a href="#" title="Facebook" class="hover:text-blue-600" aria-label="Facebook">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" title="X" class="hover:text-blue-600" aria-label="X">
              <i class="fab fa-x-twitter"></i>
            </a>
            <a href="#" title="Instagram" class="hover:text-blue-600" aria-label="Instagram">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" title="LinkedIn" class="hover:text-blue-600" aria-label="LinkedIn">
              <i class="fab fa-linkedin-in"></i>
            </a>
            <a href="#" title="YouTube" class="hover:text-blue-600" aria-label="YouTube">
              <i class="fab fa-youtube"></i>
            </a>
          </div>
        </div>

        <div class="md:col-span-8">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <div class="text-sm font-semibold text-gray-900">Company</div>
              <ul class="mt-4 space-y-2">
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/about">About Roomhy</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Explore</div>
              <ul class="mt-4 space-y-2">
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/index">Home</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/ourproperty">Our Properties</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/fast-bidding">Fast Bidding</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/list">Post Property</a></li>
              </ul>
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Support</div>
              <ul class="mt-4 space-y-2">
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/mystays">My Stays</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/refund-request">Refund Request</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/cancellation">Cancellation</a></li>
              </ul>
            </div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Legal</div>
              <ul class="mt-4 space-y-2">
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/terms">Terms & Conditions</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/privacy">Privacy Policy</a></li>
                <li><a class="text-sm text-gray-600 hover:text-blue-600" href="/website/refund">Refund Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div class="text-xs text-gray-500">© ${year} Roomhy. All rights reserved.</div>
        <div class="flex flex-wrap items-center gap-4 text-xs">
          <a class="text-gray-500 hover:text-blue-600" href="/website/terms">Terms</a>
          <a class="text-gray-500 hover:text-blue-600" href="/website/privacy">Privacy</a>
          <a class="text-gray-500 hover:text-blue-600" href="/website/refund">Refund</a>
        </div>
      </div>
    </div>
  </footer>
`;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const locationStripHtml = (cities = [], areas = []) => {
  if (!cities.length) return "";
  const cityList = cities.slice(0, 10);
  const areaByCity = cityList.map((city) => {
    const cityKey = String(city?.name || "").trim().toLowerCase();
    const cityAreas = areas
      .filter((area) => String(area?.cityName || area?.city?.name || "").trim().toLowerCase() === cityKey)
      .slice(0, 6);
    return { city, cityAreas };
  });

  return `
    <section class="roomhy-location-strip bg-[#1f2937] text-white border-b border-white/10">
      <div class="container mx-auto px-4 sm:px-6 py-4">
        <div class="roomhy-area-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-3">
          ${areaByCity
      .map(
        ({ city, cityAreas }) => `
                <div class="roomhy-city-block rounded-md bg-white/[0.02] px-3 py-2">
                  <div class="text-sm font-semibold ${cityAreas.length ? "text-[#31c9b4]" : "text-gray-200"} mb-1.5">${escapeHtml(
          city?.name || ""
        )}</div>
                  <ul class="space-y-1">
                    ${cityAreas.length
            ? cityAreas
              .map(
                (area) =>
                  `<li class="text-xs text-gray-300/90"><a class="hover:text-white underline-offset-2 hover:underline" href="/website/ourproperty?city=${encodeURIComponent(
                    city?.name || ""
                  )}&area=${encodeURIComponent(area?.name || "")}">PGs in ${escapeHtml(area?.name || "")}</a></li>`
              )
              .join("")
            : `<li class="text-xs text-gray-400">No areas yet</li>`
          }
                  </ul>
                </div>
              `
      )
      .join("")}
        </div>
      </div>
    </section>
  `;
};

const renderLocationStrip = async (footerEl) => {
  if (!footerEl || footerEl.querySelector('[data-hp-location-strip="1"]')) return;
  try {
    const apiBase = window.API_URL || getLegacyApiUrl();
    const [citiesRes, areasRes] = await Promise.all([
      fetch(`${apiBase}/api/locations/cities`),
      fetch(`${apiBase}/api/locations/areas`)
    ]);
    if (!citiesRes.ok || !areasRes.ok) return;

    const [citiesPayload, areasPayload] = await Promise.all([citiesRes.json(), areasRes.json()]);
    const cities = Array.isArray(citiesPayload?.data) ? citiesPayload.data : [];
    const areas = Array.isArray(areasPayload?.data) ? areasPayload.data : [];
    if (!cities.length) return;

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-hp-location-strip", "1");
    wrapper.innerHTML = locationStripHtml(cities, areas);
    footerEl.prepend(wrapper.firstElementChild);
  } catch (e) {
    // ignore strip errors to avoid affecting page render
  }
};

const applyWebsiteChrome = () => {
  try {
    const path = window.location?.pathname || "";
    if (!path.startsWith("/website/")) return;

    const htmlPage = document.querySelector(".html-page");
    if (htmlPage) {
      htmlPage.classList.add("flex", "flex-col", "min-h-screen");
    }

    if (!document.querySelector('style[data-hp-website-style="1"]')) {
      const style = document.createElement("style");
      style.setAttribute("data-hp-website-style", "1");
      style.textContent = `
        .html-page header, .html-page footer, .html-page .footer { width: 100%; }
        .html-page .footer { margin-top: auto; }
        .html-page .footer .footer-main,
        .html-page .footer .footer-bottom {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        @media (min-width: 640px) {
          .html-page .footer .footer-main,
          .html-page .footer .footer-bottom {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }

        /* Ensure X icon renders even without FontAwesome glyph */
        .html-page i.fa-x-twitter {
          display: inline-block;
          width: 1em;
          height: 1em;
          vertical-align: -0.125em;
          background-color: currentColor;
          -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1227'%3E%3Cpath d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.371 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.698 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z'/%3E%3C/svg%3E") center / contain no-repeat;
          mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1227'%3E%3Cpath d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.371 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.698 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z'/%3E%3C/svg%3E") center / contain no-repeat;
        }

        .roomhy-location-strip .roomhy-area-grid ul { margin: 0; padding: 0; list-style: none; }
        .roomhy-location-strip .roomhy-city-block { min-height: 104px; }
      `;
      document.head.appendChild(style);
    }

    const existingFooter = htmlPage?.querySelector("footer");
    if (!existingFooter && htmlPage) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-hp-website-footer", "1");
      wrapper.innerHTML = websiteFooterHtml(new Date().getFullYear());
      htmlPage.appendChild(wrapper.firstElementChild);
    }

    const header = htmlPage?.querySelector("header");
    if (header) {
      header.style.width = "100%";
    }
    const footer = htmlPage?.querySelector("footer");
    if (footer) {
      footer.style.width = "100%";
      footer.style.marginTop = "auto";
      renderLocationStrip(footer);
    }
  } catch (e) {
    // ignore
  }
};

const loadScriptSequentially = async (script) => {
  if (!script?.src) return;
  const key = `script:${script.src}`;
  if (document.querySelector(`script[src="${script.src}"]`) || document.querySelector(`[data-hp-key="${key}"]`)) {
    return;
  }
  await new Promise((resolve, reject) => {
    const el = document.createElement("script");
    applyAttributes(el, script);
    el.async = false;
    el.onload = () => resolve();
    el.onerror = reject;
    el.setAttribute("data-hp-key", key);
    document.head.appendChild(el);
  });
};

const waitForStylesheets = (linkElements, timeoutMs = 1000) =>
  new Promise((resolve) => {
    if (!linkElements?.length) {
      resolve();
      return;
    }

    let remaining = 0;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };

    linkElements.forEach((linkEl) => {
      if (!linkEl || linkEl.tagName !== "LINK") return;
      if (linkEl.rel !== "stylesheet") return;

      // If already loaded, don't wait.
      if (linkEl.sheet) return;

      remaining += 1;
      linkEl.addEventListener("load", done, { once: true });
      linkEl.addEventListener("error", done, { once: true });
    });

    if (remaining === 0) {
      resolve();
      return;
    }

    setTimeout(resolve, timeoutMs);
  });

const waitForTailwindStyles = async (hasTailwindScript, timeoutMs = 700) => {
  if (!hasTailwindScript) return;
  const startCount = document.styleSheets.length;
  await new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      if (document.styleSheets.length > startCount) {
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
};

const waitForTailwindComputed = async (timeoutMs = 450) => {
  const probe = document.createElement("div");
  probe.className = "hidden";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);

  await new Promise((resolve) => {
    const startTime = Date.now();
    const check = () => {
      const display = window.getComputedStyle(probe).display;
      if (display === "none") {
        resolve();
        return;
      }
      if (Date.now() - startTime > timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

  probe.remove();
};

const getEmployeeSessionUser = () => {
  try {
    const raw =
      sessionStorage.getItem("manager_user") ||
      sessionStorage.getItem("user") ||
      localStorage.getItem("staff_user") ||
      localStorage.getItem("manager_user") ||
      localStorage.getItem("user") ||
      "null";
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const normalizePermissions = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") return v.id || v.value || v.key || "";
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const getEmployeePermissionList = (user) => {
  if (!user || user.role !== "employee") return [];
  let perms = normalizePermissions(user.permissions);
  if (perms.length) return perms;
  try {
    const list = JSON.parse(localStorage.getItem("roomhy_employees") || "[]");
    const emp = Array.isArray(list)
      ? list.find((e) => String(e.loginId || "").toUpperCase() === String(user.loginId || "").toUpperCase())
      : null;
    if (emp) {
      perms = normalizePermissions(emp.permissions || emp.modules || emp.moduleAccess || emp.access);
    }
  } catch (e) {
    // ignore
  }
  return perms;
};

const getEmployeeDisplayInfo = (user) => {
  if (!user) return { name: "User", role: "Employee", initials: "US", loginId: "" };
  const name = user.name || user.fullName || user.employeeName || user.loginId || "User";
  const role = user.team || user.role || "Employee";
  const loginId = user.loginId || "";
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || String(loginId).slice(0, 2).toUpperCase() || "US";
  return { name: String(name), role: String(role), initials, loginId: String(loginId) };
};

const applyEmployeeHeader = () => {
  const path = window.location?.pathname || "";
  if (!path.startsWith("/employee/")) return;

  const user = getEmployeeSessionUser();
  if (!user) return;
  const info = getEmployeeDisplayInfo(user);

  const headerName = document.getElementById("headerName");
  if (headerName) headerName.textContent = info.name;
  const welcomeName = document.getElementById("welcomeName");
  if (welcomeName) welcomeName.textContent = info.name;
  const headerRole = document.getElementById("headerRole");
  if (headerRole) headerRole.textContent = info.role;

  const avatarEl = document.querySelector(".html-page header .rounded-full");
  if (avatarEl && avatarEl.textContent) {
    avatarEl.textContent = info.initials;
  }
};

const buildEmployeeSidebarConfig = () => ({
  overview: [{ key: "dashboard", label: "Dashboard", href: "/employee/areaadmin", icon: "layout-dashboard" }],
  management: [
    { key: "teams", label: "Teams", href: "/employee/manager", icon: "map-pin" },
    { key: "owners", label: "Property Owners", href: "/employee/owner", icon: "briefcase" },
    { key: "properties", label: "Properties", href: "/employee/properties", icon: "home" },
    { key: "tenants", label: "Tenants", href: "/employee/tenant", icon: "users" },
    { key: "new_signups", label: "New Signups", href: "/employee/new_signups", icon: "file-badge" },
    { key: "visits", label: "Visit Reports", href: "/employee/visit", icon: "clipboard-list" }
  ],
  operations: [
    { key: "web_enquiry", label: "Web Enquiry", href: "/employee/websiteenq", icon: "folder-open" },
    { key: "enquiries", label: "Enquiries", href: "/employee/enquiry", icon: "help-circle" },
    { key: "bookings", label: "Bookings", href: "/employee/booking", icon: "calendar-check" },
    { key: "reviews", label: "Reviews", href: "/employee/reviews", icon: "star" },
    { key: "complaint_history", label: "Complaint History", href: "/employee/complaint-history", icon: "alert-circle" }
  ],
  website: [{ key: "live_properties", label: "Live Properties", href: "/employee/website", icon: "globe" }],
  finance: [
    { key: "rent_collections", label: "Rent Collections", href: "/employee/rentcollection", icon: "wallet" },
    { key: "commissions", label: "Commissions", href: "/employee/platform", icon: "indian-rupee" },
    { key: "refunds", label: "Refunds", href: "/employee/refund", icon: "rotate-ccw" }
  ],
  system: [
    { key: "locations", label: "Locations", href: "/employee/location", icon: "globe" }
  ],
  account: [
    { key: "profile", label: "Profile", href: "/employee/profile", icon: "user" },
    { key: "settings", label: "Settings", href: "/employee/settings", icon: "settings" }
  ]
});

const applyEmployeeSidebarPermissions = (opts = {}) => {
  const path = window.location?.pathname || "";
  if (!path.startsWith("/employee/")) return;

  const user = getEmployeeSessionUser();
  if (!user) return;
  const role = String(user.role || "").toLowerCase();
  if (role === "areamanager") return;

  const allowed = new Set(["dashboard", "visits"]);
  const perms = getEmployeePermissionList(user);
  perms.forEach((p) => allowed.add(String(p)));

  const config = buildEmployeeSidebarConfig();
  const activePath = window.location?.pathname || "";
  const buildSection = (label, items) => {
    const visible = items.filter((item) => role === "areamanager" || allowed.has(item.key));
    if (!visible.length) return "";
    const links = visible
      .map((item) => {
        const active = activePath === item.href;
        return `<a href="${item.href}" class="sidebar-link${active ? " active" : ""}"><i data-lucide="${item.icon}" class="w-5 h-5 mr-3"></i> ${item.label}</a>`;
      })
      .join("");
    return `<div class="mt-4">
      <div class="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">${label}</div>
      ${links}
    </div>`;
  };

  const navHtml = `
    ${buildSection("Overview", config.overview)}
    ${buildSection("Management", config.management)}
    ${buildSection("Operations", config.operations)}
    ${buildSection("Website", config.website)}
    ${buildSection("Finance", config.finance)}
    ${buildSection("System", config.system)}
    ${buildSection("Account", config.account)}
  `;

  const navNodes = Array.from(document.querySelectorAll(".sidebar nav, #dynamicSidebarNav"))
    .filter((node) => node && node.closest(".sidebar"));
  const deduped = [];
  const seen = new Set();
  navNodes.forEach((node) => {
    const aside = node.closest(".sidebar");
    if (!aside) return;
    if (seen.has(aside)) return;
    seen.add(aside);
    deduped.push(node);
  });
  if (deduped.length) {
    deduped.forEach((node) => {
      node.innerHTML = navHtml;
      node.setAttribute("data-employee-sidebar", "1");
      node.setAttribute("data-employee-sidebar-built", "1");
    });
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  const sidebar = document.querySelector(".sidebar");
  if (sidebar && sidebar.getAttribute("data-employee-brand") !== "1") {
    const label = role === "areamanager" ? "AREA ADMIN" : "EMPLOYEE";
    const spans = Array.from(sidebar.querySelectorAll("span"));
    const badge = spans.find((s) => /super admin|team member/i.test(s.textContent || ""));
    if (badge) {
      badge.textContent = label;
    }
    sidebar.setAttribute("data-employee-brand", "1");
  }

  applyEmployeeHeader();
};

export const useHtmlPage = ({
  title,
  bodyClass,
  htmlAttrs = {},
  metas = [],
  bases = [],
  links = [],
  styles = [],
  scripts = [],
  inlineScripts = [],
  disableMobileSidebar = false
}) => {
  const useClientLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  const configKey = (() => {
    try {
      return String(
        hashString(
          JSON.stringify({
            title,
            bodyClass,
            htmlAttrs,
            metas,
            bases,
            links,
            styles,
            scripts,
            inlineScripts,
            disableMobileSidebar
          })
        )
      );
    } catch (err) {
      return `${title || "page"}:${Date.now()}`;
    }
  })();

  useClientLayoutEffect(() => {
    // Initialize Tailwind helper if not already done
    if (!window._tailwindHelperInitialized) {
      initTailwindHelper();
      window._tailwindHelperInitialized = true;
    }

    // Reset fade-in effect for new page (remove css-ready class initially)
    // Note: Global CSS in the app index already hides .html-page by default with opacity: 0
    const htmlPageEl = document.querySelector(".html-page");
    if (htmlPageEl) {
      // Ensure css-ready is removed to reset opacity to 0
      htmlPageEl.classList.remove("css-ready");
      // Force a synchronous repaint to ensure page is hidden
      void htmlPageEl.offsetHeight;
      // Also force opacity to 0 explicitly as emergency backup
      htmlPageEl.style.opacity = "0";
      // Set pointer-events none to prevent interaction while hidden
      htmlPageEl.style.pointerEvents = "none";
    }

    const ownedElements = [];
    const previousTitle = document.title;
    const previousBodyClass = document.body.className;
    const previousHtmlAttrs = {};

    if (title) {
      document.title = title;
    }

    if (typeof bodyClass === "string") {
      document.body.className = bodyClass;
    }

    if (htmlAttrs && typeof htmlAttrs === "object") {
      Object.entries(htmlAttrs).forEach(([key, value]) => {
        previousHtmlAttrs[key] = document.documentElement.getAttribute(key);
        if (value === false || value == null) {
          document.documentElement.removeAttribute(key);
          return;
        }
        if (value === true) {
          document.documentElement.setAttribute(key, "");
          return;
        }
        document.documentElement.setAttribute(key, String(value));
      });
    }

    bases.forEach((baseTag) => {
      const key = attrsKey("base", baseTag || {});
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("base");
        applyAttributes(el, baseTag);
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    metas.forEach((metaTag) => {
      const key = attrsKey("meta", metaTag || {});
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("meta");
        applyAttributes(el, metaTag);
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    const forcedLinks = [];
    const pathName = window.location?.pathname || "";
    const isSuperadminRoute = pathName.startsWith("/superadmin");
    const isEmployeeRoute = pathName.startsWith("/employee");
    const isEmbed = (() => {
      try {
        return new URLSearchParams(window.location.search || "").get("embed") === "1";
      } catch (e) {
        return false;
      }
    })();
    if (isSuperadminRoute || isEmployeeRoute) {
      forcedLinks.push({ rel: "stylesheet", href: "/superadmin/assets/css/index.css" });
    }

    const forcedStyles = [];
    if (isSuperadminRoute || isEmployeeRoute) {
      forcedStyles.push(`
        @media (max-width: 768px) {
          html, body {
            max-width: 100%;
            overflow-x: hidden;
          }
          .html-page {
            max-width: 100%;
            overflow-x: hidden;
          }
          .html-page .sidebar.hidden.md\\:flex,
          .html-page .sidebar:not(#mobile-sidebar) { display: none !important; }
          .html-page #mobile-menu-open { display: inline-flex !important; }
          .html-page .flex.h-screen { height: auto; min-height: 100vh; }
          .html-page .h-screen { height: auto !important; min-height: 100vh; }
          .html-page .min-h-screen { min-height: 100vh; }
          .html-page .max-w-7xl,
          .html-page .max-w-6xl,
          .html-page .max-w-5xl,
          .html-page .max-w-4xl,
          .html-page .max-w-3xl { max-width: 100% !important; }
          .html-page header { padding-left: 1rem; padding-right: 1rem; }
          .html-page main { padding: 1rem !important; }
          .html-page [class*="grid-cols-2"],
          .html-page [class*="grid-cols-3"],
          .html-page [class*="grid-cols-4"],
          .html-page [class*="grid-cols-5"],
          .html-page [class*="grid-cols-6"] {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .html-page .flex-row { flex-direction: column; }
          .html-page .items-center.justify-between { gap: 0.75rem; }
          .html-page .gap-6,
          .html-page .gap-5,
          .html-page .gap-4 { gap: 0.75rem !important; }
          .html-page .p-8,
          .html-page .px-8,
          .html-page .py-8 { padding: 1rem !important; }
          .html-page .p-6,
          .html-page .px-6,
          .html-page .py-6 { padding: 0.875rem !important; }
          .html-page .w-72 { width: 18rem; max-width: calc(100vw - 2rem); }
          .html-page [class*="overflow-x-auto"] {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .html-page table { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .html-page thead, .html-page tbody, .html-page tr { display: table; width: 100%; table-layout: auto; }
          .html-page input,
          .html-page select,
          .html-page textarea,
          .html-page button {
            max-width: 100%;
          }
          .html-page .fixed.inset-0 > div,
          .html-page .fixed.inset-0 > aside,
          .html-page .fixed.inset-0 .max-w-2xl,
          .html-page .fixed.inset-0 .max-w-3xl,
          .html-page .fixed.inset-0 .max-w-4xl {
            width: min(100%, calc(100vw - 1rem)) !important;
            max-width: calc(100vw - 1rem) !important;
          }
        }
      `);
    }
    if ((isSuperadminRoute || isEmployeeRoute) && isEmbed) {
      forcedStyles.push(`
        body,
        .html-page {
          background: #f3f4f6 !important;
        }
        .html-page .sidebar,
        .html-page header,
        .html-page #mobile-sidebar,
        .html-page #mobile-sidebar-overlay,
        .html-page #mobile-menu-open,
        .html-page #mobile-sidebar-close {
          display: none !important;
        }
        .html-page .flex.h-screen {
          min-height: auto;
          height: auto;
        }
        .html-page .flex-1 {
          width: 100%;
        }
        .html-page main {
          padding: 1rem !important;
          background: #f3f4f6 !important;
          min-height: 100vh;
        }
      `);
    }

    const stylesheetLinks = [];

    forcedLinks.forEach((link) => {
      const key = `link:${link.href || ""}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("link");
        applyAttributes(el, link);
        return el;
      });
      if (owned) ownedElements.push(element);
      stylesheetLinks.push(element);
    });

    const hasCanonical = links.some((link) => link.rel === "canonical");
    const linksToProcess = [...links];
    if (!hasCanonical) {
      const cleanPath = pathName.replace(/\/+$/, "");
      const canonicalUrl = `https://roomhy.com${cleanPath || "/"}`;
      linksToProcess.push({ rel: "canonical", href: canonicalUrl });
    }

    linksToProcess.forEach((link) => {
      if (link.rel === "canonical") {
        document.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
      }
      const key = `link:${link.href || ""}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("link");
        applyAttributes(el, link);
        return el;
      });
      if (owned) ownedElements.push(element);
      stylesheetLinks.push(element);
    });

    const combinedStyles = [...forcedStyles, ...styles];
    combinedStyles.forEach((style, index) => {
      const key = `style:${index}:${title || "page"}`;
      const { element, owned } = ensureElement(key, () => {
        const el = document.createElement("style");
        el.textContent = style;
        return el;
      });
      if (owned) ownedElements.push(element);
    });

    let cancelled = false;
    const baseScripts = scripts || [];
    const normalizedScripts = baseScripts
      .filter((script) => {
        if (!script?.src) return true;
        const isTailwindCdn = String(script.src).includes("cdn.tailwindcss.com");
        if (isTailwindCdn && window.__TAILWIND_LOCAL__ && !isSuperadminRoute) {
          return false;
        }
        return true;
      })
      .map((script) => {
        if (!script?.src) return script;
        if (isSuperadminRoute && script.src.startsWith("./")) {
          return { ...script, src: `/superadmin/${script.src.slice(2)}` };
        }
        return script;
      });
    const disableAutoMobileMenuButton =
      disableMobileSidebar ||
      pathName === "/superadmin/index" ||
      pathName === "/employee/index";

    if (!disableMobileSidebar && (isSuperadminRoute || isEmployeeRoute) && !normalizedScripts.some((s) => String(s?.src || "").includes("mobile-sidebar.js"))) {
      normalizedScripts.push({ src: "/superadmin/mobile-sidebar.js" });
    }

    const load = async () => {
      let revealTimer = null;
      const showPageWhenReady = () => {
        if (!cancelled) {
          const htmlPageEl = document.querySelector(".html-page");
          if (htmlPageEl) {
            htmlPageEl.style.opacity = "";
            htmlPageEl.style.pointerEvents = "";
            if (!htmlPageEl.classList.contains("css-ready")) {
              htmlPageEl.classList.add("css-ready");
            }
          }
        }
      };

      // Safety reveal: avoid long blank screens on slow/blocked assets.
      revealTimer = setTimeout(showPageWhenReady, 400);

      // Legacy static scripts expect a shared API_URL global before they execute.
      if (typeof window !== "undefined" && !window.API_URL) {
        window.API_URL = getLegacyApiUrl();
      }

      await waitForStylesheets(stylesheetLinks);

      const tailwindInline = inlineScripts.filter((script) => script.includes("tailwind.config"));
      const otherInline = inlineScripts.filter((script) => !script.includes("tailwind.config"));

      for (const script of normalizedScripts) {
        try {
          if (String(script?.src || "").includes("cdn.tailwindcss.com")) {
            suppressTailwindCdnWarnings();
          }
          // Sequential load to ensure dependent globals (e.g., tailwind) exist.
          // Keep scripts in head; don't remove on cleanup to avoid re-exec.
          // eslint-disable-next-line no-await-in-loop
          await loadScriptSequentially(script);
        } catch (err) {
          console.error("Failed to load script", script?.src, err);
        }
      }

      const hasTailwindScript = normalizedScripts.some((script) =>
        String(script?.src || "").includes("cdn.tailwindcss.com")
      );
      await waitForTailwindStyles(hasTailwindScript);

      if ((isSuperadminRoute || isEmployeeRoute) && !disableAutoMobileMenuButton) {
        const ensureMobileMenuButton = () => {
          const existingPageTrigger =
            document.getElementById("mobile-menu-open") ||
            document.getElementById("sa-mobile-toggle") ||
            document.querySelector("[data-mobile-menu-trigger='1']") ||
            document.querySelector("header button.md\\:hidden") ||
            document.querySelector("header button[class*='md:hidden']");
          let btn = document.getElementById("mobile-menu-open") || document.getElementById("sa-mobile-toggle");
          if (!btn && !existingPageTrigger) {
            btn = document.createElement("button");
            btn.id = "mobile-menu-open";
            btn.dataset.hpFallback = "1";
            btn.className = "md:hidden";
            btn.setAttribute("aria-label", "Open menu");
            btn.innerHTML = '<span style="font-size:24px;line-height:1;">&#9776;</span>';
            // Absolute fallback position so it is always visible on mobile
            btn.style.position = "fixed";
            btn.style.top = "12px";
            btn.style.left = "12px";
            btn.style.zIndex = "9999";
            btn.style.padding = "6px 10px";
            btn.style.borderRadius = "8px";
            btn.style.border = "1px solid rgba(148,163,184,0.6)";
            btn.style.background = "#ffffff";
            btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
            document.body.appendChild(btn);
          } else if (btn && btn.dataset.hpFallback === "1" && window.innerWidth < 768) {
            btn.style.display = "inline-flex";
          }
          if (!btn) return;
          btn.style.display = window.innerWidth < 768 ? "inline-flex" : "none";
        };
        ensureMobileMenuButton();
        window.addEventListener("resize", ensureMobileMenuButton);
      }

      otherInline.forEach((script, index) => {
        const key = `inline-script:post:${hashString(script)}:${index}:${title || "page"}`;
        if (wasInlineExecuted(key)) return;
        markInlineExecuted(key);
        if (cancelled) return;
        const el = document.createElement("script");
        const needsTailwindGuard = script.includes("tailwind.");
        el.textContent = needsTailwindGuard
          ? `window.tailwind = window.tailwind || {};\n${script}`
          : script;
        el.setAttribute("data-hp-key", key);
        document.head.appendChild(el);
      });

      // Tailwind config must run after tailwind CDN is available.
      tailwindInline.forEach((script, index) => {
        const key = `inline-script:tailwind:${hashString(script)}:${index}:${title || "page"}`;
        if (wasInlineExecuted(key)) return;
        markInlineExecuted(key);
        if (cancelled) return;
        const el = document.createElement("script");
        el.textContent = `window.tailwind = window.tailwind || {};\n${script}`;
        el.setAttribute("data-hp-key", key);
        document.head.appendChild(el);
      });

      // Trigger Tailwind CSS to rescan the DOM for new classes
      if (!cancelled) {
        if (revealTimer) {
          clearTimeout(revealTimer);
          revealTimer = null;
        }

        try {
          if (hasTailwindScript) {
            rescanTailwind();
          }
        } catch (err) {
          console.debug("Initial rescan error:", err);
        }

        setTimeout(() => {
          if (!cancelled) {
            try {
              if (hasTailwindScript) {
                rescanTailwind();
              }
            } catch (err) {
              console.debug("Rescan 120ms error:", err);
            }
          }
        }, 120);

        setTimeout(() => {
          if (!cancelled) {
            if (!disableMobileSidebar && (isSuperadminRoute || isEmployeeRoute) && typeof window._initMobileSidebar === 'function') {
              try {
                window._initMobileSidebar();
              } catch (err) {
                console.debug("Mobile sidebar init error:", err);
              }
            }
            if (isEmployeeRoute) {
              try {
                applyEmployeeSidebarPermissions();
                if (!window._employeeSidebarObserver) {
                  const observer = new MutationObserver(() => {
                    try {
                      const nodes = Array.from(document.querySelectorAll(".sidebar nav, #dynamicSidebarNav"))
                        .filter((node) => node && node.closest(".sidebar"));
                      const needsRefresh = nodes.some((node) => node.getAttribute("data-employee-sidebar") !== "1");
                      if (needsRefresh) {
                        applyEmployeeSidebarPermissions();
                      }
                    } catch (err) {
                      console.debug("Employee sidebar observer error:", err);
                    }
                  });
                  observer.observe(document.body, { childList: true, subtree: true });
                  window._employeeSidebarObserver = observer;
                }
                if (!window._employeeSidebarClickHandler) {
                  window._employeeSidebarClickHandler = (event) => {
                    const link = event.target?.closest?.("a[href]");
                    if (!link) return;
                    const href = link.getAttribute("href") || "";
                    if (!href.startsWith("/superadmin/")) return;
                    if (!link.closest(".sidebar")) return;
                    const mapped = href.replace("/superadmin/", "/employee/");
                    event.preventDefault();
                    window.location.href = mapped === "/employee/superadmin" ? "/employee/areaadmin" : mapped;
                  };
                  document.addEventListener("click", window._employeeSidebarClickHandler);
                }
              } catch (err) {
                console.debug("Employee sidebar filter error:", err);
              }
            }
            try {
              applyWebsiteChrome();
            } catch (e) {
              // ignore
            }
            showPageWhenReady();
          }
        }, 220);

        setTimeout(() => {
          if (!cancelled) {
            const htmlPageEl = document.querySelector(".html-page");
            if (htmlPageEl && !htmlPageEl.classList.contains("css-ready")) {
              try {
                if (hasTailwindScript) {
                  rescanTailwind();
                }
              } catch (err) {
                console.debug("Safety rescan error:", err);
              }
              showPageWhenReady();
            }
          }
        }, 600);
      }
    };

    load();

    return () => {
      ownedElements.forEach((el) => el.remove());
      cancelled = true;
      if (title) {
        document.title = previousTitle;
      }
      if (typeof bodyClass === "string") {
        document.body.className = previousBodyClass;
      }
      if (htmlAttrs && typeof htmlAttrs === "object") {
        Object.keys(htmlAttrs).forEach((key) => {
          const previousValue = previousHtmlAttrs[key];
          if (previousValue == null) {
            document.documentElement.removeAttribute(key);
          } else {
            document.documentElement.setAttribute(key, previousValue);
          }
        });
      }
    };
  }, [configKey]);
};
