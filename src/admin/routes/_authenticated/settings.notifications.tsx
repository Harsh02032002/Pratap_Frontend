import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Settings — Roomhy Admin" },
      { name: "description", content: "Configure email and in-app notifications." },
    ],
  }),
  component: NotificationSettingsPage,
});

const NOTIFICATION_GROUPS = [
  {
    title: "Property Notifications",
    items: [
      { key: "prop_new", label: "New property submitted", desc: "When a property owner submits a new listing" },
      { key: "prop_approved", label: "Property approved", desc: "When an admin approves a listing" },
      { key: "prop_rejected", label: "Property rejected", desc: "When a listing is rejected" },
      { key: "prop_expired", label: "Property expired", desc: "When a listing's expiry date passes" },
    ],
  },
  {
    title: "User Notifications",
    items: [
      { key: "user_signup", label: "New owner registration", desc: "When a property owner signs up" },
      { key: "user_message", label: "New inquiry", desc: "When a tenant sends a message" },
    ],
  },
  {
    title: "System Notifications",
    items: [
      { key: "sys_error", label: "System errors", desc: "Critical errors or downtime alerts" },
      { key: "sys_backup", label: "Database backup", desc: "Daily backup completion status" },
      { key: "sys_sitemap", label: "Sitemap generation", desc: "When sitemap is regenerated" },
    ],
  },
];

interface NotifState {
  [key: string]: { email: boolean; inApp: boolean };
}

const INIT: NotifState = Object.fromEntries(
  NOTIFICATION_GROUPS.flatMap((g) => g.items).map((item) => [
    item.key,
    { email: item.key.startsWith("prop") || item.key === "sys_error", inApp: true },
  ])
);

function NotificationSettingsPage() {
  const [state, setState] = useState<NotifState>(INIT);
  const [toast, setToast] = useState<string | null>(null);

  const toggle = (key: string, channel: "email" | "inApp") => {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));
  };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg text-emerald-800 text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Notification Settings"
        subtitle="Control what triggers email and in-app notifications"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "Notifications" }]}
        actions={<Button size="sm" onClick={() => showToast("Notification preferences saved")}><Check className="mr-2 h-4 w-4" /> Save</Button>}
      />

      <div className="space-y-4">
        {/* Header Row */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-3">
            <span className="text-sm font-semibold">Notification Event</span>
            <div className="flex gap-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Email</span>
              <span>In-App</span>
            </div>
          </div>

          {NOTIFICATION_GROUPS.map((group, gi) => (
            <div key={gi}>
              <div className="bg-muted/20 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                {group.title}
              </div>
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between border-b border-border/40 px-5 py-4 last:border-b-0 hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    {(["email", "inApp"] as const).map((channel) => (
                      <button
                        key={channel}
                        onClick={() => toggle(item.key, channel)}
                        className={`flex h-6 w-11 rounded-full transition-colors ${state[item.key][channel] ? "bg-primary" : "bg-muted"}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${state[item.key][channel] ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Digest Settings */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Email Digest</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Receive a summary instead of individual emails.</p>
          <div className="flex flex-wrap gap-2">
            {["Real-time", "Hourly", "Daily", "Weekly"].map((opt) => (
              <button key={opt} className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${opt === "Daily" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}