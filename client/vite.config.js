import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The client talks directly to the Express server over real HTTP
// (http://localhost:5000/api) so that every request/response can be
// inspected in Chrome DevTools -> Network. No proxy is used on purpose.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
