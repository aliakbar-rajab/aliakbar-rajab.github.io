import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { productGroups } from "../app/category-meta.ts";

const SITE_URL = "https://fouladbonyan.com";
const distDir = resolve(import.meta.dirname, "..", "dist");
const dataDir = resolve(import.meta.dirname, "..", "app", "data");

// Prices in app/data/*.json are quoted in Toman, but schema.org's
// priceCurrency is an ISO 4217 code and Iran's is IRR (rial) -- 1 Toman
// equals 10 Rials, so amounts are converted before going into JSON-LD.
const TOMAN_TO_RIAL = 10;

const readJson = (path) => readFile(path, "utf8").then(JSON.parse);

async function loadPriceRanges() {
  const [rebar, beam, products] = await Promise.all([
    readJson(resolve(dataDir, "rebar-prices.json")),
    readJson(resolve(dataDir, "beam-prices.json")),
    readJson(resolve(dataDir, "product-prices.json")),
  ]);

  // Each group covers several sub-categories that can be wildly different
  // products (e.g. rebar's "stainless" sub-category costs ~20x plain rebar),
  // so a min/max across all of them would be a misleadingly huge range.
  // Only the one sub-category the page actually opens on by default is used.
  const ranges = new Map();
  const addRange = (id, category) => {
    const summary = category?.summary;
    if (!summary || summary.max <= 0) return;
    const rowCount =
      category.factories?.reduce(
        (total, factory) => total + (factory.rows?.length ?? 0),
        0,
      ) || 1;
    ranges.set(id, {
      lowPrice: summary.min,
      highPrice: summary.max,
      offerCount: rowCount,
    });
  };

  addRange(
    "rebar",
    rebar.categories.find((category) => category.id === "ribbed"),
  );
  addRange(
    "beam",
    beam.categories.find((category) => category.id === "beam"),
  );
  for (const catalog of products.catalogs) {
    addRange(
      catalog.id,
      catalog.categories.find(
        (category) => category.id === catalog.initialCategoryId,
      ),
    );
  }
  return ranges;
}

function buildProductJsonLd(group, range) {
  if (!range) return "";
  const payload = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: group.label,
    description: group.description,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice: range.lowPrice * TOMAN_TO_RIAL,
      highPrice: range.highPrice * TOMAN_TO_RIAL,
      offerCount: range.offerCount,
      availability: "https://schema.org/InStock",
    },
  };
  return `\n    <script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

const replaceTagContent = (html, attrMatcher, value) =>
  html.replace(
    new RegExp(`(<meta[^>]*?${attrMatcher}[^>]*?content=")[^"]*(")`),
    `$1${value}$2`,
  );

function buildCategoryHtml(baseHtml, group, priceRange) {
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

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root" data-initial-category="${group.id}"></div>`,
  );

  return html.replace("</head>", `${buildProductJsonLd(group, priceRange)}\n  </head>`);
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

const [baseHtml, priceRanges] = await Promise.all([
  readFile(resolve(distDir, "index.html"), "utf8"),
  loadPriceRanges(),
]);

await Promise.all(
  productGroups.map(async (group) => {
    const outDir = resolve(distDir, group.id);
    await mkdir(outDir, { recursive: true });
    await writeFile(
      resolve(outDir, "index.html"),
      buildCategoryHtml(baseHtml, group, priceRanges.get(group.id)),
      "utf8",
    );
  }),
);

await addCategoryUrlsToSitemap();

console.log(
  `تولید ${productGroups.length} صفحه‌ی فرود دسته‌بندی محصولات و بروزرسانی sitemap با موفقیت انجام شد.`,
);
