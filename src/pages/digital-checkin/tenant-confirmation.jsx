import React, { useEffect, useMemo } from "react";
import { useHtmlPage } from "../../utils/htmlPage";

const resolveTenantLoginUrl = () => {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? "http://localhost:5173/tenant/tenantlogin"
    : "https://app.roomhy.com/tenant/tenantlogin";
};

export default function DigitalCheckinTenantConfirmation() {
  useHtmlPage({
    title: "RoomHy - Submission Complete",
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

  const nextUrl = useMemo(() => (typeof window === "undefined" ? "" : resolveTenantLoginUrl()), []);

  useEffect(() => {
    if (!nextUrl) return;
    const timer = setTimeout(() => {
      try {
        window.location.replace(nextUrl);
      } catch (_) {
        window.location.href = nextUrl;
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [nextUrl]);

  return (
    <div className="html-page">
      <div className="card">
        <div className="icon">&#10003;</div>
        <h1>Welcome to RoomHy</h1>
        <p>Your tenant agreement has been submitted successfully.</p>
        <p>We have sent the login link to your registered Gmail.</p>
        <div className="meta" id="redirectText">Redirecting to login page in 5 seconds...</div>
        <a className="btn" href={nextUrl || "../tenant//tenant/tenantlogin"}>Go to Tenant Login Now</a>
      </div>
    </div>
  );
}

