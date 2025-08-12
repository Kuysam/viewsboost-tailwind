// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },

  // Avoid prebundling IDB wrappers (prevents Firebase IndexedDB init issues)
  optimizeDeps: {
    exclude: ['idb', 'wrap-idb-value'],
  },

  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
  },

  // Helpful locally; safe defaults
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },

  // Some libs expect a Node-like global
  define: {
    global: 'globalThis',
  },
})
