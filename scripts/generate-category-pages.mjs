import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { productGroups } from "../app/category-meta.ts";

const SITE_URL = "https://fouladbonyan.com";
const distDir = resolve(import.meta.dirname, "..", "dist");

const replaceTagContent = (html, attrMatcher, value) =>
  html.replace(
    new RegExp(`(<meta[^>]*?${attrMatcher}[^>]*?content=")[^"]*(")`),
    `$1${value}$2`,
  );

function buildCategoryHtml(baseHtml, group) {
  const pageUrl = `${SITE_URL}/${group.id}/`;

  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${group.seoTitle}</title>`)
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${pageUrl}$2`,
    );

  html = replaceTagContent(html, 'name="description"', group.seoDescription);
  html = replaceTagContent(html, 'property="og:title"', group.seoTitle);
  html = replaceTagContent(
    html,
    'property="og:description"',
    group.seoDescription,
  );
  html = replaceTagContent(html, 'property="og:url"', pageUrl);
  html = replaceTagContent(html, 'name="twitter:title"', group.seoTitle);
  html = replaceTagContent(
    html,
    'name="twitter:description"',
    group.seoDescription,
  );

  return html.replace(
    '<div id="root"></div>',
    `<div id="root" data-initial-category="${group.id}"></div>`,
  );
}

async function addCategoryUrlsToSitemap() {
  const sitemapPath = resolve(distDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");
  const today = new Date().toISOString().slice(0, 10);

  const entries = productGroups
    .map(
      (group) => `  <url>
    <loc>${SITE_URL}/${group.id}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("\n");

  await writeFile(
    sitemapPath,
    sitemap.replace("</urlset>", `${entries}\n</urlset>`),
    "utf8",
  );
}

const baseHtml = await readFile(resolve(distDir, "index.html"), "utf8");

await Promise.all(
  productGroups.map(async (group) => {
    const outDir = resolve(distDir, group.id);
    await mkdir(outDir, { recursive: true });
    await writeFile(
      resolve(outDir, "index.html"),
      buildCategoryHtml(baseHtml, group),
      "utf8",
    );
  }),
);

await addCategoryUrlsToSitemap();

console.log(
  `تولید ${productGroups.length} صفحه‌ی فرود دسته‌بندی محصولات و بروزرسانی sitemap با موفقیت انجام شد.`,
);
