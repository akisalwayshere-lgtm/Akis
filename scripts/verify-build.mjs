import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
const netlify = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");

assert.match(html, /<title>阿走｜医学生与 AI 探索者<\/title>/);
assert.match(html, /这里是阿走/);
assert.match(html, /Akis/);
assert.match(html, /akis-medical-avatar-v2\.webp/);
assert.doesNotMatch(html, /akis-medical-avatar-v2\.png/);
assert.match(html, /name="viewport"/);
assert.match(html, /viewport-fit=cover/);
assert.match(html, /<script[^>]+type="module"[^>]+async/);
assert.match(html, /医学与科研/);
assert.match(html, /在医学与[\s\S]*AI 之间持续探索/);
assert.doesNotMatch(html, /医学、影像与/);
assert.match(html, /mailto:2942997834@qq\.com/);
assert.doesNotMatch(html, />2942997834@qq\.com</);
assert.match(netlify, /publish = "dist\/client"/);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const avatar = await stat(new URL("../public/images/akis-medical-avatar-v2.webp", import.meta.url));
assert.match(pageSource, /loading="lazy"/);
assert.ok(avatar.size < 200_000, `Hero WebP is too large: ${avatar.size} bytes`);
assert.match(css, /@keyframes title-float/);
assert.match(css, /@keyframes title-bump/);
console.log("Netlify build and core content checks passed.");

