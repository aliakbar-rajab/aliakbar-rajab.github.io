import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

const readDist = (path) =>
  readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");

test("production output contains required GitHub Pages files", async () => {
  await Promise.all(
    [
      "index.html",
      "404.html",
      "robots.txt",
      "sitemap.xml",
      "manifest.webmanifest",
      "fonts/b-titr-bold.woff",
      "preloader/fb-preloader.js",
      "preloader/assets/tr2.mp4",
      "categories/hero-rebar-1680.jpg",
      "categories/hero-beam-1680.jpg",
      "categories/hero-sheet-1680.jpg",
    ].map((path) => access(new URL(`../dist/${path}`, import.meta.url))),
  );
});

test("built HTML uses root-safe assets and production metadata", async () => {
  const html = await readDist("index.html");
  assert.match(html, /lang="fa" dir="rtl"/);
  assert.match(html, /https:\/\/aliakbar-rajab\.github\.io\//);
  assert.match(html, /\/assets\/[^"]+\.js/);
  assert.match(html, /\/preloader\/fb-preloader\.js/);
  assert.doesNotMatch(html, /localhost|pages-dist|_next/);
});

test("built JavaScript has no external image or fake form dependency", async () => {
  const html = await readDist("index.html");
  const asset = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  assert.ok(asset, "Vite JavaScript asset was not linked");
  const javascript = await readDist(asset.slice(1));
  assert.doesNotMatch(javascript, /images\.pexels\.com|submitQuote|VITE_LEAD_ENDPOINT/);
  assert.match(javascript, /BONYAN FOULAD DARIA/);
  assert.match(javascript, /قیمت هاش/);
  assert.match(javascript, /کارخانه‌های تیرآهن/);
});

test("large live catalogs are split out of the initial JavaScript", async () => {
  const html = await readDist("index.html");
  const mainAsset = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  assert.ok(mainAsset);
  const assetsUrl = new URL("../dist/assets/", import.meta.url);
  const javascriptFiles = (await readdir(assetsUrl)).filter((file) =>
    file.endsWith(".js"),
  );
  const mainStats = await stat(
    new URL(`../dist/${mainAsset.slice(1)}`, import.meta.url),
  );
  assert.ok(
    mainStats.size < 500_000,
    `initial JavaScript is ${mainStats.size.toLocaleString()} bytes`,
  );
  assert.ok(javascriptFiles.length >= 4);
  const lazyJavaScript = (
    await Promise.all(
      javascriptFiles
        .filter((file) => !mainAsset.endsWith(file))
        .map((file) => readDist(`assets/${file}`)),
    )
  ).join("\n");
  assert.match(lazyJavaScript, /ورق ضد سایش/);
  assert.match(lazyJavaScript, /پروفیل صنعتی/);
  assert.match(lazyJavaScript, /لوله مانیسمان/);
  assert.match(lazyJavaScript, /توری حصاری/);
});
