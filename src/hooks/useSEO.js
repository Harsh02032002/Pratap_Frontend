import { useEffect, useRef } from 'react';
import { fetchJson } from '../utils/api';

/**
 * Dynamic SEO hook — fetches meta data from backend by pageKey
 * Falls back to static values if API fails or data not found.
 *
 * Usage:
 *   useSEO({ pageKey: 'about' })
 *   useSEO({ pageKey: 'home', fallbackTitle: 'Roomhy - PG Booking' })
 *   useSEO({ title: 'Static Title', description: 'Static desc' })  // legacy static mode
 */
export default function useSEO({ slug, pageKey, fallbackTitle, fallbackDescription, title, description, canonical } = {}) {
  const appliedRef = useRef(false);

  useEffect(() => {
    // If explicit static title/description/canonical passed, apply them
    if (title) document.title = title;
    if (description) applyMeta('description', description);

    // Format absolute canonical URL
    const resolvedCanonical = canonical
      ? (canonical.startsWith('http') ? canonical : `https://roomhy.com${canonical.startsWith('/') ? canonical : '/' + canonical}`)
      : `https://roomhy.com${window.location.pathname}`.replace(/\/+$/, '') || 'https://roomhy.com/';

    applyCanonical(resolvedCanonical);

    // LEGACY STATIC MODE: if no slug and no pageKey
    if (!slug && !pageKey) {
      applyMeta('robots', 'index, follow');
      return;
    }

    // DYNAMIC MODE: fetch from backend by slug or pageKey
    let cancelled = false;

    async function loadSeo() {
      try {
        const queryParam = slug ? `slug=${encodeURIComponent(slug)}` : `pageKey=${encodeURIComponent(pageKey)}`;
        const res = await fetchJson(`/api/seo/metadata?${queryParam}`);
        if (cancelled) return;

        if (res?.success && res?.data) {
          const seo = res.data;

          // Title
          if (seo.metaTitle && !title) {
            document.title = seo.metaTitle;
          } else if (fallbackTitle && !title) {
            document.title = fallbackTitle;
          }

          // Description
          if (!description) {
            applyMeta('description', seo.metaDescription || fallbackDescription);
          }

          // Keywords (Primary + Secondary Keywords)
          const keywordsStr = seo.metaKeywords || (seo.primaryKeyword ? [seo.primaryKeyword, ...(seo.secondaryKeywords || [])].join(', ') : '');
          if (keywordsStr) applyMeta('keywords', keywordsStr);

          // Robots
          const robotsValue = seo.robots || (seo.isIndexed === false ? 'noindex, nofollow' : 'index, follow');
          applyMeta('robots', robotsValue);

          // Canonical URL (prioritize explicitly passed canonical over backend generic fallback)
          const targetCanonical = canonical || seo.canonicalUrl || resolvedCanonical;
          applyCanonical(targetCanonical);

          // Open Graph
          applyOGMeta('og:title', seo.openGraphTitle || seo.metaTitle || title);
          applyOGMeta('og:description', seo.openGraphDescription || seo.metaDescription || description);
          if (seo.openGraphImage) applyOGMeta('og:image', seo.openGraphImage);
          applyOGMeta('og:type', 'website');

          // Twitter Card
          applyMeta('twitter:card', seo.twitterCard || 'summary_large_image');
          if (seo.twitterTitle || seo.metaTitle || title) applyMeta('twitter:title', seo.twitterTitle || seo.metaTitle || title);
          if (seo.twitterDescription || seo.metaDescription || description) applyMeta('twitter:description', seo.twitterDescription || seo.metaDescription || description);

          appliedRef.current = true;
        } else {
          if (fallbackTitle && !title) document.title = fallbackTitle;
          if (fallbackDescription && !description) applyMeta('description', fallbackDescription);
          applyMeta('robots', 'index, follow');
        }
      } catch (err) {
        if (!cancelled) {
          if (fallbackTitle && !title) document.title = fallbackTitle;
          if (fallbackDescription && !description) applyMeta('description', fallbackDescription);
          applyMeta('robots', 'index, follow');
        }
      }
    }

    loadSeo();

    return () => {
      cancelled = true;
    };
  }, [slug, pageKey, canonical, title, description, fallbackTitle, fallbackDescription]);
}

// --- Helpers ---

function applyMeta(name, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function applyOGMeta(property, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function applyCanonical(href) {
  if (!href) return;
  let formatted = href.startsWith('http') ? href : `https://roomhy.com${href.startsWith('/') ? href : '/' + href}`;
  // Strip trailing slashes except for root https://roomhy.com/
  if (formatted !== 'https://roomhy.com/' && formatted !== 'https://roomhy.com') {
    formatted = formatted.replace(/\/+$/, '');
  }
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = formatted;
}

