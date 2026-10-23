import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Three pages, one build:
//   ielts-self-study/index.html            -> https://upwind.asia/ielts-self-study/
//   Intensive-Writing-Speaking/index.html  -> https://upwind.asia/Intensive-Writing-Speaking/
//   test/green-finance/index.html          -> https://upwind.asia/test/green-finance/
// "/" redirects to /ielts-self-study/ (public/_redirects).
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        greenFinance: path.resolve(import.meta.dirname, "test/green-finance/index.html"),
        ielts: path.resolve(import.meta.dirname, "ielts-self-study/index.html"),
        intensive: path.resolve(import.meta.dirname, "Intensive-Writing-Speaking/index.html"),
      },
    },
  },
});
