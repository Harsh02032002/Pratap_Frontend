import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { mkdirSync, readFileSync } from 'fs';
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
export default defineConfig({
  plugins: [
    adminServerPlugin,   // ← must be FIRST so it intercepts before Vite's HTML serving
    react(),
    ...(process.env.ANALYZE ? [visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
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

    // Multi-page: main Roomhy app + admin sub-app served from same Vite
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-utils': ['axios', '@supabase/supabase-js'],
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
});

