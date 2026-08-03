import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const requestSlug = (slug || '').replace(/^\/+|\/+$/g, '').toLowerCase();
        return pageSlug === requestSlug ||
               pageSlug === `website/${requestSlug}` ||
               requestSlug === pageSlug;
      });

      if (matched) {
        setPage(matched);
        document.title = matched.seo?.title || matched.title || 'Page — Roomhy';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', matched.seo?.description || matched.description || '');
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
        <div className="text-sm text-gray-500">Loading page…</div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-4xl font-bold text-gray-800">404</h1>
        <p className="text-gray-500">Page not found</p>
        <a href="/" className="text-blue-600 hover:underline text-sm">Go home</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{page.pageName || page.title || 'Page'}</h1>
        {(page.seo?.description || page.description) && (
          <p className="mt-2 text-gray-500">{page.seo?.description || page.description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        {page.seoContent || page.content ? (
          <div dangerouslySetInnerHTML={{ __html: page.seoContent || page.content }} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              This page is managed from the admin panel. Content will appear here once added.
            </p>
            {page.path && (
              <p className="text-xs text-gray-400 font-mono">Path: {page.path}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
