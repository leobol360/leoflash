import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// dist/index.html has all JS + CSS (and the ~3000-word deck) inlined, so
// it runs offline with a double-click — no server. The only extra files
// in dist/ are the home-screen icons, web manifest and sw.js (the minimal
// service worker that makes the app installable), copied from public/.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  server: { port: 4173, strictPort: true, open: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: "dist", sourcemap: false, chunkSizeWarningLimit: 4000 },
});
