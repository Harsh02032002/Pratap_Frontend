import { PageHeader, type Crumb } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PlaceholderPage({
  title,
  subtitle,
  crumbs,
  primaryTo = "/dashboard",
  primaryLabel = "Go to Dashboard",
}: {
  title: string;
  subtitle?: string;
  crumbs: Crumb[];
  primaryTo?: string;
  primaryLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={crumbs}
        actions={
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create New</Button>
        }
      />
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">This module is ready to be built</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The route, sidebar entry and breadcrumb are wired up. The full CRUD experience for
            "{title}" plugs in here — with the same layout, tokens and table/form primitives used
            across Roomhy.
          </p>
        </div>
        <Button asChild variant="outline"><Link to={primaryTo}>{primaryLabel}</Link></Button>
      </div>
    </div>
  );
}