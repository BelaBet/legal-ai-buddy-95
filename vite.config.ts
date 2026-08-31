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
    // Keep the warning useful while allowing the largest vendor chunk to exist.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("pdfjs-dist")) return "pdfjs";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("jspdf")) return "pdf-export";
          if (id.includes("recharts")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix-ui";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) return "react-vendor";

          return "vendor";
        },
      },
    },
  },
}));
