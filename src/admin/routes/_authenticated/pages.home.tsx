import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, Save, FileText, Pencil, Search, Share2, Settings2, HelpCircle,
  Upload, Image as ImageIcon, ThumbsUp, MessageCircle,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pages/home")({
  head: () => ({
    meta: [
      { title: "Edit Home Page — Roomhy Admin" },
      { name: "description", content: "Edit the Home Page for Roomhy — details, SEO, social and advanced settings." },
    ],
  }),
  component: EditHomePage,
});

const TABS = [
  { v: "details", l: "Page Details", Icon: FileText },
  { v: "content", l: "Content", Icon: Pencil },
  { v: "seo", l: "SEO Settings", Icon: Search },
  { v: "social", l: "Social Preview", Icon: Share2 },
  { v: "advanced", l: "Advanced", Icon: Settings2 },
];

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, hint, children, full }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "md:col-span-2")}>
      <Label className="flex items-center gap-1 text-xs font-medium">{label}{required && <span className="text-destructive">*</span>}<HelpCircle className="h-3 w-3 text-muted-foreground" /></Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EditHomePage() {
  const [tab, setTab] = useState("seo");
  const [sections, setSections] = useState<any[]>([]);
  const [seoData, setSeoData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load page layout sections from backend
    import('@/lib/api').then(({ api }) => {
      api.get('/api/page-layouts/home').then((data: any) => {
        if (data?.data?.sections) setSections(data.data.sections);
      }).catch(console.error);
      api.get('/api/seo/pages?pageKey=home').then((data: any) => {
        if (data?.data?.[0]) setSeoData(data.data[0]);
      }).catch(console.error);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { api } = await import('@/lib/api');
      await api.put('/api/page-layouts/home', { sections });
      toast.success("Home page updated", { description: "Your changes are now live on roomhy.com." });
    } catch (err: any) {
      toast.error("Save failed", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Page: Home Page"
        crumbs={[{ label: "Home", to: "/dashboard" }, { label: "Page Management", to: "/pages" }, { label: "Home Page" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" /> Preview</Button>
            <Button size="sm" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</Button>
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

        {/* Details */}
        <TabsContent value="details" className="space-y-4">
          <Card title="Basic Information">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Page Slug (URL)" required hint="This will be the public URL of this page." full>
                <div className="flex items-stretch overflow-hidden rounded-md border border-border">
                  <span className="border-r border-border bg-muted px-3 py-2 text-sm text-muted-foreground">https://roomhy.com/</span>
                  <Input defaultValue="home" className="border-0 shadow-none focus-visible:ring-0" />
                </div>
              </Field>
              <Field label="Parent Page" hint="Select parent page if any.">
                <Select defaultValue="none"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No Parent (Top Level)</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Page Template" hint="Select the template for this page.">
                <Select defaultValue="default"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["default","landing","full-width","split"].map(t => <SelectItem key={t} value={t}>{t.replace("-"," ")} template</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select defaultValue="Published"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Published","Draft","Scheduled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Display Priority" hint="Lower number shows higher priority."><Input type="number" defaultValue={1} /></Field>
              <Field label="Meta Title (Page Title)" required full hint="This will be used as default title if SEO Meta Title is empty.">
                <Input defaultValue="Roomhy - Find PG, Hostels, Co-living & Apartments Across Top Cities" />
              </Field>
              <Field label="Short Description (For Listing)" full hint="This description may show in listings or previews.">
                <Textarea rows={3} defaultValue="Find verified PG, hostels, co-living spaces and apartments across top cities in India." />
              </Field>
              <Field label="Page Icon">
                <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  <Upload className="h-4 w-4" /> Click to upload or drag and drop
                  <span>SVG, PNG or ICO (Max. 1MB)</span>
                </div>
              </Field>
              <Field label="Banner / Featured Image" required>
                <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  <ImageIcon className="h-4 w-4" /> Click to change banner
                  <span>Recommended 1920×600px</span>
                </div>
              </Field>
              <Field label="Show / Hide on Website" full>
                <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                  <label className="flex items-center gap-2"><Checkbox defaultChecked /> Show in Main Navigation</label>
                  <label className="flex items-center gap-2"><Checkbox defaultChecked /> Show in Footer</label>
                </div>
              </Field>
            </div>
          </Card>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-4">
          <Card title="Page Content" description="The main content block rendered on the home page.">
            <Textarea rows={14} defaultValue={"Welcome to Roomhy — India's trusted platform to find verified PG, hostels, co-living spaces and apartments.\n\nDiscover properties in Kota, Jaipur, Delhi, Indore, Bhopal, Nagpur, Sikar and more.\n\nBook your perfect stay in minutes."} />
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card title="Search Engine Optimization">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Page URL (Slug)" full>
                    <div className="flex items-stretch overflow-hidden rounded-md border border-border">
                      <span className="border-r border-border bg-muted px-3 py-2 text-sm text-muted-foreground">https://roomhy.com/</span>
                      <Input defaultValue="home" className="border-0 shadow-none focus-visible:ring-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">This will be the public URL of this page.</p>
                  </Field>
                  <Field label="Canonical URL" hint="Leave empty to default to current URL." full><Input defaultValue="https://roomhy.com/" /></Field>
                  <Field label="Meta Title" full hint="Recommended: 50-60 characters. You've used 57 characters.">
                    <Input defaultValue="Roomhy – Find PG, Hostels, Co-living & Apartments Across Top Cities" className="border-primary/60" />
                  </Field>
                  <Field label="Meta Robots" hint="Search engine indexing instructions." full>
                    <Select defaultValue="index, follow"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["index, follow","noindex, follow","index, nofollow","noindex, nofollow"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Meta Description" full hint="Recommended: 150-160 characters. You've used 154 characters.">
                    <Textarea rows={4} defaultValue="Discover verified PG, hostels, co-living spaces and apartments in top cities like Kota, Jaipur, Delhi, Indore, Bhopal, Nagpur & Sikar. Find your perfect stay with Roomhy." />
                  </Field>
                  <Field label="H1 Tag" hint="The main heading of this page." full><Input defaultValue="Find Your Perfect Stay with Roomhy" /></Field>
                  <Field label="Meta Keywords" full hint="Separate keywords with commas.">
                    <Textarea rows={2} defaultValue="PG in Kota, hostels in Jaipur, co-living in Delhi, apartments in Indore, student accommodation, Roomhy" />
                  </Field>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Google Preview">
                <div className="space-y-1 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">R</span>
                    <span>roomhy.com</span><span>›</span><span>https://roomhy.com</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">Roomhy – Find PG, Hostels, Co-living &amp; Apartments Across Top Cities</div>
                  <div className="text-xs text-muted-foreground">Discover verified PG, hostels, co-living spaces and apartments in top cities like Kota, Jaipur, Delhi, Indore, Bhopal, Nagpur &amp; Sikar. Find your perfect stay with Roomhy.</div>
                </div>
              </Card>
              <Card title="SEO Score">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" className="fill-none stroke-muted" strokeWidth="3.2" />
                      <circle cx="18" cy="18" r="15.9" className="fill-none stroke-primary" strokeWidth="3.2" strokeDasharray="92, 100" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold">92</span>
                      <span className="text-[10px] text-primary">Excellent</span>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-1.5 text-xs">
                    <li className="flex justify-between"><span>Meta Title</span><span className="text-muted-foreground">57 / 60</span></li>
                    <li className="flex justify-between"><span>Meta Description</span><span className="text-muted-foreground">154 / 160</span></li>
                    <li className="flex justify-between"><span>H1 Tag</span><span className="text-emerald-600">Good</span></li>
                    <li className="flex justify-between"><span>Keywords</span><span className="text-emerald-600">Good</span></li>
                    <li className="flex justify-between"><span>URL Structure</span><span className="text-emerald-600">Good</span></li>
                  </ul>
                </div>
                <div className="mt-4 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">Great! Your SEO is optimized.</div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Social Media Preview Settings" description="Customize how this page appears when shared on social media platforms.">
              <div className="space-y-4">
                <Field label="Social Image" hint="Recommended: 1200x630px · Max size: 2MB (JPG, PNG)">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200" alt="" className="h-16 w-24 rounded object-cover" />
                    <div>
                      <div className="text-sm font-medium">PG, Hostels, Co-living &amp; Apartments</div>
                      <Button size="sm" variant="outline" className="mt-1"><Upload className="mr-1 h-3.5 w-3.5" /> Change Image</Button>
                    </div>
                  </div>
                </Field>
                <Field label="Social Title" hint="Recommended: 60 characters. You've used 57 characters.">
                  <Input defaultValue="Roomhy - Find PG, Hostels, Co-living & Apartments Across Top Cities" />
                </Field>
                <Field label="Social Description" hint="Recommended: 120-200 characters. You've used 154 characters.">
                  <Textarea rows={4} defaultValue="Discover verified PG, hostels, co-living spaces and apartments in top cities like Kota, Jaipur, Delhi, Indore, Bhopal, Nagpur & Sikar. Find your perfect stay with Roomhy." />
                </Field>
                <Field label="Social Handle / Site Name" hint="This will be shown as the source/author name."><Input defaultValue="Roomhy" /></Field>
              </div>
            </Card>
            <Card title="Live Social Previews" description="See how your page will look when shared.">
              <Tabs defaultValue="fb">
                <TabsList>
                  <TabsTrigger value="fb">Facebook</TabsTrigger>
                  <TabsTrigger value="tw">X / Twitter</TabsTrigger>
                  <TabsTrigger value="li">LinkedIn</TabsTrigger>
                </TabsList>
                {(["fb","tw","li"] as const).map((k) => (
                  <TabsContent key={k} value={k} className="mt-3">
                    <div className="overflow-hidden rounded-lg border border-border">
                      <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800" alt="" className="h-40 w-full object-cover" />
                      <div className="space-y-1 p-3">
                        <div className="text-[10px] uppercase text-muted-foreground">roomhy.com</div>
                        <div className="text-sm font-semibold">Roomhy - Find PG, Hostels, Co-living &amp; Apartments</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">Discover verified PG, hostels, co-living spaces and apartments in top cities across India.</div>
                      </div>
                      <div className="flex gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
                        <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Card title="Advanced Settings" description="Configure technical settings and additional options for this page.">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Indexing &amp; Crawling</h4>
                  <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between"><span>Allow Search Engines to Index</span><Switch defaultChecked /></div>
                    <div className="flex items-center justify-between"><span>Follow Links</span><Switch defaultChecked /></div>
                  </div>
                </div>
                <Field label="Canonical URL" hint="Leave empty to use default canonical."><Input defaultValue="https://roomhy.com/" /></Field>
                <Field label="301 Redirect URL (If any)" hint="Leave empty if not redirecting."><Input placeholder="https://example.com/new-url" /></Field>
                <Field label="Schema Type">
                  <Select defaultValue="WebPage"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["WebPage","Organization","Product","LocalBusiness"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Custom Schema (JSON-LD)" full><Textarea rows={5} placeholder='{"@context":"https://schema.org","@type":"WebPage",...}' className="font-mono text-xs" /></Field>
              </div>
              <div className="space-y-4">
                <Field label="Twitter Image" full><Input defaultValue="https://roomhy.com/assets/twitter-image.jpg" /></Field>
                <Field label="Custom CSS" full><Textarea rows={4} placeholder="/* Add custom CSS for this page only */" className="font-mono text-xs" /></Field>
                <Field label="Custom JavaScript" full><Textarea rows={4} placeholder="// Add custom JavaScript for this page only" className="font-mono text-xs" /></Field>
                <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                  <label className="flex items-center gap-2"><Checkbox defaultChecked /> Display in Sitemap</label>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                  <div className="mb-2 font-semibold text-foreground">Page Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><div className="text-muted-foreground">Created On</div><div className="text-foreground">18 May 2025, 12:30 PM</div></div>
                    <div><div className="text-muted-foreground">Last Updated</div><div className="text-foreground">18 May 2025, 12:30 PM</div></div>
                    <div><div className="text-muted-foreground">Updated By</div><div className="text-foreground">Super Admin</div></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}