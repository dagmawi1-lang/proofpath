import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// /api requests are proxied to the optional coach server (npm run server) during development.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
  preview: { port: 4173, proxy: { '/api': 'http://localhost:8787' } },
});
