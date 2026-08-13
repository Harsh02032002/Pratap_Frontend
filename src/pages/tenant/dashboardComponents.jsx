import React, { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine,
} from "recharts";
import {
  Home, LayoutDashboard, ReceiptText, ShieldCheck, ShieldAlert, LogOut,
  Star, UserPlus, CalendarOff, Flag, Calendar, CreditCard, Download,
  ArrowRight, ChevronRight, ChevronLeft, TrendingUp, Building2,
  CalendarDays, Wrench, Megaphone, Clock,
  Info, ArrowUpRight, ArrowDownRight, FileText, Printer, AlertCircle,
  SlidersHorizontal, Tag, MoreVertical, Inbox, X, Check, Fingerprint, Activity,
  Send, Phone, User, MapPin, Hourglass, CheckCircle2, XCircle, History,
  LayoutGrid, ChevronDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ─── Shared tokens ─────────────────────────────────────────────────────────
const PURPLE = "#6D3DF5";
export const CARD =
  "rounded-3xl border border-slate-100 bg-white shadow-[0_2px_16px_-8px_rgba(15,23,42,0.08)]";

const formatINR = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "TENANT PORTAL",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "ledger", label: "Tenant Ledger", icon: ReceiptText },
      { id: "kyc", label: "KYC Verification", icon: ShieldCheck },
      { id: "police", label: "Police Verification", icon: ShieldAlert },
      { id: "moveout", label: "Move-out Notice", icon: LogOut },
      { id: "feedback", label: "Feedback & Review", icon: Star },
    ],
  },
  {
    label: "GATE MANAGEMENT",
    items: [
      { id: "visitor", label: "Visitor Pass", icon: UserPlus },
      { id: "leave", label: "Leave Request", icon: CalendarOff },
    ],
  },
  {
    label: "HELP & REQUESTS",
    items: [{ id: "complaints", label: "Lodge Complaint", icon: Flag }],
  },
];

