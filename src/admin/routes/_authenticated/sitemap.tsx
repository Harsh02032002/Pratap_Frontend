import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Network, RefreshCw, Download, Check, Globe, FileText, Clock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/sitemap")({
  head: () => ({
    meta: [
      { title: "Sitemap — Roomhy Admin" },
      { name: "description", content: "Generate and manage the sitemap.xml." },
    ],
  }),
  component: SitemapPage,
});

const SITEMAP_SECTIONS = [
  { label: "Homepage", count: 1, status: "Indexed", lastCrawled: "2025-07-20" },
  { label: "City Pages", count: 20, status: "Indexed", lastCrawled: "2025-07-18" },
  { label: "Area Pages", count: 85, status: "Indexed", lastCrawled: "2025-07-15" },
  { label: "Property Listings", count: 60, status: "Indexed", lastCrawled: "2025-07-10" },
  { label: "Blog Articles", count: 12, status: "Partial", lastCrawled: "2025-07-05" },
  { label: "SEO Pages", count: 7, status: "Indexed", lastCrawled: "2025-07-01" },
  { label: "Category Pages", count: 20, status: "Partial", lastCrawled: "2025-06-28" },
];

function SitemapPage() {
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState("2025-07-20 14:32");
  const [toast, setToast] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const now = new Date();
      setLastGenerated(`${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`);
      showToast("Sitemap regenerated successfully");
    }, 2000);
  };

  const handlePing = () => {
    setPinging(true);
    setTimeout(() => {
      setPinging(false);
      showToast("Sitemap pinged to Google & Bing ✓");
    }, 1500);
  };

  const totalUrls = SITEMAP_SECTIONS.reduce((a, s) => a + s.count, 0);
  const indexedUrls = SITEMAP_SECTIONS.filter((s) => s.status === "Indexed").reduce((a, s) => a + s.count, 0);

  const statusColor: Record<string, string> = {
    Indexed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Partial: "bg-amber-50 text-amber-700 ring-amber-200",
    "Not Indexed": "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg text-emerald-800 text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Sitemap"
        subtitle="Generate and manage sitemap.xml for search engines"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "SEO Management" }, { label: "Sitemap" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Download XML</Button>
            <Button variant="outline" size="sm" onClick={handlePing} disabled={pinging}>
              <Globe className="mr-2 h-4 w-4" /> {pinging ? "Pinging…" : "Ping Search Engines"}
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating…" : "Regenerate Sitemap"}
            </Button>
          </>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total URLs", value: totalUrls, color: "text-primary", icon: <FileText className="h-5 w-5 text-primary" /> },
          { label: "Indexed", value: indexedUrls, color: "text-emerald-600", icon: <Check className="h-5 w-5 text-emerald-500" /> },
          { label: "Sections", value: SITEMAP_SECTIONS.length, color: "text-blue-600", icon: <Network className="h-5 w-5 text-blue-500" /> },
          { label: "Last Generated", value: lastGenerated, color: "text-slate-600", icon: <Clock className="h-5 w-5 text-slate-500" /> },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">{k.icon}</span>
            <div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`mt-0.5 text-lg font-bold ${k.color}`}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage Bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">Indexing Coverage</span>
          <span className="text-muted-foreground">{indexedUrls} / {totalUrls} URLs indexed</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700"
            style={{ width: `${(indexedUrls / totalUrls) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{Math.round((indexedUrls / totalUrls) * 100)}% coverage</div>
      </div>

      {/* Section Breakdown */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sitemap Sections
        </div>
        <div className="divide-y divide-border">
          {SITEMAP_SECTIONS.map((s) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">Last crawled: {s.lastCrawled}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{s.count} URLs</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusColor[s.status]}`}>
                  {s.status === "Partial" && <AlertCircle className="mr-1 h-3 w-3" />}
                  {s.status === "Indexed" && <Check className="mr-1 h-3 w-3" />}
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sitemap URL Preview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 text-sm font-semibold">Sitemap URLs</div>
        <div className="space-y-1 rounded-lg bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          <div className="text-primary">https://roomhy.com/sitemap.xml</div>
          <div>https://roomhy.com/sitemap-cities.xml</div>
          <div>https://roomhy.com/sitemap-properties.xml</div>
          <div>https://roomhy.com/sitemap-blogs.xml</div>
          <div>https://roomhy.com/sitemap-areas.xml</div>
        </div>
      </div>
    </div>
  );
}