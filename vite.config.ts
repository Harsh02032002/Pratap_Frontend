import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { copyFileSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';

// Fix: Windows pe jiti tries to write cache to %TEMP%/node-jiti/ but the
// directory may not exist, causing ENOENT crash. Create it proactively.
try { mkdirSync(path.join(tmpdir(), 'node-jiti'), { recursive: true }); } catch {}



const adminHtmlPath = path.resolve(__dirname, 'admin.html');

// Plugin: serve admin.html for all /admin* routes in dev server
const adminServerPlugin = {
  name: 'admin-html-server',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = (req.url || '').split('?')[0];
      const isAdminRoute = url === '/admin' || url.startsWith('/admin/');
      const isAsset = /\.\w{1,10}$/.test(url) || url.startsWith('/@') || url.startsWith('/__');

      if (isAdminRoute && !isAsset) {
        try {
          const rawHtml = readFileSync(adminHtmlPath, 'utf-8');
          const html = await server.transformIndexHtml(req.url || '/admin', rawHtml);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.statusCode = 200;
          res.end(html);
          return;
        } catch (e) {
          console.error('[admin] Failed to serve admin.html:', e);
        }
      }
      next();
    });
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const target = process.env.BUILD_TARGET || mode;
  const outDir = target === 'website'
    ? 'dist/website'
    : target === 'superadmin'
    ? 'dist/superadmin'
    : target === 'propertyowner'
    ? 'dist/propertyowner'
    : 'dist';

  const htmlTitlePlugin = {
    name: 'html-target-customizer',
    transformIndexHtml(html: string) {
      if (target === 'superadmin') {
        return html
          .replace(/<title>.*?<\/title>/, '<title>RoomHy - Super Admin Panel</title>')
          .replace('</head>', '  <meta name="roomhy-app-target" content="superadmin" />\n  </head>');
      }
      if (target === 'propertyowner') {
        return html
          .replace(/<title>.*?<\/title>/, '<title>RoomHy - Property Owner Panel</title>')
          .replace('</head>', '  <meta name="roomhy-app-target" content="propertyowner" />\n  </head>');
      }
      if (target === 'website') {
        return html
          .replace(/<title>.*?<\/title>/, '<title>Top PGs, Hostels & Co-living in India | Roomhy.com</title>')
          .replace('</head>', '  <meta name="roomhy-app-target" content="website" />\n  </head>');
      }
      return html;
    }
  };

  return {
    plugins: [
      htmlTitlePlugin,
      react(),
      ...(process.env.ANALYZE ? [visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        // Disable the service worker in development — it intercepts F5 requests
        // and returns stale cached responses, making it impossible to see changes
        // without a hard refresh. In production the SW is enabled with a
        // NetworkFirst strategy for HTML navigation to avoid this problem.
        devOptions: {
          enabled: false
        },
        workbox: {
          // Skip waiting so the new SW activates immediately after update,
          // without requiring the user to close all tabs.
          skipWaiting: true,
          // Claim all open clients immediately so the new SW controls the page.
          clientsClaim: true,
          // Navigation (HTML page) requests always go to the network first.
          // Falls back to the cached index.html only if the network is offline.
          // This ensures F5 always loads a fresh index.html from the server.
          navigationPreload: false,
          runtimeCaching: [
            {
              // All navigation requests (page loads, F5) → network first
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'navigation-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxAgeSeconds: 24 * 60 * 60, // 1 day fallback only
                },
              },
            },
            {
              // Hashed JS/CSS/image assets — safe to cache long-term because
              // filenames contain a content hash and change on every deploy.
              urlPattern: /\/assets\/(js|css|images)\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-assets-cache',
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                  maxEntries: 100,
                },
              },
            },
          ],
          // Never precache index.html — always fetch from network on F5.
          globPatterns: ['**/*.{js,css,png,jpg,webp,svg,ico,woff2}'],
          // Exclude HTML from precache so the SW never serves stale pages.
          globIgnores: ['**/*.html'],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Roomhy Property Owner',
          short_name: 'Roomhy',
          description: 'Manage your PG properties with Roomhy',
          theme_color: '#2563eb',
          background_color: '#0f172a',
          display: 'standalone',
          id: '/propertyowner/app',
          start_url: '/propertyowner/admin',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      }),
    ],

    // @ alias points to src/admin — used by admin sub-app imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/admin'),
      },
    },

    // Build optimizations
    build: {
      modulePreload: false,
      outDir,
      target: 'es2020',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        },
        mangle: { safari10: true },
        format: { comments: false },
      },

      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: (id) => {
            // Main website vendor
            if (id.includes('react-router-dom')) return 'vendor-router';
            // Exact package match. The old `id.includes('react')` also caught
            // every package with "react" in its path (@radix-ui/react-*,
            // emoji-picker-react, react-hot-toast, …) and shipped them all in
            // the vendor chunk every website page loads.
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            // lucide-react is intentionally NOT forced into one chunk any more.
            // A few admin pages look icons up by name (`LucideIcons[key]`), which
            // keeps all ~1,400 icons; with a single 'vendor-icons' chunk the
            // website downloaded all of them too. Left to Rollup, each page only
            // gets the icons it actually uses.
            if (id.includes('leaflet')) return 'vendor-maps';
            if (id.includes('axios') || id.includes('@supabase')) return 'vendor-utils';

            // Admin panel — keep in own chunks so main site stays lean
            if (id.includes('@tanstack/react-router')) return 'admin-router';
            if (id.includes('@tanstack/react-query')) return 'admin-query';
            if (id.includes('@radix-ui')) return 'admin-radix';
            if (id.includes('cmdk') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('sonner')) return 'admin-ui';
            if (id.includes('src/admin')) return 'admin-app';
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (ext === 'css') return 'assets/css/[name]-[hash][extname]';
            return 'assets/[name]-[hash][extname]';
          },
        },
      },

      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 500,
      reportCompressedSize: true,
    },

    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-router-dom', 'lucide-react',
        // Admin panel heavy deps — pre-bundle for fast load
        '@tanstack/react-router', '@tanstack/react-query',
        '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-select', '@radix-ui/react-tooltip',
        '@radix-ui/react-slot', 'cmdk', 'class-variance-authority',
        'clsx', 'tailwind-merge', 'sonner',
      ],
      exclude: ['leaflet'],
    },

    server: {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      // Forward /api/* to backend in dev
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

