import { useEffect, useState } from 'react';
import { getApiBase } from '../../utils/api';

export default function SitemapViewer() {
  const [xmlContent, setXmlContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSitemap() {
      try {
        let res = await fetch(`${getApiBase()}/api/seo/sitemap.xml`);
        if (!res.ok) {
          res = await fetch('/sitemap.xml');
        }
        const text = await res.text();
        setXmlContent(text);
      } catch (err) {
        try {
          const res = await fetch('/sitemap.xml');
          const text = await res.text();
          setXmlContent(text);
        } catch (_) {
          setXmlContent('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://roomhy.com/</loc></url></urlset>');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        Loading sitemap.xml...
      </div>
    );
  }

  return (
    <pre style={{
      padding: '20px',
      margin: 0,
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'monospace',
      fontSize: '13px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      minHeight: '100vh'
    }}>
      {xmlContent}
    </pre>
  );
}
