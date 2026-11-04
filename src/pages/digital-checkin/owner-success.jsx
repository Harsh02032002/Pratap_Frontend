import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";

export default function DigitalCheckinOwnerSuccess() {
  useHtmlPage({
    title: "Welcome to RoomHy",
    bodyClass: "flex items-center justify-center min-h-screen p-4",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      { href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap", rel: "stylesheet" }
    ],
    scripts: [{ src: "https://cdn.tailwindcss.com" }],
    inlineScripts: []
  });

  const params = new URLSearchParams(window.location.search);
  const loginId = params.get("loginId") || "";
  const nextUrl = params.get("next") || "/propertyowner/index";
  const agreementSigned = params.get("agreementSigned") === "1";
  const agreementPending = params.get("agreementPending") === "1";

  const state = agreementPending
    ? { title: "Verification Pending", text: "Owner verification is still pending. Please check back after completing your KYC.", done: false }
    : agreementSigned
      ? { title: "Welcome to RoomHy", text: "Owner check-in completed. Login link with owner ID and password has been sent to your email.", done: true }
      : { title: "Check-in Submitted", text: "Your owner digital check-in has been submitted. You will receive login credentials by email shortly.", done: true };

  return (
    <div className="html-page w-full">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e9f2ff_0%,_#f4f7fb_45%,_#eef1f5_100%)]">
        <header className="border-b border-slate-200 bg-slate-950">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4 sm:px-6">
            <img src="/website/roomhy_logo.jpeg" alt="Roomhy Logo" className="h-12 w-auto rounded-lg bg-white px-2.5 py-1 object-contain sm:h-14" />
            <div className="text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Digital Check-In</p>
              <h1 className="text-xl font-bold">Owner Success</h1>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-90px)] max-w-5xl items-center px-4 py-10 sm:px-6">
          <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_65px_-35px_rgba(15,23,42,0.45)]">
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-200/60 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-300/40 blur-3xl" />

            <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1.1fr_1fr] md:p-10">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${state.done ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {state.done ? "Completed" : "Action Needed"}
                </div>

                <h2 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                  {state.title}
                </h2>
                <p className="max-w-xl text-base leading-7 text-slate-600">{state.text}</p>

                {loginId && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Owner ID</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-900">{loginId}</p>
                  </div>
                )}
              </div>

              <aside className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Next Step</p>
                <h3 className="mt-2 text-2xl font-bold leading-tight">Open Property Owner Dashboard</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Continue to login and start managing properties, bookings, and tenant actions.
                </p>
                <a
                  href={nextUrl}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${state.done ? "bg-cyan-300 text-slate-900 hover:bg-cyan-200" : "pointer-events-none bg-slate-700 text-slate-400"}`}
                >
                  Go to Owner Login
                </a>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
