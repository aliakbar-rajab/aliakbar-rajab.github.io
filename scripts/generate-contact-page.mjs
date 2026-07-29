import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { infoPageDefinitions } from "../app/info-page-data.ts";
import {
  buildOrganizationStructuredData,
  siteConfig,
} from "../app/site-config.ts";

const SITE_URL = siteConfig.siteUrl;
const PAGE_URL = `${SITE_URL}/contact/`;
const distDir = resolve(import.meta.dirname, "..", "dist");

const TITLE = "تماس با ما و نشانی | بنیان فولاد داریا";
const DESCRIPTION =
  "شماره‌های تماس، نشانی دفتر و مسیریابی روی نقشه برای بنیان فولاد داریا. تماس با واحد فروش و مدیریت برای استعلام قیمت آهن و فولاد.";

const replaceTagContent = (html, attrMatcher, value) =>
  html.replace(
    new RegExp(`(<meta[^>]*?${attrMatcher}[^>]*?content=")[^"]*(")`),
    `$1${value}$2`,
  );

function buildPageHtml(baseHtml, { page, title, description, pageUrl }) {
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${pageUrl}$2`);

  html = replaceTagContent(html, 'name="description"', description);
  html = replaceTagContent(html, 'property="og:title"', title);
  html = replaceTagContent(html, 'property="og:description"', description);
  html = replaceTagContent(html, 'property="og:url"', pageUrl);
  html = replaceTagContent(html, 'name="twitter:title"', title);
  html = replaceTagContent(html, 'name="twitter:description"', description);

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root" data-page="${page}"></div>`,
  );

  return html;
}

async function addInformationUrlsToSitemap(pageEntries) {
  const sitemapPath = resolve(distDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");
  const today = new Date().toISOString().slice(0, 10);

  const entries = pageEntries
    .filter(({ pageUrl }) => !sitemap.includes(`<loc>${pageUrl}</loc>`))
    .map(
      ({ pageUrl }) => `  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("\n");

  await writeFile(
    sitemapPath,
    sitemap.replace("</urlset>", `${entries}\n</urlset>`),
    "utf8",
  );
}

async function injectOrganizationData(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await injectOrganizationData(entryPath);
        return;
      }
      if (entry.name !== "index.html") return;

      const html = await readFile(entryPath, "utf8");
      const relativePath = entryPath
        .slice(distDir.length)
        .replaceAll("\\", "/")
        .replace(/index\.html$/, "");
      const pageUrl = new URL(relativePath || "/", `${SITE_URL}/`).toString();
      const payload = JSON.stringify(buildOrganizationStructuredData(pageUrl));
      const updated = html.replace(
        /(<script id="organization-structured-data" type="application\/ld\+json">)[\s\S]*?(<\/script>)/,
        `$1${payload}$2`,
      );
      await writeFile(entryPath, updated, "utf8");
    }),
  );
}

const baseHtml = await readFile(resolve(distDir, "index.html"), "utf8");
const pageEntries = [
  {
    page: "contact",
    title: TITLE,
    description: DESCRIPTION,
    pageUrl: PAGE_URL,
  },
  ...Object.entries(infoPageDefinitions).map(([page, definition]) => ({
    page,
    title: `${definition.title} | ${siteConfig.brand.name}`,
    description: definition.seoDescription,
    pageUrl: `${SITE_URL}/${page}/`,
  })),
];

await Promise.all(
  pageEntries.map(async (pageEntry) => {
    const outDir = resolve(distDir, pageEntry.page);
    await mkdir(outDir, { recursive: true });
    await writeFile(
      resolve(outDir, "index.html"),
      buildPageHtml(baseHtml, pageEntry),
      "utf8",
    );
  }),
);

await addInformationUrlsToSitemap(pageEntries);
await injectOrganizationData(distDir);

console.log(
  `تولید ${pageEntries.length.toLocaleString("fa-IR")} صفحه اطلاعاتی و بروزرسانی sitemap با موفقیت انجام شد.`,
);
