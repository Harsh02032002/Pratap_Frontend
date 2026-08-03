export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
    Draft: "bg-slate-50 text-slate-700 ring-slate-200",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    Expired: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return (
    <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset " + (tone[status] ?? tone.Draft)}>
      {status}
    </span>
  );
}