import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Two pages, one build:
//   index.html                  -> https://upwind.asia/
//   ielts-self-study/index.html -> https://upwind.asia/ielts-self-study/
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
        main: path.resolve(import.meta.dirname, "index.html"),
        ielts: path.resolve(import.meta.dirname, "ielts-self-study/index.html"),
      },
    },
  },
});
