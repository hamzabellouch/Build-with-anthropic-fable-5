import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // the bundled sync server (`npm run server`) — keeps /api same-origin in dev
      "/api": "http://localhost:4870",
    },
  },
});
