import React from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import LeadAccessGuard from "../../components/propertyowner/LeadAccessGuard";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { 
  Globe, Search, TrendingUp, BarChart3, 
  ArrowUpRight, Target, Share2
} from "lucide-react";

export default function SocialMediaLeadsPage() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") { 
    window.location.href = "/propertyowner/ownerlogin"; 
    return null; 
  }

  const campaigns = [
    { id: 1, platform: "Meta Ads (Facebook/Instagram)", leads: 48, clicks: 1200, spend: 3500, status: "Active" },
    { id: 2, platform: "Google Search Ads", leads: 15, clicks: 450, spend: 2000, status: "Paused" }
  ];

  return (
    <PropertyOwnerLayout 
      owner={owner} 
      title="Digital Marketing Campaigns" 
      onLogout={() => { clearOwnerRuntimeSession(); window.location.href = "/propertyowner/ownerlogin"; }}
    >
      <LeadAccessGuard owner={owner}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">Social Media Leads</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Track digital marketing campaigns ROI, facebook leads generation forms, and clicks analytics.</p>
        </div>
      </div>

      {/* Roster list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Globe size={20} />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  c.status === "Active" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {c.status}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-[21px] font-bold text-foreground">{c.platform}</h3>
              </div>

              <div className="border-t border-border/60 pt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Leads Recd:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{c.leads}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Clicks:</span>
                  <p className="font-bold text-slate-800 mt-0.5">{c.clicks}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Spend:</span>
                  <p className="font-bold text-slate-800 mt-0.5">₹{c.spend.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LeadAccessGuard>
    </PropertyOwnerLayout>
  );
}
