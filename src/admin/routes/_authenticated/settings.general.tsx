import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Check, Globe, Mail, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/general")({
  head: () => ({
    meta: [
      { title: "General Settings — Roomhy Admin" },
      { name: "description", content: "General platform settings." },
    ],
  }),
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  const [form, setForm] = useState({
    siteName: "Roomhy",
    tagline: "Find Your Perfect PG, Hostel & Co-living Space",
    email: "support@roomhy.com",
    phone: "+91 98765 43210",
    address: "123 Tech Park, Bengaluru, Karnataka 560001",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en",
    maintenanceMode: false,
    registrationOpen: true,
    propertyAutoApprove: false,
    maxImagesPerProperty: "20",
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const handleSave = () => showToast("General settings saved successfully");

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg text-emerald-800 text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="General Settings"
        subtitle="Global platform preferences and configuration"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "General" }]}
        actions={<Button size="sm" onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save Changes</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Site Identity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Site Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Site Name</label>
              <Input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tagline</label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Contact Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Support Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Office Address</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Locale */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Locale & Region</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Currency</label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR — Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Timezone</label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Language</label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Platform Config */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Platform Configuration</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: "maintenanceMode", label: "Maintenance Mode", desc: "Take the site offline for maintenance" },
              { key: "registrationOpen", label: "Open Registration", desc: "Allow new property owners to register" },
              { key: "propertyAutoApprove", label: "Auto-approve Properties", desc: "Bypass manual approval for new listings" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <button
                  onClick={() => setForm((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                  className={`flex h-6 w-11 rounded-full transition-colors ${form[item.key as keyof typeof form] ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow my-auto mx-0.5 transition-transform ${form[item.key as keyof typeof form] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Max Images per Property</label>
              <Input type="number" value={form.maxImagesPerProperty} onChange={(e) => setForm({ ...form, maxImagesPerProperty: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}><Check className="mr-2 h-4 w-4" /> Save All Changes</Button>
      </div>
    </div>
  );
}