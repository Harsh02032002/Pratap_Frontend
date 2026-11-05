import React from "react";
import { useHtmlPage } from "../../utils/htmlPage";
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export default function DigitalCheckinOwnerSuccess() {
  useHtmlPage({
    title: "Welcome to RoomHy",
    bodyClass: "min-h-screen bg-[#F8FAFC]",
    htmlAttrs: { lang: "en" },
    metas: [
      { charset: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" }
    ],
    links: [
      {
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
        rel: "stylesheet"
      }
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
    ? {
        title: "Verification Pending",
        text: "Owner verification is still pending. Please check back after completing your KYC.",
        done: false
      }
    : agreementSigned
    ? {
        title: "Welcome to RoomHy",
        text: "Owner check-in completed. Login link with your Owner ID and password has been sent to your registered email.",
        done: true
      }
    : {
        title: "Check-in Submitted",
        text: "Your owner digital check-in has been submitted. You will receive login credentials by email shortly.",
        done: true
      };

  return (
    <div className="html-page w-full min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Light Clean Header */}
      <header className="border-b border-[#E1E6EA] bg-white shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/website/roomhy_logo.jpeg"
              alt="Roomhy Logo"
              className="h-11 w-auto rounded-lg border border-[#E1E6EA] bg-white px-2 py-1 object-contain sm:h-12"
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0E7C86]">
                Digital Check-In
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-[#10242A] leading-tight">
                Owner Onboarding Complete
              </h1>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#F0FDFA] border border-[#99F6E4] px-3 py-1 text-xs font-semibold text-[#0F766E]">
            <ShieldCheck className="w-4 h-4 text-[#0E7C86]" /> Verified Portal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto flex min-h-[calc(100vh-84px)] max-w-5xl items-center px-4 py-10 sm:px-6">
        <section className="relative w-full overflow-hidden rounded-2xl border border-[#E1E6EA] bg-white shadow-lg">
          <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1.15fr_1fr] md:p-10 items-stretch">
            {/* Left Column: Status & Owner ID */}
            <div className="flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    state.done
                      ? "border-[#B7E4C7] bg-[#DDF3E4] text-[#14532D]"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {state.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D]" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-700" />
                  )}
                  {state.done ? "Completed" : "Action Needed"}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-[#10242A]">
                  {state.title}
                </h2>
                <p className="max-w-xl text-sm sm:text-base leading-relaxed text-[#4A5961]">
                  {state.text}
                </p>
              </div>

              {loginId && (
                <div className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                      Official Owner Login ID
                    </p>
                    <p className="mt-1 break-all font-mono text-base font-extrabold text-[#10242A]">
                      {loginId}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-white border border-[#99F6E4] flex items-center justify-center text-[#0E7C86] shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Light Theme Next Step Card */}
            <aside className="flex flex-col justify-between rounded-2xl border border-[#99F6E4] bg-gradient-to-br from-[#F0FDFA] via-[#F8FAFC] to-[#E6F4F5] p-6 text-[#10242A] shadow-xs">
              <div>
                <span className="inline-block rounded-md bg-white border border-[#99F6E4] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0E7C86]">
                  Next Step
                </span>
                <h3 className="mt-3 text-xl sm:text-2xl font-extrabold leading-snug text-[#10242A]">
                  Open Property Owner Dashboard
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4A5961]">
                  Continue to login with your Owner ID and start managing your properties, rooms, bookings, and tenant check-ins.
                </p>
              </div>

              <a
                href={nextUrl}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold uppercase tracking-wider transition shadow-sm ${
                  state.done
                    ? "bg-[#0E7C86] text-white hover:bg-[#095256]"
                    : "pointer-events-none bg-slate-200 text-slate-500"
                }`}
              >
                <span>Go to Owner Login</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
