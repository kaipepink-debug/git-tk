import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { existsSync, readFileSync, statSync } from "node:fs";
import { componentTagger } from "lovable-tagger";

// Serve uploaded Lovable assets in the local preview, where the CDN route isn't mounted.
const localAssetFallback = () => ({
  name: "local-asset-fallback",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use("/__l5e/assets-v1", (req, res, next) => {
      const pathname = decodeURIComponent((req.url || "").split("?")[0]);
      if (!/^\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/.test(pathname)) return next();
      const file = path.join(__dirname, "public/__l5e/assets-v1", pathname);
      if (!existsSync(file) || !statSync(file).isFile()) return next();
      const extension = path.extname(file).toLowerCase();
      const types: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
      res.setHeader("Content-Type", types[extension] || "application/octet-stream");
      res.end(readFileSync(file));
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "development" && localAssetFallback()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
