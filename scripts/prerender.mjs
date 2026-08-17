import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const outputDirectory = resolve("dist/client");
const workerUrl = pathToFileURL(resolve("dist/server/index.js"));
workerUrl.searchParams.set("prerender", Date.now().toString());
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("https://azou.netlify.app/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) throw new Error(`Prerender failed with status ${response.status}`);

await mkdir(outputDirectory, { recursive: true });
const html = (await response.text()).replace(
  /(<meta name="viewport" content=")([^"]*)("\/>)/,
  (_, before, content, after) =>
    `${before}${content.includes("viewport-fit=cover") ? content : `${content}, viewport-fit=cover`}${after}`,
);
await writeFile(resolve(outputDirectory, "index.html"), html, "utf8");
await writeFile(resolve(outputDirectory, "_redirects"), "/* /index.html 200\n", "utf8");
console.log("Static Netlify entry generated: dist/client/index.html");

