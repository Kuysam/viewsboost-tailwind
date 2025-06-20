import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core (high priority, loaded first)
          if (id.includes('react') && !id.includes('react-')) {
            return 'react-vendor';
          }
          
          // React ecosystem
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // Firebase (large, can be lazy loaded)
          if (id.includes('firebase')) {
            return 'firebase-vendor';
          }
          
          // UI Libraries (can be code-split)
          if (id.includes('framer-motion')) {
            return 'ui-vendor';
          }
          if (id.includes('react-icons') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          
          // Chart Libraries (heavy, only loaded when needed)
          if (id.includes('chart.js') || id.includes('recharts')) {
            return 'chart-vendor';
          }
          
          // Media Libraries (loaded on demand)
          if (id.includes('react-youtube') || id.includes('react-swipeable')) {
            return 'media-vendor';
          }
          
          // Form and Utils (smaller, can be grouped)
          if (id.includes('react-hook-form') || id.includes('react-firebase-hooks') || 
              id.includes('axios') || id.includes('uuid') || id.includes('dompurify')) {
            return 'utils-vendor';
          }
          
          // Admin Panel (large component, rarely accessed)
          if (id.includes('src/pages/AdminPanel')) {
            return 'admin-chunk';
          }
          
          // Studio Components (large, loaded on demand)
          if (id.includes('src/pages/Studio') || id.includes('src/pages/TemplateImporter')) {
            return 'studio-chunk';
          }
          
          // Live Streaming Components (specialized, loaded when needed)
          if (id.includes('src/pages/Live') || id.includes('src/pages/live/') || 
              id.includes('src/pages/studio/Live') || id.includes('src/pages/studio/Room')) {
            return 'live-chunk';
          }
          
          // Video Components (loaded when viewing videos)
          if (id.includes('src/pages/VideoWatchPage') || id.includes('src/pages/Shorts')) {
            return 'video-chunk';
          }
          
          // Analytics Services (loaded with admin/analytics)
          if (id.includes('src/lib/services/templateAnalyticsService') || 
              id.includes('src/lib/services/activityMonitoringService') || 
              id.includes('src/lib/services/youtubeQuotaService')) {
            return 'analytics-chunk';
          }
          
          // Large vendor libraries should be separated
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
    // Enable source maps for better debugging
    sourcemap: true
  },
  // Enhanced dev server with auto-refresh
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true, // Show errors in overlay
      port: 24678,   // Use dedicated HMR port
    },
    watch: {
      usePolling: true,           // Better file watching on all systems
      interval: 100,              // Check every 100ms
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    // Auto-restart on these file changes
    restart: [
      '.env',
      '.env.local', 
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'package.json'
    ]
  },
  // Enable code splitting optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'react-firebase-hooks/auth'
    ],
    exclude: [
      'chart.js',
      'react-chartjs-2',
      'recharts',
      'framer-motion'
    ]
  },
  // Handle ESM/CommonJS compatibility
  define: {
    global: 'globalThis',
  }
})
