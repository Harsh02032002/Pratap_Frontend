import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { queryClient } from './lib/queryClient';
import './index.css';

// A previously installed Workbox worker calls createHandlerBoundToURL("index.html")
// even though HTML is not precached. That rejected promise intercepts navigations
// and makes the employee panel jump between pages. Dev does not register a worker
// (vite devOptions.enabled = false), so drop any leftover sw.js. Firebase messaging
// keeps its own worker.
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      const script = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
      if (/\/sw\.js|\/dev-sw\.js|workbox/i.test(script)) reg.unregister();
    });
  }).catch(() => {});
}

// React Query handles server-state caching in the background. (No devtools
// overlay — caching does not need it.)
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
