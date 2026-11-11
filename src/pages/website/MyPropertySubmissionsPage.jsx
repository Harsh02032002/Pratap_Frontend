import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Check, ChevronLeft, ChevronRight, ClipboardList, Globe2, Loader2, LockKeyhole, MapPin, Plus, RefreshCw, UserCheck } from "lucide-react";
import WebsiteNavbar from "../../components/website/WebsiteNavbar";
import WebsiteFooter from "../../components/website/WebsiteFooter";
import MobileBottomNav from "../../components/website/MobileBottomNav";
import { useAuth } from "../../contexts/AuthContext";
import { getMyPropertySubmissions, getSubmissionToken } from "../../api/propertySubmissions";
import { queryKeys } from "../../lib/queryKeys";
import { getSubmissionPresentation, PROPERTY_SUBMISSIONS_PATH } from "../../utils/propertySubmissions";
import { useLiveStatusSync } from "../../utils/liveStatusSync";

const steps = [
  { label: "Submitted", icon: ClipboardList },
  { label: "Team assigned", icon: UserCheck },
  { label: "Published", icon: Globe2 },
];
const signInPath = `/login?redirect=${encodeURIComponent(PROPERTY_SUBMISSIONS_PATH)}`;

function SubmissionCard({ submission }) {
  const state = getSubmissionPresentation(submission);
  const submitted = new Date(submission.submittedAt);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700"><Building2 size={23} aria-hidden="true" /></div>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-slate-900">{submission.propertyName}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} aria-hidden="true" />{[submission.locality, submission.city].filter(Boolean).join(", ")}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${state.color}`}>{state.label}</span>
      </div>

      <ol aria-label="Listing progress" className="my-7 grid grid-cols-3">
        {steps.map(({ label, icon: Icon }, index) => {
          const complete = index < state.step;
          const active = index === state.step;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="relative text-center">
              {index < steps.length - 1 && <div aria-hidden="true" className={`absolute left-1/2 right-[-50%] top-4 h-0.5 ${complete ? "bg-teal-500" : "bg-slate-100"}`} />}
              <span className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full border-4 border-white ${complete ? "bg-teal-600 text-white" : active ? "bg-teal-50 text-teal-700 ring-1 ring-teal-500" : "bg-slate-100 text-slate-400"}`}>
                {complete ? <Check size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
              </span>
              <span className={`mt-2 block text-[11px] font-semibold sm:text-xs ${index <= state.step ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">{state.description}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <div className="min-w-0 text-xs text-slate-500">
          <p className="break-all">Reference <span className="font-medium text-slate-700">{submission.reference}</span></p>
          {!Number.isNaN(submitted.getTime()) && <p className="mt-1">Submitted {submitted.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</p>}
        </div>
        {state.listingUrl && <Link to={state.listingUrl} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">View live property <ArrowRight size={16} aria-hidden="true" /></Link>}
      </div>
    </article>
  );
}

export default function MyPropertySubmissionsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const enabled = !authLoading && isAuthenticated && Boolean(getSubmissionToken());
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: queryKeys.propertySubmissions.mine(user?._id || user?.id || user?.loginId || "", page),
    queryFn: ({ signal }) => getMyPropertySubmissions(page, signal),
    enabled,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) => {
      const list = query.state.data?.submissions || [];
      const hasPending = list.some((s) => s.stage !== "live" && s.stage !== "rejected");
      return hasPending ? 8000 : 30000;
    },
    refetchIntervalInBackground: false,
    gcTime: 0,
  });

  useLiveStatusSync(
    () => {
      if (enabled) refetch();
    },
    { enabled, pollMs: 0, types: ["visit", "enquiry", "owner"] }
  );
  const needsSignIn = !enabled || error?.status === 401;

  useEffect(() => {
    document.title = "My Property Submissions | Roomhy";
    const existing = document.querySelector('meta[name="robots"]');
    const tag = existing || document.createElement("meta");
    const previous = tag.content;
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    if (!existing) document.head.appendChild(tag);
    return () => { if (existing) tag.content = previous; else tag.remove(); };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAF9]">
      <WebsiteNavbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-9 sm:px-6 sm:pt-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700">Your property journey</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">My property submissions</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">From your first submission to a live listing, follow every step with Roomhy.</p>
          </div>
          <Link to="/list-property" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"><Plus size={17} aria-hidden="true" /> List a property</Link>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-1.5"><LockKeyhole size={14} aria-hidden="true" />Only visible to your signed-in account</p>
          {enabled && <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} aria-hidden="true" />{isFetching ? "Updating…" : "Refresh status"}</button>}
        </div>

        {authLoading || (enabled && isPending) ? (
          <div role="status" className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500"><Loader2 className="animate-spin text-teal-600" size={22} aria-hidden="true" />Loading your submissions…</div>
        ) : needsSignIn ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-14">
            <LockKeyhole className="mx-auto mb-4 text-teal-600" size={34} aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Sign in to track your properties</h2>
            <p className="mx-auto mb-6 mt-2 max-w-sm text-sm leading-6 text-slate-500">Use the website account you submitted with to see your listing progress.</p>
            <Link to={signInPath} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">Sign in <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
            <h2 className="font-bold text-slate-900">We couldn’t update your submissions</h2>
            <p className="my-3 text-sm text-slate-500">{error.message}</p>
            <button type="button" onClick={() => refetch()} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Try again</button>
          </div>
        ) : data?.submissions?.length ? (
          <>
            <div className="space-y-5">{data.submissions.map(submission => <SubmissionCard key={submission.id} submission={submission} />)}</div>
            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
              <p>{data.total} {data.total === 1 ? "submission" : "submissions"}</p>
              {data.totalPages > 1 && <nav aria-label="Submission pages" className="flex items-center gap-3">
                <button aria-label="Previous page" disabled={page <= 1 || isFetching} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <span>Page {page} of {data.totalPages}</span>
                <button aria-label="Next page" disabled={page >= data.totalPages || isFetching} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
              </nav>}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-14">
            <Building2 className="mx-auto mb-4 text-teal-600" size={36} aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Your next listing starts here</h2>
            <p className="mx-auto mb-6 mt-2 max-w-sm text-sm leading-6 text-slate-500">Submit your property details and we’ll keep you updated as our team helps bring it live.</p>
            <Link to="/list-property" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700">List your property <ArrowRight size={16} aria-hidden="true" /></Link>
            {page > 1 && <button onClick={() => setPage(1)} className="mx-auto mt-4 block text-sm font-semibold text-teal-700">Back to the first page</button>}
          </div>
        )}
        <p className="mt-7 text-center text-xs leading-5 text-slate-500">Can’t find an earlier submission? <Link to="/contact-us" className="font-semibold text-teal-700 underline underline-offset-2">Contact Roomhy</Link> with your submission reference.</p>
      </main>
      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
