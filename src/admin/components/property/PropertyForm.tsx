import { useState } from "react";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import {
  ArrowLeft, Eye, Save, Info, MapPin, BedDouble, IndianRupee, Sparkles,
  Image as ImageIcon, User, Search, Settings2, Upload, Check, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { CITIES, AREAS, CATEGORIES, AMENITIES, OWNERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  mode: "create" | "edit";
  initialName?: string;
}

const TABS = [
  { v: "basic", l: "Basic Details", Icon: Info },
  { v: "location", l: "Location", Icon: MapPin },
  { v: "details", l: "Property Details", Icon: Settings2 },
  { v: "rooms", l: "Room Details", Icon: BedDouble },
  { v: "pricing", l: "Pricing", Icon: IndianRupee },
  { v: "amenities", l: "Amenities", Icon: Sparkles },
  { v: "media", l: "Images & Videos", Icon: ImageIcon },
  { v: "owner", l: "Owner Info", Icon: User },
  { v: "seo", l: "SEO", Icon: Search },
  { v: "advanced", l: "Advanced", Icon: Settings2 },
];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, children, full }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "md:col-span-2")}>
      <Label className="text-xs font-medium">{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function IconByName({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Sparkles;
  return <Cmp className={className} />;
}

// ─── SEO Tab Component ────────────────────────────────────────────────────────
function SeoTab() {
  const [metaTitle, setMetaTitle] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaSchema, setMetaSchema] = useState("");
  const [robots, setRobots] = useState("index,follow");
  const [schemaType, setSchemaType] = useState("LocalBusiness");

  // Dynamic SEO score
  const checks = [
    { label: "Meta Title", ok: metaTitle.length >= 10 && metaTitle.length <= 70 },
    { label: "Meta Description", ok: metaDesc.length >= 50 && metaDesc.length <= 170 },
    { label: "Meta Keywords", ok: metaKeywords.trim().split(",").filter(Boolean).length >= 3 },
    { label: "Schema Markup", ok: metaSchema.trim().length > 0 },
    { label: "Robots Tag", ok: robots === "index,follow" },
  ];
  const score = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const scoreLabel = score >= 80 ? "Great" : score >= 50 ? "Okay" : "Weak";
  const scoreDash = `${score}, 100`;

  const titleLen = metaTitle.length;
  const descLen = metaDesc.length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: Fields */}
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold">SEO Details</h3>
            <p className="text-xs text-muted-foreground">Only for SEO purpose (Meta Title, Meta Keywords and Meta Descriptions).</p>
          </div>
          <div className="space-y-5">
            {/* Meta Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Meta Title <span className="text-destructive">*</span></Label>
                <span className={cn("text-[11px]", titleLen > 70 ? "text-rose-500" : titleLen >= 50 ? "text-emerald-600" : "text-muted-foreground")}>
                  {titleLen}/70
                </span>
              </div>
              <Input
                placeholder="e.g. Best Roomhy PG | Premium Co-living"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Recommended 50–70 characters for best SEO.</p>
            </div>

            {/* Meta Keywords */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Keywords</Label>
              <Input
                placeholder="e.g. pg, hostel, rent room, co-living"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Comma-separated keywords. Add at least 3.</p>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Meta Description</Label>
                <span className={cn("text-[11px]", descLen > 170 ? "text-rose-500" : descLen >= 100 ? "text-emerald-600" : "text-muted-foreground")}>
                  {descLen}/170
                </span>
              </div>
              <Textarea
                rows={3}
                placeholder="Describe your property for search engines…"
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Recommended 100–170 characters for rich search snippets.</p>
            </div>

            {/* Meta Schema */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Meta Schema</Label>
              <Textarea
                rows={4}
                placeholder="Paste JSON-LD schema markup code here…"
                value={metaSchema}
                onChange={(e) => setMetaSchema(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">JSON-LD structured data. Helps search engines understand your listing.</p>
            </div>

            {/* Robots + Schema Type */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Robots</Label>
                <Select value={robots} onValueChange={setRobots}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Schema Type</Label>
                <Select value={schemaType} onValueChange={setSchemaType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LocalBusiness", "LodgingBusiness", "WebPage", "Product"].map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Right: Preview + Score */}
      <div className="space-y-4">
        {/* Google SERP Preview */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold">Google Preview</h4>
          <div className="rounded-lg border border-border bg-background p-3 space-y-1">
            <div className="text-xs text-emerald-700 truncate">roomhy.com › property-listing</div>
            <div className="text-sm font-medium text-blue-700 line-clamp-2">
              {metaTitle || <span className="text-muted-foreground italic">Enter Meta Title…</span>}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-3">
              {metaDesc || <span className="italic">Enter Meta Description to preview here…</span>}
            </div>
          </div>
        </div>

        {/* SEO Score */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold">SEO Score</h4>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" className="fill-none stroke-muted" strokeWidth="3.2" />
                <circle
                  cx="18" cy="18" r="15.9"
                  className={cn("fill-none", score >= 80 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-400" : "stroke-rose-400")}
                  strokeWidth="3.2"
                  strokeDasharray={scoreDash}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-lg font-bold", scoreColor)}>{score}</span>
                <span className="text-[10px] text-muted-foreground">{scoreLabel}</span>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-xs">
              {checks.map((c) => (
                <li key={c.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className={c.ok ? "text-emerald-600 font-medium" : "text-rose-400"}>
                    {c.ok ? "Good" : "Missing"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> SEO Tips</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Include city & property type in title</li>
            <li>Use 3+ relevant keywords</li>
            <li>Meta desc should mention key amenities</li>
            <li>Add JSON-LD schema for rich results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PropertyForm({ mode, initialName }: Props) {
  const [tab, setTab] = useState("basic");
  const [selectedCity, setSelectedCity] = useState("Kota");
  const [amenitiesSel, setAmenitiesSel] = useState<Set<string>>(new Set(["WiFi", "AC", "Power Backup", "Housekeeping"]));

  const toggleAmenity = (n: string) => {
    const s = new Set(amenitiesSel);
    s.has(n) ? s.delete(n) : s.add(n);
    setAmenitiesSel(s);
  };

  const save = (draft = false) => {
    toast.success(draft ? "Draft saved" : "Property saved successfully", {
      description: `${initialName ?? "New property"} has been ${draft ? "saved as draft" : "published"}.`,
    });
  };

  const title = mode === "edit" ? `Edit Property: ${initialName}` : "Add / Edit Property";
  const areaOptions = AREAS[selectedCity] ?? ["Central", "Sector 1", "Sector 2"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        crumbs={[
          { label: "Home", to: "/dashboard" },
          { label: "Property Management", to: "/properties" },
          { label: mode === "edit" ? "Edit Property" : "Add New Property" },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" asChild><a href="/properties"><ArrowLeft className="mr-2 h-4 w-4" /> Back</a></Button>
            <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" /> Preview</Button>
            <Button variant="outline" size="sm" onClick={() => save(true)}>Save as Draft</Button>
            <Button size="sm" onClick={() => save(false)}><Save className="mr-2 h-4 w-4" /> Save Property</Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0">
            {TABS.map(({ v, l, Icon }) => (
              <TabsTrigger
                key={v}
                value={v}
                className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Icon className="h-4 w-4" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Basic */}
        <TabsContent value="basic" className="space-y-4">
          <Section title="Basic Information" description="Core details that identify this property.">
            <Field label="Property Name" required><Input defaultValue={initialName ?? "ABC Residency"} /></Field>
            <Field label="Property Slug (URL)" required hint="https://roomhy.com/pg-in-vigyan-nagar-kota/abc-residency-kota"><Input defaultValue="abc-residency-kota" /></Field>
            <Field label="Property Type" required>
              <Select defaultValue="PG"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["PG", "Hostel", "Co-living", "Apartment", "Studio"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Category" required>
              <Select defaultValue={CATEGORIES[0]}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Gender" required>
              <Select defaultValue="Boys"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Boys", "Girls", "Co-ed"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Sharing Type" required>
              <Select defaultValue="Double"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Single", "Double", "Triple", "Four", "Deluxe"].map(s => <SelectItem key={s} value={s}>{s} Sharing</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Building Type"><Input defaultValue="Standalone Building" /></Field>
            <Field label="Property Floor"><Input type="number" defaultValue={2} /></Field>
            <Field label="Total Rooms" required><Input type="number" defaultValue={24} /></Field>
            <Field label="Food Option" required>
              <Select defaultValue="Yes"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Yes", "No"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Food Type">
              <Select defaultValue="Vegetarian"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Vegetarian", "Non-Vegetarian", "Both"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Move-in Date"><Input type="date" defaultValue="2025-06-01" /></Field>
            <Field label="Short Description" full><Textarea rows={2} defaultValue="Premium boys PG in Vigyan Nagar, Kota with modern amenities and hygienic food." /></Field>
            <Field label="Long Description" full hint="Rich description shown on the property detail page."><Textarea rows={5} defaultValue="ABC Residency offers fully furnished single and double sharing rooms, 24×7 security, high-speed WiFi, RO water, daily housekeeping and hygienic food. Located in the heart of Vigyan Nagar, Kota — walking distance to major coaching institutes." /></Field>
          </Section>
        </TabsContent>

        {/* Location */}
        <TabsContent value="location" className="space-y-4">
          <Section title="Location Details">
            <Field label="Country" required><Input defaultValue="India" /></Field>
            <Field label="State" required><Input defaultValue="Rajasthan" /></Field>
            <Field label="City" required>
              <Select value={selectedCity} onValueChange={setSelectedCity}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Area / Locality" required>
              <Select defaultValue={areaOptions[0]}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{areaOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Address Line 1" full><Input defaultValue="Plot 12, Near Career Point Gate 2, Vigyan Nagar" /></Field>
            <Field label="Address Line 2"><Input defaultValue="Behind Modi Xerox" /></Field>
            <Field label="Nearby Landmark"><Input defaultValue="Career Point University" /></Field>
            <Field label="Pincode"><Input defaultValue="324005" /></Field>
            <Field label="Latitude"><Input defaultValue="25.1520" /></Field>
            <Field label="Longitude"><Input defaultValue="75.8637" /></Field>
            <Field label="Google Maps URL" full><Input defaultValue="https://maps.google.com/?q=25.1520,75.8637" /></Field>
          </Section>
          <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
            <div className="text-center">
              <MapPin className="mx-auto mb-2 h-6 w-6" />
              Google Maps preview appears here
            </div>
          </div>
        </TabsContent>

        {/* Details */}
        <TabsContent value="details" className="space-y-4">
          <Section title="Property Details">
            {[
              ["Total Floors", 3], ["Total Rooms", 24], ["Available Rooms", 6], ["Occupied Rooms", 18],
              ["Property Age (yrs)", 4], ["Property Size (sq ft)", 4200],
            ].map(([l, v]) => <Field key={String(l)} label={String(l)}><Input type="number" defaultValue={v as number} /></Field>)}
            <Field label="Facing"><Select defaultValue="East"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["East","West","North","South","North-East","South-East"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Furnishing"><Select defaultValue="Fully"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Fully","Semi","Unfurnished"].map(f => <SelectItem key={f} value={f}>{f} Furnished</SelectItem>)}</SelectContent></Select></Field>
          </Section>
          <Section title="Facilities">
            {["Parking","Power Backup","Water Supply","Security","Lift","Internet","Balcony","Kitchen","Laundry","Housekeeping","CCTV","Fire Safety","Wheelchair Access"].map(f => (
              <div key={f} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">{f}</span>
                <Switch defaultChecked={["Parking","Power Backup","Water Supply","Security","Lift","Internet","CCTV","Housekeeping"].includes(f)} />
              </div>
            ))}
          </Section>
        </TabsContent>

        {/* Rooms */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="space-y-4">
            {["Single Sharing", "Double Sharing", "Triple Sharing", "Deluxe Room"].map((rt, i) => (
              <Section key={rt} title={rt} description="Configure availability and pricing for this room type.">
                <Field label="Room Type"><Input defaultValue={rt} /></Field>
                <Field label="AC / Non-AC"><Select defaultValue={i % 2 === 0 ? "AC" : "Non-AC"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["AC","Non-AC"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Attached Bathroom"><Select defaultValue="Yes"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Yes","No"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Room Size (sq ft)"><Input type="number" defaultValue={120 + i * 40} /></Field>
                <Field label="Bed Count"><Input type="number" defaultValue={i + 1} /></Field>
                <Field label="Available Quantity"><Input type="number" defaultValue={4 + i} /></Field>
                <Field label="Monthly Rent (₹)"><Input type="number" defaultValue={6000 + i * 2500} /></Field>
                <Field label="Security Deposit (₹)"><Input type="number" defaultValue={6000 + i * 2500} /></Field>
                <Field label="Maintenance (₹)"><Input type="number" defaultValue={500} /></Field>
                <Field label="WiFi Charges (₹)"><Input type="number" defaultValue={0} /></Field>
              </Section>
            ))}
            <Button variant="outline"><Icons.Plus className="mr-2 h-4 w-4" /> Add Room Type</Button>
          </div>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4">
          <Section title="Pricing & Charges" description="All values in INR. Total monthly cost is auto-calculated.">
            {[
              ["Base Rent", 8000], ["Discount", 500], ["Offer Price", 7500], ["Security Deposit", 8000],
              ["Maintenance", 500], ["Electricity", 800], ["Water Charges", 200], ["Laundry Charges", 300],
              ["Food Charges", 2500], ["GST (%)", 18], ["Late Fee", 200], ["Cancellation Charges", 500],
            ].map(([l, v]) => (
              <Field key={String(l)} label={String(l)}>
                <div className="relative"><IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input type="number" defaultValue={v as number} className="pl-8" /></div>
              </Field>
            ))}
            <Field label="Total Monthly Cost" hint="Auto-calculated from the values above" full>
              <div className="rounded-lg bg-primary/5 px-4 py-3 text-lg font-bold text-primary">₹ 11,800 / month</div>
            </Field>
            <Field label="Refund Policy" full><Textarea rows={3} defaultValue="Full refund within 7 days of booking. Partial refund up to 30 days. No refund after check-in." /></Field>
          </Section>
        </TabsContent>

        {/* Amenities */}
        <TabsContent value="amenities" className="space-y-4">
          <Section title="Amenities" description="Select all amenities available at this property.">
            <div className="md:col-span-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {AMENITIES.map((a) => {
                const active = amenitiesSel.has(a.name);
                return (
                  <button
                    type="button"
                    key={a.name}
                    onClick={() => toggleAmenity(a.name)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                      active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40",
                    )}
                  >
                    <IconByName name={a.icon} className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1 truncate">{a.name}</span>
                    {active && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </Section>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="space-y-4">
          <Section title="Media Gallery" description="Upload cover, gallery images, videos, floor plans and brochures.">
            <div className="md:col-span-2">
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Drag &amp; drop files here or click to upload</div>
                <div className="text-xs text-muted-foreground">JPG, PNG, MP4 · max 20 MB per file</div>
                <Button size="sm" variant="outline" className="mt-1">Browse files</Button>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {[
                "photo-1522708323590-d24dbb6b0267","photo-1502672260266-1c1ef2d93688","photo-1560448204-e02f11c3d0e2",
                "photo-1580587771525-78b9dba3b914","photo-1554995207-c18c203602cb","photo-1568605114967-8130f3a36994",
                "photo-1493809842364-78817add7ffb","photo-1484154218962-a197022b5858","photo-1560185127-6ed189bf02f4",
                "photo-1631679706909-1844bbd07221","photo-1505691938895-1758d7feb511","photo-1522444195799-478538b28823",
              ].map((id, i) => (
                <div key={id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                  <img src={`https://images.unsplash.com/${id}?w=300`} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Cover</span>}
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>

        {/* Owner */}
        <TabsContent value="owner" className="space-y-4">
          <Section title="Owner Information">
            <Field label="Owner Name" required>
              <Select defaultValue={OWNERS[0]}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OWNERS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Phone" required><Input defaultValue="+91 98765 43210" /></Field>
            <Field label="Alternate Phone"><Input defaultValue="+91 91234 56780" /></Field>
            <Field label="Email"><Input defaultValue="rahulsharma@example.com" /></Field>
            <Field label="WhatsApp"><Input defaultValue="+91 98765 43210" /></Field>
            <Field label="GST Number"><Input defaultValue="08AABCU9603R1ZM" /></Field>
            <Field label="PAN Number"><Input defaultValue="ABCDE1234F" /></Field>
            <Field label="UPI ID"><Input defaultValue="rahul@upi" /></Field>
            <Field label="Owner Address" full><Textarea rows={2} defaultValue="Plot 12, Vigyan Nagar, Kota, Rajasthan 324005" /></Field>
            <Field label="Emergency Contact"><Input defaultValue="+91 90000 12345" /></Field>
            <Field label="Verification Status">
              <div className="flex items-center gap-2 rounded-md border border-border p-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700">Verified</span>
              </div>
            </Field>
          </Section>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <SeoTab />
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Section title="Advanced Options">
            <Field label="Property Priority"><Input type="number" defaultValue={1} /></Field>
            <Field label="Sorting Order"><Input type="number" defaultValue={10} /></Field>
            <Field label="Listing Expiry"><Input type="date" defaultValue="2026-06-01" /></Field>
            <Field label="Auto Publish"><div className="flex items-center gap-2 rounded-md border border-border p-2"><Switch defaultChecked /> <span className="text-sm">Enabled</span></div></Field>
            <Field label="Recommended"><div className="flex items-center gap-2 rounded-md border border-border p-2"><Switch defaultChecked /> <span className="text-sm">Show on Recommended</span></div></Field>
            <Field label="Featured"><div className="flex items-center gap-2 rounded-md border border-border p-2"><Switch /> <span className="text-sm">Homepage highlight</span></div></Field>
            <Field label="Homepage Visibility"><div className="flex items-center gap-2 rounded-md border border-border p-2"><Switch defaultChecked /> <span className="text-sm">Visible</span></div></Field>
            <Field label="Auto Archive"><div className="flex items-center gap-2 rounded-md border border-border p-2"><Switch /> <span className="text-sm">Enabled</span></div></Field>
            <Field label="Revision Notes" full><Textarea rows={3} defaultValue="Updated pricing and refreshed gallery images." /></Field>
            <Field label="Internal Notes" full><Textarea rows={3} defaultValue="Owner prefers weekday check-ins. Verify KYC before final publish." /></Field>
          </Section>
          <Section title="Version History">
            <div className="md:col-span-2 divide-y divide-border">
              {[
                { by: "Super Admin", d: "18 May 2025, 12:30 PM", note: "Published property" },
                { by: "Priya Verma", d: "16 May 2025, 06:14 PM", note: "Updated pricing" },
                { by: "Rahul Sharma", d: "12 May 2025, 09:02 AM", note: "Created draft" },
              ].map((v, i) => (
                <div key={i} className="flex items-start justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{v.note}</div>
                    <div className="text-xs text-muted-foreground">by {v.by}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{v.d}</div>
                </div>
              ))}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}