export function Sidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="w-64 bg-[#0f172a] flex-shrink-0 hidden md:flex flex-col">
      {/* Brand */}
      <div className="h-20 flex items-center gap-3 px-6">
        <div className="bg-[#6D3DF5] w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-[#6D3DF5]/30">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight">
            <span className="text-white">ROOMHY</span>
            <span style={{ color: "#9b78ff" }}>.com</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Discover. Rent. Live.</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-[#6D3DF5] text-white shadow-lg shadow-[#6D3DF5]/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" /> Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile top bar (brand + logout) ────────────────────────────────────────
// Restores branding lost when the sidebar is hidden on phones, and gives mobile
// users access to Logout. Visible below the `md` breakpoint only.
export function MobileTopBar({ onLogout }) {
  return (
    <header className="md:hidden flex-shrink-0 flex items-center justify-between h-14 px-4 bg-white/95 backdrop-blur-xl border-b border-[#eceef3]">
      <div className="flex items-center gap-2">
        <div className="bg-[#6D3DF5] w-8 h-8 rounded-lg flex items-center justify-center shadow-md shadow-[#6D3DF5]/30">
          <Home className="w-4 h-4 text-white" />
        </div>
        <div className="text-[14px] font-extrabold tracking-tight leading-none">
          <span className="text-slate-900">ROOMHY</span>
          <span style={{ color: "#6D3DF5" }}>.com</span>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#e7e9ef] px-3 py-1.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition"
      >
        <LogOut className="w-4 h-4 text-slate-400" /> Logout
      </button>
    </header>
  );
}

// ─── Mobile bottom navigation ────────────────────────────────────────────────
// Five primary tabs. Single-page tabs switch instantly; grouped tabs open a
// bottom sheet listing their sub-pages. Visible below the `md` breakpoint only.
const MOBILE_NAV = [
  {
    id: "home", label: "Home", icon: LayoutDashboard,
    items: [{ id: "dashboard", label: "Dashboard", desc: "Overview of your stay", icon: LayoutDashboard }],
  },
  {
    id: "ledger", label: "Ledger", icon: ReceiptText,
    items: [{ id: "ledger", label: "Tenant Ledger", desc: "Charges, payments & history", icon: ReceiptText }],
  },
  {
    id: "verification", label: "Verify", icon: ShieldCheck,
    items: [
      { id: "police", label: "Police Verification", desc: "Upload verification receipt", icon: ShieldAlert },
      { id: "kyc", label: "KYC Verification", desc: "Identity & address documents", icon: ShieldCheck },
    ],
  },
  {
    id: "requests", label: "Requests", icon: Inbox,
    items: [
      { id: "visitor", label: "Visitor Pass", desc: "Pre-approve a guest", icon: UserPlus },
      { id: "leave", label: "Leave Request", desc: "Notify a planned absence", icon: CalendarOff },
      { id: "moveout", label: "Move-out Notice", desc: "Submit your exit notice", icon: LogOut },
      { id: "feedback", label: "Feedback & Review", desc: "Rate your experience", icon: Star },
    ],
  },
  {
    id: "complaints", label: "Complaints", icon: Flag,
    items: [{ id: "complaints", label: "Lodge Complaint", desc: "Raise & track issues", icon: Flag }],
  },
];

const TAB_TO_GROUP = MOBILE_NAV.reduce((acc, g) => {
  g.items.forEach((it) => { acc[it.id] = g.id; });
  return acc;
}, {});

function MobileNavSheet({ group, activeTab, onSelect, onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const close = () => { setShow(false); setTimeout(onClose, 240); };
  const pick = (id) => { setShow(false); setTimeout(() => { onSelect(id); onClose(); }, 180); };

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div
        onClick={close}
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-[26px] bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.25)] transition-transform duration-300 ease-out ${show ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-1 pb-2">
          <h4 className="text-[15px] font-bold text-slate-900">{group.label}</h4>
          <button onClick={close} className="w-8 h-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          {group.items.map((it) => {
            const Icon = it.icon;
            const active = activeTab === it.id;
            return (
              <button
                key={it.id}
                onClick={() => pick(it.id)}
                className={`group/item w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${active ? "bg-[#6D3DF5]/8" : "hover:bg-slate-50 active:bg-slate-100"}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-[#6D3DF5] text-white" : "bg-slate-100 text-slate-500"}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[14px] font-semibold ${active ? "text-[#6D3DF5]" : "text-slate-900"}`}>{it.label}</span>
                  <span className="block text-[12px] text-slate-400 truncate">{it.desc}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav({ activeTab, setActiveTab }) {
  const [sheet, setSheet] = useState(null); // open group, or null
  const activeGroup = TAB_TO_GROUP[activeTab];

  const onTap = (group) => {
    if (group.items.length === 1) setActiveTab(group.items[0].id);
    else setSheet(group);
  };

  return (
    <>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-[#eceef3] bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_-16px_rgba(15,23,42,0.2)]">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((group) => {
            const Icon = group.icon;
            const active = activeGroup === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onTap(group)}
                className="relative flex flex-col items-center gap-1 pt-2.5 pb-2 active:scale-95 transition-transform"
              >
                <span
                  className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 ${active ? "bg-[#6D3DF5]/12" : "bg-transparent"}`}
                >
                  <Icon
                    className={`w-[21px] h-[21px] transition-colors duration-200 ${active ? "text-[#6D3DF5]" : "text-slate-400"}`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                <span className={`text-[10.5px] font-medium leading-none transition-colors ${active ? "text-[#6D3DF5]" : "text-slate-400"}`}>
                  {group.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {sheet && (
        <MobileNavSheet
          group={sheet}
          activeTab={activeTab}
          onSelect={setActiveTab}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

// ─── Dashboard Header ──────────────────────────────────────────────────────
export function DashboardHeader({ firstName, dateLabel, onPayRent }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-extrabold text-slate-900">
          Welcome back, {firstName} <span className="align-middle">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">Here's an overview of your stay and payments.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          {dateLabel}
        </div>
        <button
          onClick={onPayRent}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6D3DF5] hover:bg-[#5b30d6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6D3DF5]/25 transition-colors"
        >
          <CreditCard className="w-4 h-4" /> Pay Rent
        </button>
      </div>
    </div>
  );
}

// ─── Potted plant (SVG) ────────────────────────────────────────────────────
function PlantPot() {
  // A single teardrop leaf, fanned out around the pot's soil point (32,48).
  const leaf = (rot, fill, scale = 1) => (
    <path
      d="M0 0 C -7 -7 -7 -22 0 -30 C 7 -22 7 -7 0 0 Z"
      fill={fill}
      transform={`translate(32 48) rotate(${rot}) scale(${scale})`}
    />
  );
  return (
    <svg width="60" height="70" viewBox="0 0 64 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* leaves (back to front) */}
      {leaf(-46, "#6ee7b7", 0.85)}
      {leaf(46, "#6ee7b7", 0.85)}
      {leaf(-24, "#34d399", 0.95)}
      {leaf(24, "#34d399", 0.95)}
      {leaf(-8, "#10b981", 1.05)}
      {leaf(8, "#059669", 1.05)}
      {/* soil */}
      <ellipse cx="32" cy="50" rx="15" ry="3.5" fill="#3f2a6b" />
      {/* pot rim */}
      <rect x="15" y="47" width="34" height="8" rx="3" fill="#6D3DF5" />
      {/* pot body (tapered) */}
      <path d="M19 55 H45 L41.5 69 Q41 72.5 37.5 72.5 H26.5 Q23 72.5 22.5 69 Z" fill="#7c3aed" />
      {/* pot highlight */}
      <path d="M24 56 L26 71 Q24 71 23.5 68 Z" fill="#9b78ff" opacity="0.6" />
    </svg>
  );
}

// ─── Calendar Illustration ─────────────────────────────────────────────────
// Front calendar = today, back sheet peeking behind = tomorrow.
export function CalendarIllustration({ month = "JUN", day = "5", nextMonth = "JUN", nextDay = "6" }) {
  return (
    <div className="relative w-[210px] h-[180px] select-none">
      {/* ground shadow */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-6 rounded-[50%] bg-[#6D3DF5]/15 blur-md" />

      {/* back calendar (tomorrow), peeking behind-right */}
      <div className="absolute top-7 right-1 rotate-[8deg]">
        <div className="w-24 rounded-2xl bg-white overflow-hidden ring-1 ring-slate-100 shadow-[0_10px_26px_-14px_rgba(15,23,42,0.3)]">
          <div className="bg-[#8b66f7] text-white text-center text-[10px] font-bold tracking-widest py-1.5">
            {nextMonth}
          </div>
          <div className="py-3.5 text-center">
            <span className="text-3xl font-black text-slate-700 tabular-nums">{nextDay}</span>
          </div>
          <div className="flex justify-center gap-1 pb-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
      </div>

      {/* front calendar (today), tilted */}
      <div className="absolute top-4 left-3 rotate-[-6deg]">
        <div className="relative w-24 rounded-2xl bg-white shadow-[0_16px_30px_-16px_rgba(15,23,42,0.35)] overflow-hidden">
          {/* push-pins */}
          <div className="absolute -top-2 left-4 z-10 flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow" />
            <span className="w-[2px] h-2 bg-slate-300" />
          </div>
          <div className="absolute -top-2 right-4 z-10 flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow" />
            <span className="w-[2px] h-2 bg-slate-300" />
          </div>
          {/* header bar */}
          <div className="bg-[#6D3DF5] text-white text-center text-[11px] font-bold tracking-widest py-1.5">
            {month}
          </div>
          {/* day number */}
          <div className="py-4 text-center">
            <span className="text-4xl font-black text-slate-900 tabular-nums">{day}</span>
          </div>
          {/* tear-off dots */}
          <div className="flex justify-center gap-1.5 pb-2.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
      </div>

      {/* potted plant, bottom-left */}
      <div className="absolute bottom-1 left-0 z-20 drop-shadow-[0_6px_8px_rgba(15,23,42,0.12)]">
        <PlantPot />
      </div>
    </div>
  );
}

// ─── Hero Rent Card ────────────────────────────────────────────────────────
export function HeroRentCard({
  amountDue, isPaid, statusLabel, dueText, cal,
  onPayNow, onDownloadReceipt, hasReceipt,
}) {
  return (
    <div className="rounded-3xl bg-[#EDE7FB] p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* left half */}
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Amount Due
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[44px] leading-none font-black text-slate-900 tabular-nums">
              {formatINR(isPaid ? 0 : amountDue)}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isPaid ? "bg-emerald-50 text-emerald-600" : "bg-orange-100 text-orange-600"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{dueText}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onPayNow}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6D3DF5] hover:bg-[#5b30d6] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6D3DF5]/25 transition-colors"
            >
              <CreditCard className="w-4 h-4" /> Pay Now
            </button>
            <button
              onClick={hasReceipt ? onDownloadReceipt : undefined}
              disabled={!hasReceipt}
              title={hasReceipt ? "Download latest payment receipt" : "No payment made yet"}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors border ${
                hasReceipt
                  ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  : "bg-white/50 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          </div>
        </div>

        {/* right half */}
        <div className=" hidden md:flex justify-center md:justify-end">
          <CalendarIllustration {...cal} />
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming Dues Card ────────────────────────────────────────────────────
export function UpcomingDuesCard({ nextDueLabel, amount, daysRemaining, progress, onViewAll }) {
  return (
    <div className={`${CARD} p-6 flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Upcoming Dues</h3>
        <button
          onClick={onViewAll}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[#6D3DF5]"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-[#6D3DF5]" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">Next Due</p>
          <p className="text-sm font-bold text-slate-900">{nextDueLabel}</p>
        </div>
        <span className="text-sm font-bold text-slate-900 tabular-nums">{formatINR(amount)}</span>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#6D3DF5]"
            style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {daysRemaining != null ? `${daysRemaining} days remaining` : "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Payment Trend Chart ───────────────────────────────────────────────────
const yTickFormatter = (v) => (v >= 1000 ? `₹${v / 1000}K` : `₹${v}`);

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-900 tabular-nums">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
}

export function PaymentTrendChart({ data, percentChange }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const positive = (percentChange ?? 0) >= 0;
  return (
    <div className={`${CARD} p-6 flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Payment Trend</h3>
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
          Last 6 months
          <ChevronRight className="w-3 h-3 rotate-90" />
        </span>
      </div>

      <div className="mt-4 h-[180px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 6, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                dy={6}
              />
              <YAxis
                tickFormatter={yTickFormatter}
                tickLine={false}
                axisLine={false}
                width={46}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                domain={[0, (dataMax) => Math.ceil((dataMax + 200) / 500) * 500]}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e2e8f0" }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={PURPLE}
                strokeWidth={2.5}
                fill="url(#trendFill)"
                dot={{ r: 3, fill: "#fff", stroke: PURPLE, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: PURPLE, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No payment history yet
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${positive ? "" : "rotate-180"}`} />
          </span>
          <div className="leading-tight">
            <p className={`text-sm font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
              {percentChange == null ? "—" : `${positive ? "+" : ""}${percentChange}%`}
            </p>
            <p className="text-[11px] text-slate-400">vs previous 6 months</p>
          </div>
        </div>
        {hasData && (
          <div className="w-24 h-9">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="amount" fill={PURPLE} fillOpacity={0.25} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recent Payments Table ─────────────────────────────────────────────────
const statusBadge = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "completed") return "bg-emerald-50 text-emerald-600";
  if (s === "overdue" || s === "unpaid") return "bg-orange-100 text-orange-600";
  return "bg-amber-50 text-amber-600";
};

export function RecentPaymentsTable({ rows, onDownload, onViewAll }) {
  const hasRows = Array.isArray(rows) && rows.length > 0;
  return (
    <div className={`${CARD} p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Recent Payments</h3>
        <button
          onClick={onViewAll}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[#6D3DF5]"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {hasRows ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="font-semibold py-2 pr-4">Date</th>
                <th className="font-semibold py-2 pr-4">Description</th>
                <th className="font-semibold py-2 pr-4">Amount</th>
                <th className="font-semibold py-2 pr-4">Status</th>
                <th className="font-semibold py-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const paid = ["paid", "completed"].includes(String(r.status || "").toLowerCase());
                return (
                  <tr
                    key={r.id || i}
                    className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{r.date}</td>
                    <td className="py-3 pr-4 font-medium text-slate-800">{r.description}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatINR(r.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadge(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => paid && onDownload?.(r.item)}
                        disabled={!paid}
                        title={paid ? "Download receipt" : "Receipt unavailable"}
                        className="inline-flex text-slate-400 hover:text-[#6D3DF5] disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 py-10 text-center text-sm text-slate-400">No payment history yet</div>
      )}
    </div>
  );
}

// ─── Lease Information ─────────────────────────────────────────────────────
function LeaseRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-[18px] h-[18px] text-slate-500" />
      </div>
      <div className="flex-1 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-sm font-semibold text-slate-900 text-right">{children}</span>
      </div>
    </div>
  );
}

export function LeaseInformation({ status, property, startDate, endDate, onViewDetails }) {
  const active = String(status || "").toLowerCase() === "active";
  return (
    <div className={`${CARD} p-6`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Lease Information</h3>
        <button
          onClick={onViewDetails}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[#6D3DF5]"
        >
          View details
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <LeaseRow icon={ShieldCheck} label="Lease Status">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              active ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {status || "—"}
          </span>
        </LeaseRow>
        <LeaseRow icon={Building2} label="Property">{property || "—"}</LeaseRow>
        <LeaseRow icon={CalendarDays} label="Lease Start Date">{startDate || "—"}</LeaseRow>
        <LeaseRow icon={CalendarDays} label="Lease End Date">{endDate || "—"}</LeaseRow>
      </div>
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────
const ACTION_STYLES = {
  purple: "bg-[#6D3DF5]/10 text-[#6D3DF5]",
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

export function QuickActions({ actions }) {
  return (
    <div className={`${CARD} p-6`}>
      <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
      <div className="mt-4 space-y-1">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.title}
              onClick={a.onClick}
              className="group w-full flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  ACTION_STYLES[a.color] || ACTION_STYLES.purple
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-400 truncate">{a.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Announcement Card ─────────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const COMPLAINT_STATUS = {
  open:          { label: "Open",        cls: "bg-orange-50 text-orange-600"   },
  "in progress": { label: "In Progress", cls: "bg-blue-50 text-blue-600"       },
  resolved:      { label: "Resolved",    cls: "bg-emerald-50 text-emerald-600" },
  closed:        { label: "Closed",      cls: "bg-slate-100 text-slate-500"    },
};
const COMPLAINT_PRIORITY = {
  high:   "bg-red-50 text-red-500",
  medium: "bg-amber-50 text-amber-600",
  low:    "bg-slate-100 text-slate-500",
};

export function AnnouncementCard({ recentComplaint, onViewAll }) {
  const c = recentComplaint;
  const statusKey   = String(c?.status   || "open").toLowerCase();
  const priorityKey = String(c?.priority || "low").toLowerCase();
  const statusStyle = COMPLAINT_STATUS[statusKey]    || COMPLAINT_STATUS.open;
  const priorityCls = COMPLAINT_PRIORITY[priorityKey] || COMPLAINT_PRIORITY.low;

  return (
    <div className={`${CARD} p-6 flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Recent Complaint</h3>
        <button
          onClick={onViewAll}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[#6D3DF5]"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {c ? (
        <div className="mt-4 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
            <Flag className="w-5 h-5 text-[#6D3DF5]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">{c.category || "General"}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle.cls}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-3">
              {c.description || ""}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${priorityCls}`}>
                {c.priority || "Low"} priority
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                {relativeTime(c.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 py-8 text-center text-sm text-slate-400">No complaints raised yet</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  TENANT LEDGER  —  editorial / fintech analytics page
// ════════════════════════════════════════════════════════════════════════════

const RED = "#f4385a";
const GREEN = "#16a34a";

// Consistent premium shadow + ultra-light border for every ledger surface
const SOFT = "shadow-[0_6px_28px_-16px_rgba(15,23,42,0.16)]";
const HAIRLINE = "border border-[#eceef3]";

// Signed INR, e.g. -₹3,000 / ₹3,000
const signedINR = (v) => {
  const n = Number(v || 0);
  return `${n < 0 ? "-" : ""}₹${Math.abs(n).toLocaleString("en-IN")}`;
};

// ─── Paper / ledger illustration (Outstanding Balance card) ──────────────────
function PaperArt() {
  return (
    <svg width="118" height="124" viewBox="0 0 118 124" fill="none" className="block">
      <defs>
        <linearGradient id="paperSheet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fdeef0" />
        </linearGradient>
        <linearGradient id="paperBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fcdfe3" />
          <stop offset="100%" stopColor="#f9d2d8" />
        </linearGradient>
        <filter id="paperShadow" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#f4385a" floodOpacity="0.16" />
        </filter>
      </defs>
      {/* back sheet, peeking */}
      <rect x="34" y="20" width="60" height="84" rx="9" fill="url(#paperBack)" transform="rotate(7 64 62)" />
      {/* front sheet */}
      <g filter="url(#paperShadow)">
        <rect x="22" y="16" width="62" height="86" rx="10" fill="url(#paperSheet)" stroke="#f7c9cf" strokeWidth="1" />
      </g>
      {/* ruled lines */}
      <g stroke="#f4b8c0" strokeWidth="3.4" strokeLinecap="round" opacity="0.85">
        <line x1="33" y1="33" x2="63" y2="33" />
        <line x1="33" y1="45" x2="73" y2="45" />
        <line x1="33" y1="57" x2="58" y2="57" />
        <line x1="33" y1="69" x2="73" y2="69" />
        <line x1="33" y1="81" x2="66" y2="81" />
      </g>
      {/* red notification badge */}
      <g filter="url(#paperShadow)">
        <circle cx="86" cy="92" r="15" fill="#f4385a" />
        <rect x="84.4" y="84" width="3.2" height="9.5" rx="1.6" fill="#fff" />
        <circle cx="86" cy="98.5" r="1.9" fill="#fff" />
      </g>
    </svg>
  );
}

// ─── Wallet illustration (Summary card) ──────────────────────────────────────
function WalletArt() {
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="block">
      <defs>
        <linearGradient id="walletBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <linearGradient id="walletFlap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b66f7" />
          <stop offset="100%" stopColor="#7849f0" />
        </linearGradient>
        <linearGradient id="cardA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ede7fb" />
        </linearGradient>
        <filter id="walletShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#6133e0" floodOpacity="0.22" />
        </filter>
      </defs>
      {/* lavender circle backdrop */}
      <circle cx="75" cy="74" r="60" fill="#efeafe" />
      {/* small plant, behind wallet right */}
      <g transform="translate(118 58)">
        <path d="M0 30 C -6 18 -6 4 2 -4 C 6 8 6 22 0 30 Z" fill="#9b78ff" opacity="0.55" />
        <path d="M0 30 C 6 18 6 4 -2 -4 C -6 8 -6 22 0 30 Z" fill="#b69bff" opacity="0.5" />
        <rect x="-7" y="29" width="14" height="12" rx="3" fill="#7c4dff" opacity="0.7" />
      </g>
      {/* cards peeking out of wallet */}
      <g filter="url(#walletShadow)">
        <rect x="46" y="40" width="62" height="40" rx="7" fill="url(#cardA)" transform="rotate(-7 77 60)" />
        <rect x="50" y="46" width="60" height="40" rx="7" fill="#ddd0fb" transform="rotate(-2 80 66)" />
      </g>
      {/* wallet body */}
      <g filter="url(#walletShadow)">
        <rect x="38" y="64" width="78" height="50" rx="12" fill="url(#walletBody)" />
        {/* flap */}
        <path d="M38 78 q0 -14 14 -14 h50 q14 0 14 14 v6 H38 Z" fill="url(#walletFlap)" opacity="0.9" />
        {/* clasp pocket */}
        <rect x="92" y="82" width="30" height="20" rx="6" fill="#5a2fd6" />
        <circle cx="103" cy="92" r="5.5" fill="#efeafe" />
        <circle cx="103" cy="92" r="2.4" fill="#7c4dff" />
      </g>
    </svg>
  );
}

// ─── Date range picker modal ─────────────────────────────────────────────────
export function DateRangePicker({ isOpen, from, to, onApply, onClear, onClose }) {
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo]     = useState(to);

  useEffect(() => {
    if (isOpen) { setTempFrom(from); setTempTo(to); }
  }, [isOpen, from, to]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-80 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 text-[15px]">Filter by Date Range</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5 block">From</label>
            <input
              type="date"
              value={tempFrom}
              max={tempTo || undefined}
              onChange={(e) => setTempFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/30 focus:border-[#6D3DF5] transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5 block">To</label>
            <input
              type="date"
              value={tempTo}
              min={tempFrom || undefined}
              onChange={(e) => setTempTo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/30 focus:border-[#6D3DF5] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => { onClear(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => { onApply(tempFrom, tempTo); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-[#6D3DF5] text-[13px] font-semibold text-white hover:bg-[#5b30d6] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ledger page header ──────────────────────────────────────────────────────
export function LedgerHeader({ firstName, dateLabel, isFiltered, onOpenPicker, onPrint }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
      <div>
        <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold tracking-tight text-slate-900">
          Welcome back, {firstName} <span className="align-middle">👋</span>
        </h1>
        <p className="text-slate-400 mt-1.5 text-[15px]">
          Here's your ledger and transaction overview.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenPicker}
          className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-[13px] font-medium transition-colors ${
            isFiltered
              ? "border-[#6D3DF5] bg-[#6D3DF5]/5 text-[#6D3DF5] hover:bg-[#6D3DF5]/10"
              : "border-[#e7e9ef] bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <Calendar className={`w-4 h-4 ${isFiltered ? "text-[#6D3DF5]" : "text-slate-400"}`} />
          {dateLabel}
          <ChevronRight className={`w-3.5 h-3.5 rotate-90 ${isFiltered ? "text-[#6D3DF5]" : "text-slate-400"}`} />
        </button>
      </div>
    </div>
  );
}

// ─── Tiny sparkline (decorative) ─────────────────────────────────────────────
function Sparkline({ points, color }) {
  if (!points || points.length < 2) return null;
  const w = 120, h = 30;
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => [
    +(i * step).toFixed(1),
    +(h - 4 - ((p - min) / span) * (h - 8)).toFixed(1),
  ]);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${coords[0][0]},${h} ${line} ${coords[coords.length - 1][0]},${h}`;
  const gid = `spark-${color.replace("#", "")}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI summary cards ───────────────────────────────────────────────────────
const KPI_BASE = `rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT}`;

export function LedgerSummaryCards({
  outstanding, totalDebits, totalCredits, netBalance,
  debitCount, creditCount, debitTrend, creditTrend, asOfDate,
}) {
  const owes = outstanding > 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Outstanding Balance — accent card with paper illustration */}
      <div className={`relative overflow-hidden rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT} border-l-[3px] ${owes ? "border-l-[#f4385a]" : "border-l-emerald-500"}`}>
        {/* soft red gradient + paper art, behind content */}
        {owes && (
          <>
            <div className="pointer-events-none absolute -top-6 -right-6 w-44 h-44 rounded-full bg-gradient-to-bl from-[#ffe3e7] via-[#fff1f3] to-transparent opacity-70" />
            <div className="pointer-events-none absolute top-5 right-3 opacity-90">
              <PaperArt />
            </div>
          </>
        )}
        <div className="relative">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-[13px] font-medium">Outstanding Balance</span>
            <Info className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <p className={`mt-2.5 text-[30px] leading-none font-extrabold tabular-nums ${owes ? "text-[#f4385a]" : "text-emerald-600"}`}>
            {signedINR(outstanding)}
          </p>
          <p className="mt-3 max-w-[150px] text-[12.5px] text-slate-400 leading-snug">
            {owes ? "You have outstanding rent or other dues." : "Your account is fully settled."}
          </p>
          {owes && (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#fff1f3] px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#f4385a] flex-shrink-0" />
              <span className="text-[12px] font-medium text-[#d11d42]">Please clear them as soon as possible.</span>
            </div>
          )}
        </div>
      </div>

      {/* Total Debits */}
      <div className={KPI_BASE}>
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-medium text-slate-500">Total Debits</span>
          <span className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#f4385a]" />
          </span>
        </div>
        <p className="mt-2.5 text-[30px] leading-none font-extrabold tabular-nums text-slate-900">{signedINR(totalDebits)}</p>
        <div className="mt-2.5 flex items-center gap-2">
          {debitTrend != null && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-[#f4385a]">
              <ArrowUpRight className="w-3 h-3" />{Math.abs(debitTrend)}%
            </span>
          )}
          <span className="text-[12px] text-slate-400">{debitCount} Transactions</span>
        </div>
        <div className="mt-4 -mb-1.5"><Sparkline points={[3, 5, 4, 6, 5, 7, 6]} color={RED} /></div>
      </div>

      {/* Total Credits */}
      <div className={KPI_BASE}>
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-medium text-slate-500">Total Credits</span>
          <span className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
          </span>
        </div>
        <p className="mt-2.5 text-[30px] leading-none font-extrabold tabular-nums text-emerald-600">{signedINR(totalCredits)}</p>
        <div className="mt-2.5 flex items-center gap-2">
          {creditTrend != null && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600">
              <ArrowDownRight className="w-3 h-3" />{Math.abs(creditTrend)}%
            </span>
          )}
          <span className="text-[12px] text-slate-400">{creditCount} Transactions</span>
        </div>
        <div className="mt-4 -mb-1.5"><Sparkline points={[6, 4, 5, 3, 4, 3, 4]} color={GREEN} /></div>
      </div>

      {/* Net Balance */}
      <div className={KPI_BASE}>
        <div className="flex items-start justify-between">
          <span className="text-[13px] font-medium text-slate-500">Net Balance</span>
          <span className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
        <p className={`mt-2.5 text-[30px] leading-none font-extrabold tabular-nums ${netBalance < 0 ? "text-[#f4385a]" : netBalance > 0 ? "text-emerald-600" : "text-slate-900"}`}>
          {signedINR(netBalance)}
        </p>
        <p className="mt-4 text-[12px] text-slate-400">As of {asOfDate}</p>
      </div>
    </div>
  );
}

// ─── Balance trend chart ─────────────────────────────────────────────────────
function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)]">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="text-[13px] font-bold text-slate-900 tabular-nums">{signedINR(payload[0].value)}</p>
    </div>
  );
}

export function BalanceChart({ data, range = "Last 6 months" }) {
  const hasData = Array.isArray(data) && data.length > 1;
  const values = hasData ? data.map((d) => d.value) : [0];
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  // zero-crossing offset for the purple→red gradient (top = max, bottom = min)
  const zero = max === min ? 0.5 : Math.min(1, Math.max(0, max / (max - min)));

  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT} flex flex-col`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">Balance Trend</h3>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#eceef3] px-3 py-1.5 text-[12px] font-medium text-slate-500">
          {range}
          <ChevronRight className="w-3 h-3 rotate-90 text-slate-400" />
        </span>
      </div>

      <div className="mt-5 h-[210px] -ml-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} />
                  <stop offset={`${zero * 100}%`} stopColor={PURPLE} />
                  <stop offset={`${zero * 100}%`} stopColor={RED} />
                  <stop offset="100%" stopColor={RED} />
                </linearGradient>
                <linearGradient id="balFillTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.16} />
                  <stop offset={`${zero * 100}%`} stopColor={PURPLE} stopOpacity={0.02} />
                  <stop offset={`${zero * 100}%`} stopColor={RED} stopOpacity={0.02} />
                  <stop offset="100%" stopColor={RED} stopOpacity={0.14} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f5f5f8" strokeDasharray="0" />
              <XAxis
                dataKey="label" tickLine={false} axisLine={false}
                tick={{ fontSize: 10.5, fill: "#b9bfca" }} dy={10} interval="preserveStartEnd" minTickGap={12}
              />
              <YAxis
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v < 0 ? "-" : ""}₹${Math.abs(v) / 1000}K` : `₹${v}`)}
                tickLine={false} axisLine={false} width={48}
                tick={{ fontSize: 10.5, fill: "#b9bfca" }}
              />
              <ReferenceLine y={0} stroke="#e9e9ef" strokeWidth={1} />
              <Tooltip content={<BalanceTooltip />} cursor={{ stroke: "#e7e3fb", strokeWidth: 1.5 }} />
              <Area
                type="natural" dataKey="value"
                stroke="url(#balStroke)" strokeWidth={3}
                fill="url(#balFillTop)"
                dot={(p) => {
                  const { cx, cy, index, payload } = p;
                  if (cx == null || cy == null) return null;
                  const c = (payload?.value ?? 0) < 0 ? RED : PURPLE;
                  return <circle key={index} cx={cx} cy={cy} r={3.5} fill="#fff" stroke={c} strokeWidth={2} />;
                }}
                activeDot={(p) => {
                  const { cx, cy, index, payload } = p;
                  if (cx == null || cy == null) return null;
                  const c = (payload?.value ?? 0) < 0 ? RED : PURPLE;
                  return <circle key={index} cx={cx} cy={cy} r={5.5} fill={c} stroke="#fff" strokeWidth={2.5} />;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-slate-300">No balance history yet</div>
        )}
      </div>
    </div>
  );
}

// ─── Summary panel ───────────────────────────────────────────────────────────
export function SummaryPanel({ opening, totalDebits, totalCredits, current }) {
  const Row = ({ label, value, color, divider }) => (
    <div className={`flex items-center justify-between py-3.5 ${divider ? "border-t border-slate-100" : ""}`}>
      <span className="text-[13.5px] text-slate-500">{label}</span>
      <span className={`text-[14px] font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
  return (
    <div className={`relative overflow-hidden rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT} h-full`}>
      {/* wallet illustration, low-contrast, bottom-right */}
      <div className="pointer-events-none absolute -bottom-3 -right-2 opacity-90">
        <WalletArt />
      </div>
      <div className="relative">
        <h3 className="text-[15px] font-semibold text-slate-900">Summary</h3>
        <div className="mt-2 max-w-[230px]">
          <Row label="Opening Balance" value={signedINR(opening)} color="text-slate-700" />
          <Row label="Total Debits" value={signedINR(totalDebits)} color="text-[#f4385a]" divider />
          <Row label="Total Credits" value={signedINR(totalCredits)} color="text-emerald-600" divider />
          <Row
            label="Current Balance"
            value={signedINR(current)}
            color={current < 0 ? "text-[#f4385a]" : current > 0 ? "text-emerald-600" : "text-slate-900"}
            divider
          />
        </div>
      </div>
    </div>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────────
function FilterSelect({ icon: Icon, value, onChange, options }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full rounded-[14px] border border-[#e7e9ef] bg-white pl-10 pr-10 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
    </div>
  );
}

export function LedgerFilters({
  dateLabel, isFiltered, onOpenPicker, type, setType, category, setCategory,
  typeOptions, categoryOptions, onDownloadCsv,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <button
        type="button"
        onClick={onOpenPicker}
        className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-[13px] font-medium transition-colors ${
          isFiltered
            ? "border-[#6D3DF5] bg-[#6D3DF5]/5 text-[#6D3DF5] hover:bg-[#6D3DF5]/10"
            : "border-[#e7e9ef] bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        <Calendar className={`w-4 h-4 ${isFiltered ? "text-[#6D3DF5]" : "text-slate-400"}`} />
        {dateLabel}
        <ChevronRight className={`w-3.5 h-3.5 rotate-90 ${isFiltered ? "text-[#6D3DF5]" : "text-slate-400"}`} />
      </button>
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
        <FilterSelect icon={SlidersHorizontal} value={type} onChange={setType} options={typeOptions} />
        <FilterSelect icon={Tag} value={category} onChange={setCategory} options={categoryOptions} />
      </div>
      <button
        onClick={onDownloadCsv}
        className="lg:ml-auto inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#e7e9ef] bg-white px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <Download className="w-4 h-4 text-slate-400" /> Download CSV
      </button>
    </div>
  );
}

// ─── Ledger table ────────────────────────────────────────────────────────────
const CategoryBadge = ({ kind }) => {
  const isPayment = kind === "Payment";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
        isPayment ? "bg-emerald-50 text-emerald-600" : "bg-[#6D3DF5]/8 text-[#6D3DF5]"
      }`}
    >
      {kind}
    </span>
  );
};

export function LedgerTable({ rows, loading }) {
  return (
    <div className={`rounded-[20px] ${HAIRLINE} bg-white overflow-hidden ${SOFT}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <th className="font-semibold px-6 py-4">Date</th>
              <th className="font-semibold px-6 py-4">Description</th>
              <th className="font-semibold px-6 py-4">Category</th>
              <th className="font-semibold px-6 py-4">Debit (+)</th>
              <th className="font-semibold px-6 py-4">Credit (-)</th>
              <th className="font-semibold px-6 py-4">Balance</th>
              <th className="font-semibold px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading ledger statement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No ledger transactions found.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-[18px] text-[13.5px] text-slate-500 whitespace-nowrap">{r.date}</td>
                  <td className="px-6 py-[18px] text-[13.5px] font-medium text-slate-800">{r.details}</td>
                  <td className="px-6 py-[18px]"><CategoryBadge kind={r.category} /></td>
                  <td className="px-6 py-[18px] text-[13.5px] font-medium tabular-nums whitespace-nowrap text-[#f4385a]">
                    {r.debit > 0 ? `+ ₹${r.debit.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-[18px] text-[13.5px] font-medium tabular-nums whitespace-nowrap text-emerald-600">
                    {r.credit > 0 ? `- ₹${r.credit.toLocaleString("en-IN")}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={`px-6 py-[18px] text-[13.5px] font-semibold tabular-nums whitespace-nowrap ${
                    r.balance > 0 ? "text-[#f4385a]" : r.balance < 0 ? "text-emerald-600" : "text-slate-600"
                  }`}>
                    ₹{Math.abs(r.balance).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-[18px] text-right">
                    <button className="inline-flex text-slate-300 hover:text-slate-500 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export function Pagination({ page, pageCount, total, shown, onPage }) {
  const pages = Array.from({ length: Math.max(1, pageCount) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
      <p className="text-[12.5px] text-slate-400">
        Showing {shown} of {total} transactions
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="w-9 h-9 inline-flex items-center justify-center rounded-[10px] border border-[#e7e9ef] text-slate-400 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-[#e7e9ef] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 inline-flex items-center justify-center rounded-[10px] text-[13px] font-medium transition-colors ${
              p === page
                ? "bg-[#6D3DF5] text-white shadow-[0_6px_16px_-8px_rgba(109,61,245,0.7)]"
                : "border border-[#e7e9ef] text-slate-500 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="w-9 h-9 inline-flex items-center justify-center rounded-[10px] border border-[#e7e9ef] text-slate-400 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-[#e7e9ef] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  KYC VERIFICATION  —  read-only status / identity / timeline
// ════════════════════════════════════════════════════════════════════════════

// ─── Simple welcome header (no actions) ──────────────────────────────────────
export function KycHeader({ firstName, subtitle }) {
  return (
    <div>
      <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold tracking-tight text-slate-900">
        Welcome back, {firstName} <span className="align-middle">👋</span>
      </h1>
      <p className="text-slate-400 mt-1.5 text-[15px]">{subtitle}</p>
    </div>
  );
}

// ─── Document / magnifying-glass illustration ────────────────────────────────
function KycReviewArt() {
  return (
    <svg width="220" height="156" viewBox="0 0 220 156" fill="none" className="block">
      <defs>
        <linearGradient id="kycSheet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3eefe" />
        </linearGradient>
        <linearGradient id="kycBack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cdbbfb" />
          <stop offset="100%" stopColor="#b59cf7" />
        </linearGradient>
        <linearGradient id="kycGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b66f7" />
          <stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <filter id="kycShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#6133e0" floodOpacity="0.16" />
        </filter>
      </defs>
      {/* lavender backdrop */}
      <circle cx="128" cy="76" r="66" fill="#efeafe" />
      {/* small plant */}
      <g transform="translate(46 74)">
        <path d="M0 34 C -7 20 -7 4 2 -5 C 7 9 7 24 0 34 Z" fill="#9b78ff" opacity="0.5" />
        <path d="M0 34 C 7 20 7 4 -2 -5 C -7 9 -7 24 0 34 Z" fill="#b69bff" opacity="0.45" />
        <rect x="-8" y="33" width="16" height="14" rx="3" fill="#7c4dff" opacity="0.65" />
      </g>
      {/* back sheet */}
      <rect x="112" y="28" width="72" height="96" rx="11" fill="url(#kycBack)" transform="rotate(6 148 76)" />
      {/* front sheet with folded corner */}
      <g filter="url(#kycShadow)">
        <path d="M98 32 h56 l20 20 v66 a9 9 0 0 1 -9 9 h-67 a9 9 0 0 1 -9 -9 v-77 a9 9 0 0 1 9 -9 Z" fill="url(#kycSheet)" stroke="#e7ddfb" strokeWidth="1" />
        <path d="M154 32 v15 a5 5 0 0 0 5 5 h15 Z" fill="#b59cf7" />
      </g>
      {/* ruled lines */}
      <g stroke="#dccff8" strokeWidth="3.4" strokeLinecap="round">
        <line x1="110" y1="64" x2="158" y2="64" />
        <line x1="110" y1="77" x2="164" y2="77" />
        <line x1="110" y1="90" x2="146" y2="90" />
      </g>
      {/* check badge on doc */}
      <circle cx="158" cy="106" r="11" fill="#6D3DF5" />
      <path d="M153.5 106 l3 3 l6 -6.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* magnifying glass */}
      <g filter="url(#kycShadow)">
        <rect x="113" y="116" width="9" height="24" rx="4.5" fill="url(#kycGlass)" transform="rotate(-45 117 128)" />
        <circle cx="100" cy="104" r="21" fill="#fff" stroke="url(#kycGlass)" strokeWidth="6" />
        <circle cx="100" cy="104" r="13" fill="#efeafe" opacity="0.6" />
      </g>
    </svg>
  );
}

// ─── Verification status (hero) card ─────────────────────────────────────────
const KYC_STATUS = {
  submitted: {
    title: "KYC Under Review", badge: "In Progress", badgeCls: "bg-[#6D3DF5]/10 text-[#6D3DF5]",
    lines: ["Your documents have been submitted successfully.", "Our team is reviewing them. We will notify you once verified."],
  },
  verified: {
    title: "KYC Verified", badge: "Verified", badgeCls: "bg-emerald-50 text-emerald-600",
    lines: ["Your identity check is complete and approved.", "No further action is required."],
  },
  rejected: {
    title: "KYC Rejected", badge: "Action Required", badgeCls: "bg-rose-50 text-rose-600",
    lines: ["Your documents did not meet the verification criteria.", "Please review the details and re-submit below."],
  },
  pending: {
    title: "KYC Pending", badge: "Pending", badgeCls: "bg-amber-50 text-amber-600",
    lines: ["Your identity details have not been submitted yet.", "Add your documents below to begin verification."],
  },
};

export function VerificationStatusCard({ status = "submitted" }) {
  const s = KYC_STATUS[status] || KYC_STATUS.submitted;
  return (
    <div className={`relative overflow-hidden rounded-[22px] ${HAIRLINE} bg-white p-6 sm:p-7 ${SOFT}`}>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block">
        <KycReviewArt />
      </div>
      <div className="relative flex items-start gap-4 max-w-[560px]">
        <span className="w-12 h-12 rounded-full bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-[22px] h-[22px] text-[#6D3DF5]" />
        </span>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-[18px] font-bold text-slate-900">{s.title}</h3>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.badgeCls}`}>{s.badge}</span>
          </div>
          <p className="mt-2 text-[13.5px] text-slate-400 leading-relaxed">
            {s.lines[0]}<br />{s.lines[1]}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Read-only field ─────────────────────────────────────────────────────────
export function ReadOnlyField({ label, value, required, muted }) {
  return (
    <div>
      <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
        {label}{required && " *"}
      </label>
      <div
        className={`mt-2 h-12 flex items-center rounded-[14px] border px-4 text-[14px] tabular-nums ${
          muted
            ? "border-[#eceef3] bg-white text-slate-400 font-normal"
            : "border-[#e0e2e9] bg-[#fafafb] text-slate-700 font-medium"
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Identity information card ───────────────────────────────────────────────
export function IdentityInformationCard({ aadhaar, aadhaarPhone, pan, name, relationship, altProofUrl, altProofType }) {
  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 sm:p-7 ${SOFT}`}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Fingerprint className="w-[18px] h-[18px] text-slate-500" />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Identity Information</h3>
          <p className="text-[12.5px] text-slate-400">Your provided identity details</p>
        </div>
      </div>

      {altProofUrl ? (
        // Onboarded without Aadhaar — show the alternate ID proof that was submitted
        // instead, rather than a blank/dashed Aadhaar field.
        <div className="mt-6">
          <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            {altProofType || "ID Proof"} Submitted
          </label>
          <a href={altProofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block w-fit">
            <img
              src={altProofUrl}
              alt={altProofType || "ID Proof"}
              className="w-40 h-28 object-cover rounded-[14px] border border-[#e0e2e9] hover:opacity-90 transition-opacity"
            />
          </a>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <ReadOnlyField label="Aadhaar Number" required value={aadhaar} />
          <ReadOnlyField label="Aadhaar Linked Phone" value={aadhaarPhone} />
        </div>
      )}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        <ReadOnlyField label="PAN Number (Optional)" value={pan} />
        <ReadOnlyField label="Name on Document" value={name} muted />
        <ReadOnlyField label="Relationship" value={relationship} muted />
      </div>
    </div>
  );
}

// ─── Verification timeline ───────────────────────────────────────────────────
// stages drive the node state: "done" → purple + check, "active" → filled glow,
// "pending" → hollow gray. Connector is solid purple after a done step, else dashed.
function timelineFor(status, date, digilockerVerified) {
  const base = [
    { label: "Details Submitted", key: "submitted" },
    { label: "Under Review", key: "review" },
    { label: "Verification", key: "verification" },
    { label: "Completed", key: "completed" },
  ];
  const submittedLike = status === "submitted" || status === "rejected";
  const states =
    status === "verified" ? ["done", "done", "done", "done"]
    // DigiLocker e-verified → review & identity verification done, owner sign-off pending
    : submittedLike && digilockerVerified ? ["done", "done", "done", "active"]
    : submittedLike ? ["done", "active", "pending", "pending"]
    : ["active", "pending", "pending", "pending"]; // pending / none
  return base.map((s, i) => ({
    ...s,
    state: states[i],
    date: states[i] === "pending" ? "Pending" : date,
  }));
}

export function VerificationTimeline({ status = "submitted", date, digilockerVerified }) {
  const steps = timelineFor(status, date, digilockerVerified);
  const last = steps.length - 1;
  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 sm:p-7 ${SOFT}`}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <Activity className="w-[18px] h-[18px] text-[#6D3DF5]" />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">Verification Progress</h3>
          <p className="text-[12.5px] text-slate-400">
            {status === "verified" ? "Your KYC verification is complete" : "Your KYC verification is currently in progress"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-start">
        {steps.map((step, i) => {
          const leftSolid = i > 0 && steps[i - 1].state === "done";
          const rightSolid = step.state === "done";
          const Segment = ({ side, solid }) => (
            <span
              className={`absolute top-[14px] ${side === "left" ? "left-0" : "right-0"} w-1/2 ${
                solid
                  ? "h-[2px] bg-[#6D3DF5]"
                  : "h-0 border-t-2 border-dashed border-slate-200"
              }`}
            />
          );
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              <div className="relative flex items-center justify-center w-full h-7">
                {i > 0 && <Segment side="left" solid={leftSolid} />}
                {i < last && <Segment side="right" solid={rightSolid} />}
                {/* node */}
                {step.state === "done" ? (
                  <span className="relative z-10 w-7 h-7 rounded-full bg-[#6D3DF5] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </span>
                ) : step.state === "active" ? (
                  <span className="relative z-10 w-7 h-7 rounded-full bg-[#6D3DF5] ring-4 ring-[#6D3DF5]/15 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="relative z-10 w-7 h-7 rounded-full border-2 border-slate-200 bg-white" />
                )}
              </div>
              <div className="mt-3 text-center px-1">
                <p className={`text-[12.5px] font-semibold ${step.state === "pending" ? "text-slate-400" : "text-slate-800"}`}>
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{step.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MOVE-OUT NOTICE
// ════════════════════════════════════════════════════════════════════════════

// ─── Generic welcome header (no actions) ─────────────────────────────────────
export function WelcomeHeader({ firstName, subtitle }) {
  return (
    <div>
      <h1 className="text-[26px] sm:text-[30px] leading-tight font-bold tracking-tight text-slate-900">
        Welcome back, {firstName} <span className="align-middle">👋</span>
      </h1>
      <p className="text-slate-400 mt-1.5 text-[15px]">{subtitle}</p>
    </div>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────
// `home` shows a leading Home icon (with chevron) instead of the purple dot.
export function Breadcrumb({ items, home = false }) {
  return (
    <nav className="flex items-center gap-2.5 text-[13px]">
      {home && (
        <>
          <Home className="w-4 h-4 text-slate-400" />
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </>
      )}
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
          <span className={`inline-flex items-center gap-2 ${it.active ? "text-[#6D3DF5] font-semibold" : "text-slate-400 font-medium"}`}>
            {!home && i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#6D3DF5]" />}
            {it.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// ─── Door + moving boxes illustration ────────────────────────────────────────
function MoveOutDoorArt() {
  return (
    <svg width="200" height="150" viewBox="0 0 200 150" fill="none" className="block">
      <defs>
        <linearGradient id="moDoor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b66f7" />
          <stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <linearGradient id="moBox" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7ddfb" />
          <stop offset="100%" stopColor="#d3c2f8" />
        </linearGradient>
        <filter id="moShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#6133e0" floodOpacity="0.16" />
        </filter>
      </defs>
      {/* lavender backdrop */}
      <circle cx="120" cy="78" r="60" fill="#efeafe" />
      {/* sparkles */}
      <circle cx="72" cy="40" r="2.2" fill="#c4b3f7" />
      <circle cx="168" cy="58" r="2.6" fill="#c4b3f7" />
      <circle cx="152" cy="34" r="1.6" fill="#d7ccfa" />
      {/* door frame */}
      <g filter="url(#moShadow)">
        <path d="M108 34 h44 a7 7 0 0 1 7 7 v76 a4 4 0 0 1 -4 4 h-50 a4 4 0 0 1 -4 -4 v-76 a7 7 0 0 1 7 -7 Z" fill="#e3d9fb" />
      </g>
      {/* doorway interior */}
      <rect x="114" y="42" width="40" height="75" rx="4" fill="#cdbcf6" />
      {/* open door panel */}
      <g filter="url(#moShadow)">
        <path d="M114 42 L156 33 V120 L114 117 Z" fill="url(#moDoor)" />
      </g>
      {/* door inset panels */}
      <rect x="121" y="52" width="26" height="24" rx="3" fill="#fff" opacity="0.12" />
      <rect x="121" y="84" width="26" height="24" rx="3" fill="#fff" opacity="0.12" />
      {/* handle */}
      <circle cx="120" cy="82" r="2.6" fill="#efeafe" />
      {/* moving boxes */}
      <g filter="url(#moShadow)">
        <rect x="82" y="92" width="42" height="31" rx="4" fill="url(#moBox)" />
        <rect x="82" y="92" width="42" height="10" rx="3" fill="#bda6f8" />
        <line x1="103" y1="92" x2="103" y2="123" stroke="#9b78ff" strokeWidth="1.6" opacity="0.5" />
        <rect x="120" y="104" width="30" height="20" rx="4" fill="#d3c2f8" />
        <rect x="120" y="104" width="30" height="7" rx="3" fill="#bda6f8" />
      </g>
      {/* small plant */}
      <g transform="translate(64 98)">
        <path d="M0 22 C -5 12 -5 2 1 -4 C 5 4 5 15 0 22 Z" fill="#9b78ff" opacity="0.55" />
        <path d="M0 22 C 5 12 5 2 -1 -4 C -5 4 -5 15 0 22 Z" fill="#b69bff" opacity="0.5" />
        <rect x="-6" y="21" width="12" height="11" rx="2.5" fill="#7c4dff" opacity="0.7" />
      </g>
    </svg>
  );
}

// ─── Move-out hero ───────────────────────────────────────────────────────────
export function MoveOutHero() {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 rounded-2xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-[22px] h-[22px] text-[#6D3DF5]" />
        </span>
        <div>
          <h2 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-slate-900">Move-out Request</h2>
          <p className="text-slate-400 mt-1 text-[14px]">Submit your checkout notice to the property management team.</p>
        </div>
      </div>
      <div className="hidden sm:block flex-shrink-0 -my-3">
        <MoveOutDoorArt />
      </div>
    </div>
  );
}

// ─── Move-out form (presentational; logic stays in parent) ───────────────────
export function MoveOutForm({ date, setDate, reason, setReason, msg, submitting, onSubmit, minDate }) {
  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 sm:p-8 ${SOFT}`}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Intended Exit Date *</label>
          <input
            type="date"
            required
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full h-12 px-4 rounded-[14px] border border-[#e7e9ef] text-[14px] text-slate-700 [color-scheme:light] accent-[#6D3DF5] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason for Moving Out *</label>
          <textarea
            required
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State why you are checkout (e.g. course end, workplace relocation, etc.)"
            className="mt-2 w-full p-4 rounded-[14px] border border-[#e7e9ef] text-[14px] text-slate-700 placeholder:text-slate-400 resize-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors"
          />
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-slate-50 border border-[#eceef3] text-sm text-slate-600">{msg}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-[14px] bg-[#6D3DF5] hover:bg-[#5b30d6] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_12px_26px_-12px_rgba(109,61,245,0.7)] disabled:opacity-60 active:scale-[0.99] transition-all"
        >
          <Send className="w-4 h-4" /> {submitting ? "Submitting Notice…" : "Submit Exit Notice"}
        </button>
      </form>
    </div>
  );
}

// ─── Clipboard illustration (subtle) ─────────────────────────────────────────
function ClipboardArt() {
  return (
    <svg width="150" height="112" viewBox="0 0 150 112" fill="none" className="block">
      {/* dotted grid */}
      <g fill="#e6ddfb">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => (
            <circle key={`${r}-${c}`} cx={10 + c * 9} cy={14 + r * 9} r="1.4" />
          ))
        )}
      </g>
      {/* clipboard */}
      <rect x="58" y="16" width="70" height="88" rx="9" fill="#f1ecfd" stroke="#e2d8fb" strokeWidth="1" />
      <rect x="80" y="9" width="26" height="13" rx="4" fill="#d9ccf8" />
      <g stroke="#ddd2f7" strokeWidth="4" strokeLinecap="round">
        <line x1="70" y1="40" x2="116" y2="40" />
        <line x1="70" y1="54" x2="108" y2="54" />
        <line x1="70" y1="68" x2="116" y2="68" />
        <line x1="70" y1="82" x2="100" y2="82" />
      </g>
      {/* pen */}
      <rect x="112" y="58" width="9" height="44" rx="4.5" fill="#c4b3f7" transform="rotate(34 116 80)" />
    </svg>
  );
}

// ─── Important note card ─────────────────────────────────────────────────────
export function ImportantNoteCard() {
  return (
    <div className={`relative overflow-hidden rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT}`}>
      <div className="pointer-events-none absolute right-3 bottom-0 opacity-60 hidden sm:block">
        <ClipboardArt />
      </div>
      <div className="relative flex items-start gap-4">
        <span className="w-11 h-11 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#6D3DF5]" />
        </span>
        <div>
          <h4 className="text-[15px] font-bold text-slate-900">Important Note</h4>
          <p className="text-[13px] text-slate-400 mt-1 max-w-[420px] leading-relaxed">
            Once submitted, Owner will review your request and get in touch with you.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── QR code illustration (decorative 17×17 grid) ────────────────────────────
function QrCodeArt({ size = 80 }) {
  const D = 1, _ = 0;
  const g = [
    [D,D,D,D,D,D,D,_,D,_,D,D,D,D,D,D,D],
    [D,_,_,_,_,_,D,_,_,_,D,_,_,_,_,_,D],
    [D,_,D,D,D,_,D,_,D,_,D,_,D,D,D,_,D],
    [D,_,D,D,D,_,D,_,_,D,D,_,D,D,D,_,D],
    [D,_,D,D,D,_,D,_,D,_,_,_,D,D,D,_,D],
    [D,_,_,_,_,_,D,_,D,D,_,_,_,_,_,_,D],
    [D,D,D,D,D,D,D,_,D,_,D,_,D,D,D,D,D],
    [_,_,_,_,_,_,_,_,_,D,_,_,_,_,_,_,_],
    [D,_,D,D,_,D,D,D,D,_,D,D,_,D,_,D,_],
    [_,_,D,_,_,_,_,_,_,_,_,D,D,_,D,_,_],
    [D,D,_,D,D,_,D,_,_,_,D,_,_,D,D,_,D],
    [_,_,_,_,_,_,_,_,D,D,_,D,_,_,D,D,_],
    [D,D,D,D,D,D,D,_,D,_,D,_,D,_,_,_,D],
    [D,_,_,_,_,_,D,_,_,D,_,D,_,_,_,D,_],
    [D,_,D,D,D,_,D,_,D,_,_,_,D,D,_,_,D],
    [D,_,D,D,D,_,D,_,_,D,D,_,_,_,D,_,_],
    [D,_,_,_,_,_,D,_,_,_,D,D,_,D,D,_,D],
  ];
  const N = 17, M = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="white" />
      {g.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect key={`${r}-${c}`} x={c * M} y={r * M} width={M - 0.5} height={M - 0.5} fill="#1e1b4b" />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Visitor pass hero (left column title) ────────────────────────────────────
export function VisitorHero() {
  return (
    <div className="flex items-start gap-4">
      <span className="w-12 h-12 rounded-2xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-[22px] h-[22px] text-[#6D3DF5]" />
      </span>
      <div>
        <h2 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-slate-900">Request Visitor Pass</h2>
        <p className="text-slate-400 mt-1 text-[14px]">Pre-approve your guests for easy entry at the security gate.</p>
      </div>
    </div>
  );
}

// ─── Visitor details form card (presentational) ───────────────────────────────
export function VisitorDetailsCard({
  visitorName, setVisitorName,
  visitorPhone, setVisitorPhone,
  visitorExpectedTime, setVisitorExpectedTime,
  onSubmit, busy, msg,
}) {
  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 sm:p-8 ${SOFT}`}>
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#eceef3]">
        <span className="w-9 h-9 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-[#6D3DF5]" />
        </span>
        <h3 className="text-[16px] font-bold text-slate-800">Visitor Details</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Visitor Name *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text" required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Enter visitor full name"
              className="w-full h-12 pl-10 pr-4 rounded-[14px] border border-[#e7e9ef] text-[14px] text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number *</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="tel" required
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="Enter visitor phone number"
              className="w-full h-12 pl-10 pr-4 rounded-[14px] border border-[#e7e9ef] text-[14px] text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Expected Entry Time *</label>
          <div className="relative">
            <input
              type="datetime-local" required
              value={visitorExpectedTime}
              onChange={(e) => setVisitorExpectedTime(e.target.value)}
              className="w-full h-12 px-4 rounded-[14px] border border-[#e7e9ef] text-[14px] text-slate-700 [color-scheme:light] accent-[#6D3DF5] hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D3DF5]/15 focus:border-[#6D3DF5]/40 transition-colors"
            />
            <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-slate-50 border border-[#eceef3] text-sm text-slate-600">{msg}</div>
        )}

        <button
          type="submit" disabled={busy}
          className="w-full h-12 rounded-[14px] bg-[#6D3DF5] hover:bg-[#5b30d6] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_12px_26px_-12px_rgba(109,61,245,0.7)] disabled:opacity-60 active:scale-[0.99] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          {busy ? "Generating Pass…" : "Generate Pass"}
        </button>
      </form>
    </div>
  );
}

// ─── Live visitor pass preview card ──────────────────────────────────────────
export function VisitorPassCard({ visitorName, visitorPhone, tenantName, expectedTime, propertyName, propertyAddress, passId, passDate, approvedBy, approvedByRole, verifyUrl }) {
  const approverLabel = approvedByRole === "warden" ? "Designated Warden" : "Owner";
  const fmtTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  // Deep navy-indigo — matches the reference (not bright purple)
  const PASS_BG = "linear-gradient(150deg, #272160 0%, #1a1740 100%)";
  const PASS_BORDER = "#e7e3f3";

  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  // Lazy-load html2canvas (same CDN already used by the receipt download flow).
  const ensureHtml2Canvas = () =>
    new Promise((resolve, reject) => {
      if (window.html2canvas) { resolve(window.html2canvas); return; }
      const src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      let s = document.querySelector(`script[src="${src}"]`);
      if (s) {
        s.addEventListener("load", () => resolve(window.html2canvas), { once: true });
        s.addEventListener("error", () => reject(new Error("Failed to load html2canvas.")), { once: true });
        return;
      }
      s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(window.html2canvas);
      s.onerror = () => reject(new Error("Failed to load html2canvas."));
      document.body.appendChild(s);
    });

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = await ensureHtml2Canvas();
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: window.devicePixelRatio > 1 ? 2 : 1.5,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `visitor-pass-${passId || "roomhy"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Visitor pass download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-slate-500 tracking-wide">Your Visitor Pass</p>

      {/* ── Card (overflow visible so ribbon & notches can protrude) ── */}
      <div
        ref={cardRef}
        style={{
          position: "relative",
          borderRadius: "20px",
          border: `1px solid ${PASS_BORDER}`,
          background: "#ffffff",
          boxShadow: "0 18px 46px -18px rgba(30,27,75,0.30), 0 2px 10px -6px rgba(30,27,75,0.10)",
        }}
      >
        {/* ──── Header ──── */}
        <div
          className="flex items-center gap-4"
          style={{ borderRadius: "19px 19px 0 0", background: PASS_BG, padding: "22px 26px" }}
        >
          <Building2 style={{ width: "34px", height: "34px", color: "white", strokeWidth: 1.5, flexShrink: 0 }} />
          <div>
            <p style={{ color: "white", fontWeight: 700, fontSize: "16px", lineHeight: 1.25 }}>
              {propertyName || "Roomhy Property"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12.5px", marginTop: "4px", lineHeight: 1.5 }}>
              {propertyAddress || ""}
            </p>
          </div>
        </div>

        {/* ──── Body ──── */}
        <div
          className="bg-white"
          style={{ position: "relative", zIndex: 1, overflow: "visible", padding: "26px 28px 24px" }}
        >
          {/* Folded ribbon badge — hangs from top-right, slightly past the edge */}
          <div style={{ position: "absolute", top: "-4px", right: "18px", zIndex: 10 }}>
            <svg width="46" height="60" viewBox="0 0 46 60" fill="none" style={{ display: "block" }}>
              <defs>
                <filter id="ribbonShadow" x="-60%" y="-40%" width="220%" height="200%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1e1b4b" floodOpacity="0.20" />
                </filter>
              </defs>
              {/* banner with V-notch bottom */}
              <path
                d="M7 1 h32 a3 3 0 0 1 3 3 v52 l-19 -11 l-19 11 v-52 a3 3 0 0 1 3 -3 Z"
                fill="#f3f0fc" filter="url(#ribbonShadow)"
              />
              {/* purple badge */}
              <circle cx="23" cy="21" r="13" fill="#6D3DF5" />
              <path d="M17 21 l4.2 4.2 l8 -9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Shield watermark — large, soft lavender, vertically centered on the right */}
          <div style={{ position: "absolute", right: "14px", top: "52%", transform: "translateY(-50%)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
            <svg width="146" height="168" viewBox="0 0 100 116" fill="none" style={{ display: "block" }}>
              <path d="M50 6 L88 22 V55 C88 81 71 101 50 110 C29 101 12 81 12 55 V22 Z" fill="#e9e4fa" />
              <path d="M36 56 l10 10 l20 -23" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* VISITOR PASS title */}
          <div className="text-center" style={{ marginBottom: "24px", position: "relative", zIndex: 2 }}>
            <div className="flex items-center" style={{ gap: "12px", marginBottom: "7px" }}>
              <div style={{ flex: 1, height: "1.5px", background: "rgba(109,61,245,0.22)" }} />
              <p style={{ fontSize: "23px", fontWeight: 800, color: "#6D3DF5", letterSpacing: "0.22em", whiteSpace: "nowrap" }}>
                VISITOR PASS
              </p>
              <div style={{ flex: 1, height: "1.5px", background: "rgba(109,61,245,0.22)" }} />
            </div>
            {/* three stars */}
            <div className="flex justify-center" style={{ gap: "7px" }}>
              {[0, 1, 2].map((i) => (
                <svg key={i} width="9" height="9" viewBox="0 0 10 10" fill="#6D3DF5" style={{ opacity: 0.55 }}>
                  <path d="M5 0 L6.2 3.5 L10 3.8 L7 6.1 L8.1 10 L5 7.6 L1.9 10 L3 6.1 L0 3.8 L3.8 3.5 Z" />
                </svg>
              ))}
            </div>
            {/* Approved-by-owner badge */}
            <div className="flex justify-center" style={{ marginTop: "12px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                fontSize: "11px", fontWeight: 700,
                padding: "4px 12px", borderRadius: "999px",
                background: "#ecfdf5", color: "#059669", border: "1px solid #c7f0dd",
              }}>
                <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                Approved by {approverLabel}{approvedBy ? ` • ${approvedBy}` : ""}
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", position: "relative", zIndex: 2 }}>
            {[
              { Icon: User,  label: "Visitor Name",       value: visitorName || "—",    badge: null },
              { Icon: Phone, label: "Phone Number",        value: visitorPhone || "—",   badge: null },
              { Icon: User,  label: "Tenant Name",         value: tenantName || "—",     badge: "Resident" },
              { Icon: Clock, label: "Expected Entry Time", value: fmtTime(expectedTime), badge: null },
            ].map(({ Icon, label, value, badge }) => (
              <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <Icon style={{ width: "16px", height: "16px", color: "#a39ccb", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 500, color: "#9aa0b4", marginBottom: "2px" }}>{label}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <p style={{ fontSize: "14.5px", fontWeight: 700, color: "#1e293b" }}>{value}</p>
                    {badge && (
                      <span style={{
                        fontSize: "9.5px", fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        padding: "1.5px 7px", borderRadius: "999px",
                        background: "#eee9fb", color: "#6D3DF5",
                      }}>
                        {badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Dashed perforation line at the body↔footer seam ── */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 0, zIndex: 6 }}>
            <div style={{
              position: "absolute", left: "24px", right: "24px", top: "-0.75px",
              borderTop: "1.5px dashed rgba(109,61,245,0.25)",
            }} />
          </div>
        </div>

        {/* ──── Footer ──── */}
        <div
          style={{ borderRadius: "0 0 19px 19px", background: PASS_BG, padding: "22px 26px 20px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            {/* QR tile — scannable; encodes the public verification URL */}
            <div style={{ flexShrink: 0, background: "#fff", borderRadius: "10px", padding: "6px", lineHeight: 0 }}>
              {verifyUrl
                ? <QRCodeSVG value={verifyUrl} size={66} level="M" bgColor="#ffffff" fgColor="#1e1b4b" />
                : <QrCodeArt size={66} />}
            </div>
            {/* Pass metadata */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Pass ID
                </p>
                <p style={{ color: "white", fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em", fontFamily: "monospace", marginTop: "3px" }}>
                  {passId}
                </p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Date
                </p>
                <p style={{ color: "white", fontWeight: 600, fontSize: "13px", marginTop: "3px" }}>
                  {passDate}
                </p>
              </div>
            </div>
          </div>

          {/* Footer banner */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "18px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.18)" }} />
            <span style={{
              color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap",
            }}>
              → Valid for One Time Entry Only ←
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.18)" }} />
          </div>
        </div>
      </div>

      {/* Download Pass button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-semibold text-[14px] transition-colors hover:bg-[#6D3DF5]/5 disabled:opacity-60"
        style={{ border: "1.5px solid #6D3DF5", color: "#6D3DF5" }}
      >
        <Download style={{ width: "16px", height: "16px" }} />
        {downloading ? "Preparing…" : "Download Pass"}
      </button>
    </div>
  );
}

// ─── Visitor important note card ──────────────────────────────────────────────
export function VisitorNoteCard() {
  return (
    <div className={`rounded-[22px] ${HAIRLINE} bg-white p-6 ${SOFT}`}>
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#6D3DF5]" />
        </span>
        <div>
          <h4 className="text-[15px] font-bold text-slate-900">Important Note</h4>
          <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
            Please ensure all details are correct.
          </p>
          <p className="text-[13px] text-slate-400 mt-0.5 leading-relaxed">
            You will be responsible for your guest's entry.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Visitor pass status placeholder (pending / rejected / empty) ─────────────
// Shown in place of the pass card while a request is not yet approved. No QR or
// full pass details are exposed until the owner approves.
export function VisitorPassStatusCard({ status, visitorName, requestedOn }) {
  const map = {
    Pending: {
      Icon: Hourglass, tint: "#6D3DF5", bg: "#f1ecfd",
      title: "Awaiting Owner Approval",
      lines: [
        "Your visitor pass request has been sent to the owner.",
        "The pass and its QR code will appear here once it's approved.",
      ],
    },
    Rejected: {
      Icon: XCircle, tint: "#e11d48", bg: "#fdecef",
      title: "Request Not Approved",
      lines: [
        "The owner did not approve this visitor pass request.",
        "You can submit a new request with the correct details.",
      ],
    },
    empty: {
      Icon: UserPlus, tint: "#6D3DF5", bg: "#f1ecfd",
      title: "No Visitor Pass Yet",
      lines: [
        "Fill in the visitor details and generate a pass request.",
        "Once the owner approves it, your pass appears here.",
      ],
    },
  };
  const s = map[status] || map.empty;
  const { Icon } = s;
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-slate-500 tracking-wide">Your Visitor Pass</p>
      <div className={`rounded-[20px] ${HAIRLINE} bg-white ${SOFT}`} style={{ padding: "40px 28px" }}>
        <div className="flex flex-col items-center text-center">
          <span
            className="flex items-center justify-center"
            style={{ width: "64px", height: "64px", borderRadius: "20px", background: s.bg }}
          >
            <Icon style={{ width: "30px", height: "30px", color: s.tint }} />
          </span>
          <h3 className="text-[17px] font-bold text-slate-900" style={{ marginTop: "18px" }}>{s.title}</h3>
          {status && (
            <span
              className="inline-flex items-center"
              style={{
                marginTop: "10px", fontSize: "11px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "3px 12px", borderRadius: "999px",
                background: s.bg, color: s.tint,
              }}
            >
              {status}
            </span>
          )}
          <div style={{ marginTop: "14px", maxWidth: "320px" }}>
            {s.lines.map((l, i) => (
              <p key={i} className="text-[13px] text-slate-400 leading-relaxed">{l}</p>
            ))}
          </div>
          {visitorName && (
            <div
              className="w-full"
              style={{ marginTop: "22px", paddingTop: "18px", borderTop: "1px solid #eef0f4" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-400">Visitor</span>
                <span className="text-[13px] font-semibold text-slate-700">{visitorName}</span>
              </div>
              {requestedOn && (
                <div className="flex items-center justify-between" style={{ marginTop: "8px" }}>
                  <span className="text-[12px] text-slate-400">Requested on</span>
                  <span className="text-[13px] font-semibold text-slate-700">{requestedOn}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leave: calendar + suitcase illustration ─────────────────────────────────
function CalendarTravelArt() {
  return (
    <svg width="138" height="104" viewBox="0 0 200 150" fill="none" className="block" style={{ opacity: 0.85 }}>
      <defs>
        <linearGradient id="lvCal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f3eefe" />
        </linearGradient>
        <linearGradient id="lvCase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b66f7" /><stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <filter id="lvShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#6133e0" floodOpacity="0.14" />
        </filter>
      </defs>
      {/* lavender backdrop */}
      <circle cx="100" cy="78" r="60" fill="#efeafe" />
      {/* foliage */}
      <g opacity="0.6">
        <path d="M40 96 C 32 86 32 72 41 64 C 47 74 47 88 40 96 Z" fill="#b69bff" />
        <path d="M162 60 C 170 52 182 52 188 60 C 180 66 168 66 162 60 Z" fill="#c4b3f7" />
      </g>
      {/* calendar */}
      <g filter="url(#lvShadow)">
        <rect x="44" y="42" width="84" height="72" rx="13" fill="url(#lvCal)" stroke="#e7ddfb" strokeWidth="1" />
        <rect x="44" y="42" width="84" height="20" rx="13" fill="#6D3DF5" />
        <rect x="44" y="54" width="84" height="8" fill="#6D3DF5" />
      </g>
      {/* rings */}
      <rect x="60" y="34" width="6" height="16" rx="3" fill="#b59cf7" />
      <rect x="106" y="34" width="6" height="16" rx="3" fill="#b59cf7" />
      {/* date grid */}
      <g fill="#d8cbf6">
        {[0, 1, 2, 3].map((c) => <circle key={`a${c}`} cx={58 + c * 16} cy={76} r="3" />)}
        {[0, 1, 2, 3].map((c) => <circle key={`b${c}`} cx={58 + c * 16} cy={92} r="3" />)}
        {[0, 1, 2, 3].map((c) => <circle key={`c${c}`} cx={58 + c * 16} cy={108} r="3" />)}
      </g>
      {/* circled active date */}
      <circle cx="90" cy="92" r="9" fill="none" stroke="#f4385a" strokeWidth="2.4" />
      {/* suitcase */}
      <g filter="url(#lvShadow)">
        <rect x="116" y="78" width="50" height="40" rx="9" fill="url(#lvCase)" />
        <rect x="116" y="78" width="50" height="40" rx="9" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />
        <line x1="141" y1="80" x2="141" y2="116" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
        <rect x="131" y="68" width="20" height="13" rx="5" fill="none" stroke="#8b66f7" strokeWidth="4" />
      </g>
    </svg>
  );
}

// ─── Leave: hero (title + illustration) ──────────────────────────────────────
export function LeaveHero() {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 rounded-2xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <CalendarOff className="w-[22px] h-[22px] text-[#6D3DF5]" />
        </span>
        <div>
          <h2 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-slate-900">Leave Requests</h2>
          <p className="text-slate-400 mt-1 text-[14px]">Submit your long-term absence or holiday leave dates.</p>
        </div>
      </div>
      <div className="hidden sm:flex flex-shrink-0 items-center self-center">
        <CalendarTravelArt />
      </div>
    </div>
  );
}

// ─── Leave: application form (presentational; logic stays in parent) ─────────
export function LeaveForm({ startDate, setStartDate, endDate, setEndDate, reason, setReason, msg, submitting, onSubmit, minDate }) {
  const fieldCls =
    "mt-2.5 w-full h-[54px] px-4 rounded-[16px] border border-[#eceef3] text-[14px] text-slate-700 [color-scheme:light] accent-[#6D3DF5] hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-[#6D3DF5]/12 focus:border-[#6D3DF5]/50 transition";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500";
  return (
    <div className="rounded-[24px] border border-[#edeef2] bg-white p-8 sm:p-9 shadow-[0_10px_44px_-22px_rgba(15,23,42,0.20)]">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-9 h-9 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-[#6D3DF5]" />
        </span>
        <h3 className="text-[16.5px] font-semibold text-slate-900">New Leave Application</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-7">
        <div>
          <label className={labelCls}>Start Date</label>
          <input type="date" required min={minDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Return Date</label>
          <input type="date" required min={startDate || minDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Reason</label>
          <textarea
            required rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Going home for holidays"
            className="mt-2.5 w-full p-4 rounded-[16px] border border-[#eceef3] text-[14px] text-slate-700 placeholder:text-slate-400 leading-relaxed resize-none hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-[#6D3DF5]/12 focus:border-[#6D3DF5]/50 transition"
          />
        </div>

        {msg && (
          <div className="p-3.5 rounded-[14px] bg-slate-50 border border-[#eceef3] text-[13px] text-slate-600">{msg}</div>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full h-[54px] rounded-[16px] text-white font-semibold text-[14px] flex items-center justify-center gap-2.5 disabled:opacity-60 active:scale-[0.99] transition-all"
          style={{
            background: "linear-gradient(135deg, #7c4dff 0%, #6029e0 100%)",
            boxShadow: "0 14px 34px -14px rgba(96,41,224,0.62)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 18px 40px -12px rgba(96,41,224,0.7)"; e.currentTarget.style.filter = "brightness(1.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 14px 34px -14px rgba(96,41,224,0.62)"; e.currentTarget.style.filter = "none"; }}
        >
          <Send className="w-[17px] h-[17px]" /> {submitting ? "Submitting…" : "Submit Leave"}
        </button>
      </form>
    </div>
  );
}

// ─── Leave: empty-history illustration (compact) ─────────────────────────────
function EmptyLeaveDocArt() {
  return (
    <svg width="74" height="74" viewBox="0 0 120 120" fill="none" className="block">
      <defs>
        <linearGradient id="lvDoc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f3eefe" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill="#f3eefe" />
      <rect x="38" y="30" width="48" height="60" rx="11" fill="#e2d8fb" transform="rotate(7 62 60)" />
      <g filter="">
        <rect x="34" y="32" width="46" height="58" rx="11" fill="url(#lvDoc)" stroke="#e7ddfb" strokeWidth="1" />
        <g stroke="#d8cbf6" strokeWidth="3.4" strokeLinecap="round">
          <line x1="44" y1="48" x2="70" y2="48" />
          <line x1="44" y1="60" x2="66" y2="60" />
          <line x1="44" y1="72" x2="58" y2="72" />
        </g>
      </g>
    </svg>
  );
}

// ─── Leave: history card (empty state + list) ────────────────────────────────
export function LeaveHistory({ leaves }) {
  const fmt = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
  const list = leaves || [];
  return (
    <div className="rounded-[24px] border border-[#edeef2] bg-white p-8 sm:p-9 shadow-[0_10px_44px_-22px_rgba(15,23,42,0.20)] flex flex-col min-h-[440px]">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-9 h-9 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <History className="w-4 h-4 text-[#6D3DF5]" />
        </span>
        <h3 className="text-[16.5px] font-semibold text-slate-900">My Leaves History</h3>
      </div>

      {list.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4" style={{ transform: "translateY(-8px)" }}>
          <EmptyLeaveDocArt />
          <h4 className="text-[15.5px] font-semibold text-slate-800 mt-7">No leave requests yet</h4>
          <p className="text-[13px] text-slate-400 mt-3 leading-relaxed max-w-[250px]">
            Your approved and pending leave requests will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3">
          {list.map((l) => (
            <div key={l._id} className="p-4 rounded-[16px] border border-[#eef0f4] bg-[#fafafb]">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[13.5px] font-semibold text-slate-700">{fmt(l.fromDate || l.startDate)} – {fmt(l.toDate || l.endDate)}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  l.status === "Approved" ? "bg-emerald-50 text-emerald-600"
                  : l.status === "Rejected" ? "bg-rose-50 text-rose-600"
                  : "bg-amber-50 text-amber-600"
                }`}>
                  {l.status || "Pending"}
                </span>
              </div>
              {l.reason && <p className="text-[12.5px] text-slate-400 mt-2 leading-relaxed">{l.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leave: subtle stopwatch illustration ────────────────────────────────────
function StopwatchArt() {
  return (
    <svg width="96" height="83" viewBox="0 0 150 130" fill="none" className="block">
      <circle cx="78" cy="74" r="42" fill="#f1ecfd" />
      <circle cx="78" cy="74" r="30" fill="none" stroke="#ddd2f7" strokeWidth="5" />
      <line x1="78" y1="74" x2="78" y2="56" stroke="#c4b3f7" strokeWidth="4" strokeLinecap="round" />
      <line x1="78" y1="74" x2="91" y2="80" stroke="#c4b3f7" strokeWidth="4" strokeLinecap="round" />
      <rect x="70" y="34" width="16" height="7" rx="3" fill="#d9ccf8" />
      <rect x="74" y="28" width="8" height="9" rx="2" fill="#c4b3f7" />
      <circle cx="78" cy="74" r="3" fill="#b59cf7" />
    </svg>
  );
}

// ─── Leave: important note card ──────────────────────────────────────────────
export function LeaveNoteCard() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#edeef2] bg-white px-9 py-8 sm:px-10 shadow-[0_10px_44px_-22px_rgba(15,23,42,0.20)]">
      <div className="pointer-events-none absolute right-6 bottom-1 opacity-40 hidden sm:block">
        <StopwatchArt />
      </div>
      <div className="relative flex items-start gap-5">
        <span className="w-11 h-11 rounded-xl bg-[#6D3DF5]/8 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-[18px] h-[18px] text-[#6D3DF5]/60" />
        </span>
        <div>
          <h4 className="text-[15px] font-semibold text-slate-900">Important Note</h4>
          <p className="text-[13px] text-slate-400 mt-2 leading-[1.7]">Please ensure all details are correct.</p>
          <p className="text-[13px] text-slate-400 leading-[1.7]">You will be responsible for your leave duration.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Complaints: city + maintenance illustration ─────────────────────────────
function ComplaintCityArt() {
  return (
    <svg width="280" height="150" viewBox="0 0 300 160" fill="none" className="block" style={{ opacity: 0.92 }}>
      <defs>
        <linearGradient id="cpB1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdbcf6" /><stop offset="100%" stopColor="#b39cf2" />
        </linearGradient>
        <linearGradient id="cpB2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b66f7" /><stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <linearGradient id="cpCase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b66f7" /><stop offset="100%" stopColor="#6133e0" />
        </linearGradient>
        <filter id="cpShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#6133e0" floodOpacity="0.13" />
        </filter>
      </defs>
      {/* backdrop */}
      <ellipse cx="170" cy="92" r="0" rx="120" ry="62" fill="#efeafe" />
      {/* sparkles */}
      <circle cx="92" cy="40" r="2.4" fill="#c4b3f7" />
      <circle cx="250" cy="36" r="2.8" fill="#c4b3f7" />
      <circle cx="276" cy="74" r="2" fill="#d7ccfa" />
      <circle cx="120" cy="30" r="1.6" fill="#d7ccfa" />
      {/* buildings */}
      <g filter="url(#cpShadow)">
        <rect x="120" y="58" width="44" height="86" rx="8" fill="url(#cpB1)" />
        <rect x="168" y="40" width="50" height="104" rx="8" fill="url(#cpB2)" />
        <rect x="222" y="70" width="40" height="74" rx="8" fill="url(#cpB1)" />
      </g>
      {/* windows */}
      <g fill="#ffffff" opacity="0.55">
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`w1${r}${c}`} x={130 + c * 16} y={70 + r * 18} width="9" height="9" rx="2" />))}
        {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`w2${r}${c}`} x={178 + c * 18} y={54 + r * 20} width="10" height="10" rx="2" />))}
        {[0, 1, 2].map((r) => [0, 1].map((c) => <rect key={`w3${r}${c}`} x={231 + c * 15} y={82 + r * 17} width="8" height="8" rx="2" />))}
      </g>
      {/* briefcase */}
      <g filter="url(#cpShadow)">
        <rect x="78" y="104" width="48" height="36" rx="8" fill="url(#cpCase)" />
        <rect x="94" y="96" width="16" height="11" rx="4" fill="none" stroke="#8b66f7" strokeWidth="4" />
        <line x1="102" y1="106" x2="102" y2="140" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      </g>
      {/* wrench */}
      <g transform="rotate(40 250 118)" filter="url(#cpShadow)">
        <rect x="244" y="98" width="11" height="40" rx="5.5" fill="#b69bff" />
        <path d="M249.5 92 a10 10 0 1 0 0.2 0 l-2 7 l4 4 l-2.2 2.2 l-4 -4 Z" fill="#9b78ff" />
      </g>
      {/* plant */}
      <g transform="translate(282 110)">
        <path d="M0 22 C -5 12 -5 2 1 -4 C 5 4 5 15 0 22 Z" fill="#9b78ff" opacity="0.55" />
        <rect x="-6" y="21" width="12" height="11" rx="2.5" fill="#7c4dff" opacity="0.7" />
      </g>
    </svg>
  );
}

// ─── Complaints: hero banner ─────────────────────────────────────────────────
export function ComplaintHero() {
  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-[#edeef2]"
      style={{ background: "linear-gradient(135deg, #f7f5fd 0%, #f2f0fb 100%)" }}
    >
      <div className="pointer-events-none absolute right-2 bottom-0 hidden sm:block">
        <ComplaintCityArt />
      </div>
      <div className="relative flex items-start gap-4 px-8 py-8 sm:px-9">
        <span className="w-12 h-12 rounded-2xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <Flag className="w-[22px] h-[22px] text-[#6D3DF5]" />
        </span>
        <div>
          <h2 className="text-[24px] sm:text-[27px] font-bold tracking-tight text-slate-900">Complaints &amp; Requests</h2>
          <p className="text-slate-400 mt-1.5 text-[14px] leading-relaxed max-w-[320px]">
            Report issues or maintenance requests and track their progress.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Complaints: card section heading (icon + title + underline accent) ──────
function CardHeading({ icon: Icon, title }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-1.5">
        <span className="w-9 h-9 rounded-xl bg-[#6D3DF5]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#6D3DF5]" />
        </span>
        <h3 className="text-[16.5px] font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="h-[3px] w-7 rounded-full bg-[#6D3DF5] ml-12 mb-7" />
    </>
  );
}

// ─── Complaints: new request form (presentational) ───────────────────────────
export function ComplaintForm({ category, setCategory, priority, setPriority, desc, setDesc, msg, busy, onSubmit }) {
  const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2.5";
  const selectCls = "w-full h-[54px] pl-11 pr-10 rounded-[16px] border border-[#eceef3] text-[14px] text-slate-700 bg-white appearance-none hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-[#6D3DF5]/12 focus:border-[#6D3DF5]/50 transition";
  return (
    <div className="rounded-[24px] border border-[#edeef2] bg-white p-8 sm:p-9 shadow-[0_10px_44px_-22px_rgba(15,23,42,0.20)]">
      <CardHeading icon={FileText} title="New Request" />

      <form onSubmit={onSubmit} className="space-y-7">
        <div>
          <label className={labelCls}>Issue Category</label>
          <div className="relative">
            <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Furniture">Furniture</option>
              <option value="Appliances">Appliances</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Internet">Internet</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Priority</label>
          <div className="relative">
            <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectCls}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            required rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="w-full p-4 rounded-[16px] border border-[#eceef3] text-[14px] text-slate-700 placeholder:text-slate-400 leading-relaxed resize-none hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-[#6D3DF5]/12 focus:border-[#6D3DF5]/50 transition"
          />
        </div>

        {msg && (
          <div className={`p-3.5 rounded-[14px] text-[13px] border ${msg.includes("success") ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-[#eceef3] text-slate-600"}`}>{msg}</div>
        )}

        <button
          type="submit" disabled={busy}
          className="w-full h-[54px] rounded-[16px] text-white font-semibold text-[14px] flex items-center justify-center gap-2.5 disabled:opacity-60 active:scale-[0.99] transition-all"
          style={{
            background: "linear-gradient(135deg, #7c4dff 0%, #6029e0 100%)",
            boxShadow: "0 14px 34px -14px rgba(96,41,224,0.62)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 18px 40px -12px rgba(96,41,224,0.7)"; e.currentTarget.style.filter = "brightness(1.05)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 14px 34px -14px rgba(96,41,224,0.62)"; e.currentTarget.style.filter = "none"; }}
        >
          <Send className="w-[17px] h-[17px]" /> {busy ? "Submitting…" : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}

// ─── Complaints: empty-history illustration ──────────────────────────────────
function ComplaintInboxArt() {
  return (
    <svg width="78" height="78" viewBox="0 0 120 120" fill="none" className="block">
      <circle cx="60" cy="60" r="50" fill="#f3eefe" />
      <g>
        <path d="M34 56 h52 v22 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 Z" fill="#e2d8fb" />
        <path d="M40 44 h40 a4 4 0 0 1 4 4 v10 h-18 l-4 7 h-8 l-4 -7 h-18 v-10 a4 4 0 0 1 4 -4 Z" fill="#cdbcf6" />
        <rect x="34" y="56" width="52" height="3" fill="#b59cf7" opacity="0.5" />
      </g>
    </svg>
  );
}

// ─── Complaints: requests history card ───────────────────────────────────────
export function ComplaintHistory({ complaints }) {
  const list = complaints || [];
  const fmt = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
  return (
    <div className="rounded-[24px] border border-[#edeef2] bg-white p-8 sm:p-9 shadow-[0_10px_44px_-22px_rgba(15,23,42,0.20)] flex flex-col min-h-[440px]">
      <CardHeading icon={History} title="My Requests History" />

      {list.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4" style={{ transform: "translateY(-8px)" }}>
          <ComplaintInboxArt />
          <h4 className="text-[15.5px] font-semibold text-slate-800 mt-7">No complaints raised yet</h4>
          <p className="text-[13px] text-slate-400 mt-3 leading-relaxed max-w-[250px]">
            Your submitted complaints and requests will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3">
          {list.map((c) => (
            <div key={c._id} className="p-4 rounded-[16px] border border-[#eef0f4] bg-[#fafafb]">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[13.5px] font-semibold text-slate-700">{c.category || "Complaint"}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  c.status === "Resolved" ? "bg-emerald-50 text-emerald-600"
                  : c.status === "In Progress" ? "bg-blue-50 text-blue-600"
                  : "bg-amber-50 text-amber-600"
                }`}>
                  {c.status || "Open"}
                </span>
              </div>
              {c.description && <p className="text-[12.5px] text-slate-400 mt-2 leading-relaxed line-clamp-2">{c.description}</p>}
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2.5">
                <span>Priority: {c.priority || "Low"}</span>
                <span>{fmt(c.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export icons used by the parent for Quick Actions config
export const QuickActionIcons = {
  CreditCard, Flag, Wrench, UserPlus, CalendarOff,
};
