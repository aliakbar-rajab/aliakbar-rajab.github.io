import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  address,
  officeCoordinates,
  phones,
  postalCode,
} from "../app/contact-data.ts";

const SITE_URL = "https://fouladbonyan.com";
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

function buildContactJsonLd() {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "بنیان فولاد داریا",
    url: PAGE_URL,
    telephone: phones.map((phone) => phone.href.replace("tel:", "")),
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "تهران",
      postalCode,
      addressCountry: "IR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: officeCoordinates.lat,
      longitude: officeCoordinates.lng,
    },
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function buildContactHtml(baseHtml) {
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${PAGE_URL}$2`);

  html = replaceTagContent(html, 'name="description"', DESCRIPTION);
  html = replaceTagContent(html, 'property="og:title"', TITLE);
  html = replaceTagContent(html, 'property="og:description"', DESCRIPTION);
  html = replaceTagContent(html, 'property="og:url"', PAGE_URL);
  html = replaceTagContent(html, 'name="twitter:title"', TITLE);
  html = replaceTagContent(html, 'name="twitter:description"', DESCRIPTION);

  html = html.replace(
    '<div id="root"></div>',
    '<div id="root" data-page="contact"></div>',
  );

  return html.replace("</head>", `${buildContactJsonLd()}\n  </head>`);
}

async function addContactUrlToSitemap() {
  const sitemapPath = resolve(distDir, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");
  const today = new Date().toISOString().slice(0, 10);

  const entry = `  <url>
    <loc>${PAGE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

  await writeFile(
    sitemapPath,
    sitemap.replace("</urlset>", `${entry}\n</urlset>`),
    "utf8",
  );
}

const baseHtml = await readFile(resolve(distDir, "index.html"), "utf8");
const outDir = resolve(distDir, "contact");
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "index.html"), buildContactHtml(baseHtml), "utf8");

await addContactUrlToSitemap();

console.log("تولید صفحه‌ی تماس با ما و بروزرسانی sitemap با موفقیت انجام شد.");
