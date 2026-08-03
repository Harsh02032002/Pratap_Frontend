import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sliders, Check, Database, Shield, Server, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/system")({
  head: () => ({
    meta: [
      { title: "System Settings — Roomhy Admin" },
      { name: "description", content: "Advanced system-level configuration." },
    ],
  }),
  component: SystemSettingsPage,
});

function SystemSettingsPage() {
  const [config, setConfig] = useState({
    cacheEnabled: true,
    cacheTtl: "3600",
    debugMode: false,
    rateLimitEnabled: true,
    rateLimitPerMinute: "60",
    autoBackup: true,
    backupFrequency: "daily",
    imageCompression: true,
    lazyLoading: true,
    analyticsEnabled: true,
  });
  const [toast, setToast] = useState<{ msg: string; type?: "warn" | "ok" } | null>(null);

  const showToast = (msg: string, type: "warn" | "ok" = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const toggle = (key: keyof typeof config) => setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  const systemHealth = [
    { label: "Database", status: "Healthy", color: "text-emerald-600", bg: "bg-emerald-100", icon: <Database className="h-4 w-4" /> },
    { label: "Cache (Redis)", status: "Connected", color: "text-emerald-600", bg: "bg-emerald-100", icon: <Zap className="h-4 w-4" /> },
    { label: "File Storage", status: "97% free", color: "text-blue-600", bg: "bg-blue-100", icon: <Server className="h-4 w-4" /> },
    { label: "SSL Certificate", status: "Valid · 285d", color: "text-emerald-600", bg: "bg-emerald-100", icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-lg text-sm font-medium ${toast.type === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {toast.type === "warn" ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="System Settings"
        subtitle="Advanced system-level configuration"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "System" }]}
        actions={<Button size="sm" onClick={() => showToast("System settings saved")}><Check className="mr-2 h-4 w-4" /> Save Changes</Button>}
      />

      {/* Health Status */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {systemHealth.map((h) => (
          <div key={h.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${h.bg} ${h.color}`}>{h.icon}</span>
            <div>
              <div className="text-xs text-muted-foreground">{h.label}</div>
              <div className={`text-sm font-semibold ${h.color}`}>{h.status}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cache */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Caching</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Enable Cache</div>
                <div className="text-xs text-muted-foreground">Redis-based page and data caching</div>
              </div>
              <button onClick={() => toggle("cacheEnabled")} className={`flex h-6 w-11 rounded-full transition-colors ${config.cacheEnabled ? "bg-primary" : "bg-muted"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${config.cacheEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cache TTL (seconds)</label>
              <Input type="number" value={config.cacheTtl} onChange={(e) => setConfig({ ...config, cacheTtl: e.target.value })} disabled={!config.cacheEnabled} />
            </div>
            <Button variant="outline" size="sm" onClick={() => showToast("Cache cleared successfully")}>Clear Cache</Button>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Rate Limiting</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Enable Rate Limiting</div>
                <div className="text-xs text-muted-foreground">Protect APIs from abuse</div>
              </div>
              <button onClick={() => toggle("rateLimitEnabled")} className={`flex h-6 w-11 rounded-full transition-colors ${config.rateLimitEnabled ? "bg-primary" : "bg-muted"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${config.rateLimitEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Requests per minute</label>
              <Input type="number" value={config.rateLimitPerMinute} onChange={(e) => setConfig({ ...config, rateLimitPerMinute: e.target.value })} disabled={!config.rateLimitEnabled} />
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Database Backup</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium">Automatic Backups</div>
                <div className="text-xs text-muted-foreground">Scheduled backup of the database</div>
              </div>
              <button onClick={() => toggle("autoBackup")} className={`flex h-6 w-11 rounded-full transition-colors ${config.autoBackup ? "bg-primary" : "bg-muted"}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${config.autoBackup ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <div className="flex gap-2">
              {["hourly", "daily", "weekly"].map((f) => (
                <button key={f} onClick={() => setConfig({ ...config, backupFrequency: f })} className={`capitalize rounded-full px-3 py-1 text-xs font-medium border transition-colors ${config.backupFrequency === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>{f}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => showToast("Manual backup triggered")}>Run Backup Now</Button>
          </div>
        </div>

        {/* Performance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Performance</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "imageCompression", label: "Image Compression", desc: "Auto-compress uploaded images" },
              { key: "lazyLoading", label: "Lazy Loading", desc: "Load images and components on demand" },
              { key: "analyticsEnabled", label: "Analytics Tracking", desc: "Collect usage data for insights" },
              { key: "debugMode", label: "Debug Mode", desc: "Enable verbose logging (dev only)" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <button
                  onClick={() => { toggle(item.key as keyof typeof config); if (item.key === "debugMode" && !config.debugMode) showToast("Debug mode enabled — disable before going live", "warn"); }}
                  className={`flex h-6 w-11 rounded-full transition-colors ${config[item.key as keyof typeof config] ? (item.key === "debugMode" ? "bg-amber-500" : "bg-primary") : "bg-muted"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${config[item.key as keyof typeof config] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}