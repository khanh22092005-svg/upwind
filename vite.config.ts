import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Every ebook/<slug>/index.html is a flip-book page (added by tools/ebook/add-ebook.mjs).
const ebooks = Object.fromEntries(
  fs
    .readdirSync(path.resolve(import.meta.dirname, "ebook"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.resolve(import.meta.dirname, "ebook", d.name, "index.html")))
    .map((d) => [`ebook-${d.name}`, path.resolve(import.meta.dirname, "ebook", d.name, "index.html")]),
);

// Pages, one build:
//   ielts-self-study/index.html            -> https://upwind.asia/ielts-self-study/
//   ielts-foundation/index.html            -> https://upwind.asia/ielts-foundation/ (4.0 -> 5.5)
//   Intensive-Writing-Speaking/index.html  -> https://upwind.asia/Intensive-Writing-Speaking/
//   ebook/<slug>/index.html                -> https://upwind.asia/ebook/<slug>/ (flip-book readers, found automatically)
//   goc-tu/index.html                      -> https://upwind.asia/goc-tu/ (interactive version of the ebook)
//   test/green-finance/index.html          -> https://upwind.asia/test/green-finance/
// "/" redirects to /ielts-self-study/ (public/_redirects).
// `import x from "./file.json?fields=a,b"` keeps only those top-level keys, so a page that needs a few
// fields of a large data file doesn't ship all of it (used by src/goc-tu for the ebook units).
function jsonFields(): Plugin {
  const PREFIX = "\0json-fields:";
  return {
    name: "json-fields",
    enforce: "pre",
    async resolveId(source, importer) {
      const [spec, query] = source.split("?");
      if (!query?.includes("fields=") || !spec.endsWith(".json")) return;
      const resolved = await this.resolve(spec, importer, { skipSelf: true });
      // no ".json" in the virtual id, or vite:json would try to parse the generated module
      return resolved && PREFIX + resolved.id.replace(/\.json$/, ".json-fields") + "?" + query;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return;
      const [virtual, query] = id.slice(PREFIX.length).split("?");
      const file = virtual.replace(/\.json-fields$/, ".json");
      const fields = new URLSearchParams(query).get("fields")!.split(",");
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      this.addWatchFile(file);
      return `export default ${JSON.stringify(Object.fromEntries(fields.filter((k) => k in data).map((k) => [k, data[k]])))};`;
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [jsonFields(), react(), tailwindcss()],
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
        ...ebooks,
        gocTu: path.resolve(import.meta.dirname, "goc-tu/index.html"),
        greenFinance: path.resolve(import.meta.dirname, "test/green-finance/index.html"),
        ielts: path.resolve(import.meta.dirname, "ielts-self-study/index.html"),
        ieltsFoundation: path.resolve(import.meta.dirname, "ielts-foundation/index.html"),
        intensive: path.resolve(import.meta.dirname, "Intensive-Writing-Speaking/index.html"),
      },
    },
  },
});
