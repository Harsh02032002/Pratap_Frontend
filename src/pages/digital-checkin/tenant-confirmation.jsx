import React, { useEffect, useMemo } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const resolveTenantDashboardUrl = () => {
  return "/tenant/tenantdashboard";
};

export default function DigitalCheckinTenantConfirmation() {
  useHtmlPage({
    title: "RoomHy - Agreement Signed Successfully",
    bodyClass: "",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [{ rel: "stylesheet", href: "/digital-checkin/assets/css/tenant-confirmation.css" }],
    styles: [],
    scripts: [],
    inlineScripts: []
  });

  const nextUrl = useMemo(() => (typeof window === "undefined" ? "" : resolveTenantDashboardUrl()), []);

  useEffect(() => {
    if (!nextUrl) return;
    const timer = setTimeout(() => {
      try {
        window.location.replace(nextUrl);
      } catch (_) {
        window.location.href = nextUrl;
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [nextUrl]);

  return (
    <div className="html-page">
      <div className="card">
        <div className="icon">&#10003;</div>
        <h1>Agreement Signed Successfully! 🎉</h1>
        <p>Your Licence & Subscription Agreement has been digitally signed and recorded.</p>
        <p style={{ color: '#0d9488', fontWeight: 600, marginTop: 8 }}>
          📧 The onboarding payment link has been sent to your registered Email address.
        </p>
        <div className="meta" id="redirectText" style={{ marginTop: 16 }}>Redirecting to your Tenant Panel in 2 seconds...</div>
        <a className="btn" href="/tenant/tenantdashboard" style={{ marginTop: 12 }}>Go to Tenant Panel Dashboard</a>
      </div>
    </div>
  );
}

