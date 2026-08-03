import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/website/$slug")({
  head: () => ({
    meta: [
      { title: "Page — Roomhy" },
      { name: "description", content: "Roomhy page" },
    ],
  }),
  component: DynamicPage,
});

function DynamicPage() {
  const { slug } = useParams({ from: "/website/$slug" });
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/seo/pages`);
      const data = await res.json();
      const pages = data?.data || data || [];
      
      // Find page by matching slug
      const matched = pages.find((p) => {
        const pageSlug = (p.path || p.slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
        const requestSlug = slug.replace(/^\/+|\/+$/g, '').toLowerCase();
        return pageSlug === requestSlug || 
               pageSlug === `website/${requestSlug}` ||
               requestSlug === pageSlug;
      });
      
      if (matched) {
        setPage(matched);
        // Update page meta
        document.title = matched.seo?.title || matched.title || 'Page — Roomhy';
        document.querySelector('meta[name="description"]')?.setAttribute('content', matched.seo?.description || matched.description || '');
      } else {
        setError('Page not found');
      }
    } catch (err) {
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-muted-foreground">Loading page…</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={page.pageName || page.title || 'Page'}
        subtitle={page.seo?.description || page.description || ''}
        crumbs={[{ label: "Home", to: "/website/index" }, { label: page.pageName || 'Page' }]}
      />
      
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        {page.seo?.description && (
          <p className="text-sm text-muted-foreground mb-4">{page.seo.description}</p>
        )}
        {page.seoContent || page.content ? (
          <div dangerouslySetInnerHTML={{ __html: page.seoContent || page.content }} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This page is managed from the admin panel. Content will appear here once added.
            </p>
            {page.path && (
              <p className="text-xs text-muted-foreground font-mono">Path: {page.path}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
