import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

function copyIndexTo404() {
  return {
    name: "copy-index-to-404",
    closeBundle() {
      try {
        const distPath = path.resolve(__dirname, "dist");
        const indexPath = path.resolve(distPath, "index.html");
        const notFoundPath = path.resolve(distPath, "404.html");
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
        }
      } catch (err) {
        console.warn("Could not copy index.html to 404.html:", err);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyIndexTo404()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
