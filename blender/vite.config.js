import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { target: 'esnext', chunkSizeWarningLimit: 1200 },
});
