import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Camera, Lock, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/settings/profile")({
  head: () => ({
    meta: [
      { title: "Profile Settings — Roomhy Admin" },
      { name: "description", content: "Update your admin profile." },
    ],
  }),
  component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
  const [profile, setProfile] = useState({ name: "Priya Verma", email: "priya@roomhy.com", phone: "+91 98765 43210", role: "Super Admin", bio: "Platform administrator with full access to Roomhy." });
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 shadow-lg text-emerald-800 text-sm font-medium">
          <Check className="h-4 w-4" /> {toast}
        </div>
      )}

      <PageHeader
        title="Profile Settings"
        subtitle="Update your name, email, password and preferences"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Settings" }, { label: "Profile" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Avatar */}
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-3xl font-bold text-white">
              PV
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow hover:opacity-90">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-base font-semibold">{profile.name}</div>
          <div className="text-sm text-muted-foreground">{profile.role}</div>
          <div className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {profile.email}
          </div>
        </div>

        {/* Profile Info */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full Name</label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email Address</label>
              <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Role</label>
              <Input value={profile.role} disabled className="opacity-60" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Bio</label>
              <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => showToast("Profile updated successfully")}><Check className="mr-2 h-4 w-4" /> Save Profile</Button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Change Password</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Current Password</label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="pr-10" />
              <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">New Password</label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} placeholder="Min 8 characters" value={passwords.newPw} onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })} className="pr-10" />
              <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
            <Input type="password" placeholder="Repeat new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!passwords.current || !passwords.newPw || passwords.newPw !== passwords.confirm}
            onClick={() => { setPasswords({ current: "", newPw: "", confirm: "" }); showToast("Password changed successfully"); }}
          >
            <Lock className="mr-2 h-4 w-4" /> Change Password
          </Button>
        </div>
      </div>
    </div>
  );
}