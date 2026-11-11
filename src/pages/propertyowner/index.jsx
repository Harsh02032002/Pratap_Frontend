import React, { useEffect } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

export default function Index() {
  useHtmlPage({
    title: "Roomhy - Owner Login",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" },
      { rel: "stylesheet", href: "/propertyowner/assets/css/index.css" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }, { src: "https://unpkg.com/lucide@latest" }],
    inlineScripts: []
  });

  useEffect(() => {
    if (window?.lucide) window.lucide.createIcons();
  }, []);

  const goToTenantLogin = () => {
    const host = window.location.hostname;
    if (host === "admin.roomhy.com" || host === "www.admin.roomhy.com") {
      window.location.href = "https://admin.roomhy.com/tenant/tenantlogin";
      return;
    }
    window.location.href = "/tenant/tenantlogin";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-card rounded-xl shadow-soft w-full max-w-md p-8 text-center relative overflow-hidden border border-border">
        <a href="/website/index" className="inline-flex items-center justify-center mb-6">
          <img src="/website/roomhy_logo.jpeg" alt="Roomhy Logo" className="h-12 w-auto object-contain" />
        </a>

        <div className="mb-6 flex justify-center gap-3">
          <a href="/propertyowner/ownerlogin" className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
            Owner Login
          </a>
          <button type="button" onClick={goToTenantLogin} className="px-6 py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-slate-200 transition-all">
            Tenant Login
          </button>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Portal Login</h1>
        <p className="text-muted-foreground text-sm">Choose your role to proceed.</p>
      </div>
    </div>
  );
}


