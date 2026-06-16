import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
    // When running the Vite-only dev server (npm run dev:client on :5173),
    // proxy API/upload calls to the Express server (npm start on :4502).
    proxy: {
      "/api": "http://localhost:4502",
      "/uploads": "http://localhost:4502",
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy/independent deps into their own chunks so they cache
        // separately and don't bloat the initial bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('gsap')) return 'gsap';
          if (id.includes('/motion/') || id.includes('framer-motion')) return 'motion';
          if (id.includes('react-router')) return 'router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
});
