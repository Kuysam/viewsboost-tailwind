import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['idb', 'wrap-idb-value'] },
  build: { target: 'es2020', minify: 'esbuild', sourcemap: false }
});
