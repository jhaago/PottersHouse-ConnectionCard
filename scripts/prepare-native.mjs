import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "www");

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of files) {
  if (existsSync(path.join(root, file))) {
    await cp(path.join(root, file), path.join(outDir, file));
  }
}

if (existsSync(path.join(root, "assets"))) {
  await cp(path.join(root, "assets"), path.join(outDir, "assets"), { recursive: true });
}

console.log("Prepared native web assets in www/");
