import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const outputDirectory = resolve("dist/client");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "Akis";
const basePath = `/${repositoryName}`;
const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".svg", ".txt"]);
const rootAssets = ["/_next/", "/images/", "/games/", "/audio/"];
const rootFiles = ["/favicon.svg", "/file.svg", "/globe.svg", "/window.svg"];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }
  return files;
}

for (const file of await collectFiles(outputDirectory)) {
  if (!textExtensions.has(extname(file))) continue;
  let source = await readFile(file, "utf8");
  for (const asset of rootAssets) {
    source = source.split(asset).join(`${basePath}${asset}`);
  }
  for (const asset of rootFiles) {
    source = source.split(asset).join(`${basePath}${asset}`);
  }
  await writeFile(file, source, "utf8");
}

await writeFile(join(outputDirectory, ".nojekyll"), "", "utf8");
console.log(`GitHub Pages files prepared for ${basePath}/`);

