import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Five pages, one build:
//   ielts-self-study/index.html            -> https://upwind.asia/ielts-self-study/
//   ielts-foundation/index.html            -> https://upwind.asia/ielts-foundation/ (4.0 -> 5.5)
//   Intensive-Writing-Speaking/index.html  -> https://upwind.asia/Intensive-Writing-Speaking/
//   ebook/hoc-tu-tu-goc/index.html          -> https://upwind.asia/ebook/hoc-tu-tu-goc/ (flip-book reader)
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
        ebook: path.resolve(import.meta.dirname, "ebook/hoc-tu-tu-goc/index.html"),
        greenFinance: path.resolve(import.meta.dirname, "test/green-finance/index.html"),
        ielts: path.resolve(import.meta.dirname, "ielts-self-study/index.html"),
        ieltsFoundation: path.resolve(import.meta.dirname, "ielts-foundation/index.html"),
        intensive: path.resolve(import.meta.dirname, "Intensive-Writing-Speaking/index.html"),
      },
    },
  },
});
