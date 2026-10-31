#!/usr/bin/env node
// Copies only the Tabler icons we use (https://tabler.io/icons, MIT) into assets/icons/.
// Run it after adding families or changing `icon` names:  node fetch-icons.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT_DIR, loadFamilies, ensureDir } from "./lib/common.mjs";
import { UI_ICONS } from "./lib/icons.mjs";

const names = new Set(Object.values(UI_ICONS));
for (const f of loadFamilies()) {
  if (f.icon) names.add(f.icon);
  for (const w of f.words) if (w.icon) names.add(w.icon);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tabler-"));
console.log("Downloading @tabler/icons ...");
const tgz = execFileSync("npm", ["pack", "@tabler/icons", "--silent"], { cwd: tmp }).toString().trim().split("\n").pop();
execFileSync("tar", ["xzf", tgz], { cwd: tmp });
const src = path.join(tmp, "package", "icons", "outline");
const dest = path.join(ROOT_DIR, "assets", "icons");
ensureDir(dest);

const missing = [];
for (const n of [...names].sort()) {
  const file = path.join(src, `${n}.svg`);
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(dest, `${n}.svg`));
  else missing.push(n);
}
fs.copyFileSync(path.join(tmp, "package", "LICENSE"), path.join(dest, "LICENSE"));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${names.size - missing.length} icons in assets/icons`);
if (missing.length) {
  console.error(`✗ not in Tabler: ${missing.join(", ")}. Pick names from https://tabler.io/icons`);
  process.exit(1);
}
