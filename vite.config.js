import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// The production build is a SINGLE self-contained dist/index.html
// (JS + CSS inlined). It runs offline with a double-click — no server —
// because everything, including the ~3000-word deck, is bundled in.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  server: { port: 4173, strictPort: true, open: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: "dist", sourcemap: false, chunkSizeWarningLimit: 4000 },
});
