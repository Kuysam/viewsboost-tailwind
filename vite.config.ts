import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Pre-bundling tweaks
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-firebase-hooks/auth',
    ],
    // Avoid pre-bundling these to sidestep the IndexedDB init issue
    exclude: ['idb', 'wrap-idb-value', 'chart.js', 'react-chartjs-2', 'recharts', 'framer-motion'],
  },

  build: {
    // If you keep this, install terser:  npm i -D terser
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core (load first)
          if (id.includes('react') && !id.includes('react-')) return 'react-vendor'
          // React ecosystem
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
          // Firebase (large)
          if (id.includes('firebase')) return 'firebase-vendor'
          // UI libs
          if (id.includes('framer-motion')) return 'ui-vendor'
          if (id.includes('react-icons') || id.includes('lucide-react')) return 'ui-vendor'
          // Charts
          if (id.includes('chart.js') || id.includes('recharts')) return 'chart-vendor'
          // Media
          if (id.includes('react-youtube') || id.includes('react-swipeable')) return 'media-vendor'
          // Forms / utils
          if (
            id.includes('react-hook-form') ||
            id.includes('react-firebase-hooks') ||
            id.includes('axios') ||
            id.includes('uuid') ||
            id.includes('dompurify')
          ) return 'utils-vendor'
          // App-specific large chunks (adjust paths to your project structure)
          if (id.includes('src/pages/AdminPanel')) return 'admin-chunk'
          if (id.includes('src/pages/Studio') || id.includes('src/pages/TemplateImporter')) return 'studio-chunk'
          if (
            id.includes('src/pages/Live') ||
            id.includes('src/pages/live/') ||
            id.includes('src/pages/studio/Live') ||
            id.includes('src/pages/studio/Room')
          ) return 'live-chunk'
          if (id.includes('src/pages/VideoWatchPage') || id.includes('src/pages/Shorts')) return 'video-chunk'
          if (
            id.includes('src/lib/services/templateAnalyticsService') ||
            id.includes('src/lib/services/activityMonitoringService') ||
            id.includes('src/lib/services/youtubeQuotaService')
          ) return 'analytics-chunk'

          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },

  server: {
    host: true,
    port: 5173,
    hmr: { overlay: true, port: 24678 },
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
  },

  // ESM/CommonJS compat
  define: {
    global: 'globalThis',
  },
})
