import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web app lives in web/. In dev, /api is proxied to the Node server on 8303.
// For a static build set VITE_API_URL to wherever the server runs.
export default defineConfig({
  root: 'web',
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5303,
    strictPort: true,
    proxy: { '/api': 'http://localhost:8303' }
  },
  preview: { port: 5303, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true }
});
