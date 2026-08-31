import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changed vendor code out of the main bundle so a
        // typical route load doesn't pull in PDF/DOCX/OCR/chart tooling upfront.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/](pdfjs-dist|jspdf|docx|file-saver)[\\/]/.test(id)) return "vendor-pdf";
          if (/[\\/]recharts[\\/]/.test(id)) return "vendor-charts";
          if (/[\\/]@radix-ui[\\/]/.test(id)) return "vendor-radix";
          if (/[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) return "vendor-react";
        },
      },
    },
  },
}));
