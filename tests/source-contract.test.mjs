import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("brand, contact details, RTL, and palette match the approved contract", async () => {
  const [component, html, css, preloader] = await Promise.all([
    read("../app/IronDemo.tsx"),
    read("../index.html"),
    read("../app/globals.css"),
    read("../public/preloader/fb-preloader.js"),
  ]);
  const combined = `${component}\n${html}\n${preloader}`;

  assert.match(html, /<html lang="fa" dir="rtl">/);
  assert.match(combined, /بنیان فولاد داریا/);
  assert.match(combined, /BONYAN FOULAD DARIA/);
  assert.doesNotMatch(combined, /Foolad/i);
  assert.match(component, /021-88888180/);
  assert.match(component, /021-88888280/);
  assert.match(component, /021-88888122/);
  assert.match(
    component,
    /آجودانیه پورابتهاج نبش لشکری ساختمان سرو واحد ۳۰۳/,
  );
  assert.doesNotMatch(combined, /mailto:|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  assert.match(css, /--brand-yellow:\s*#f6b500/i);
  assert.match(css, /--brand-dark:\s*#3b3b3e/i);
});

test("there is no sales form or simulated lead submission", async () => {
  const [component, workflow] = await Promise.all([
    read("../app/IronDemo.tsx"),
    read("../.github/workflows/pages.yml"),
  ]);

  assert.doesNotMatch(component, /<form className="quote-form"|submitQuote|fetch\(/);
  assert.doesNotMatch(workflow, /LEAD_ENDPOINT/);
  assert.match(component, /tel:\+982188888180/);
  assert.match(
    component,
    /\(max-width: 900px\) and \(hover: none\) and \(pointer: coarse\)/,
  );
  assert.match(
    component,
    /const contactHref = isDirectCallDevice \? phones\[0\]\.href : "#phone-numbers"/,
  );
  assert.match(component, /id="phone-numbers"/);
});

test("preloader is session-scoped and fail-open", async () => {
  const [html, css, script] = await Promise.all([
    read("../index.html"),
    read("../public/preloader/fb-preloader.css"),
    read("../public/preloader/fb-preloader.js"),
  ]);

  assert.match(html, /src="\/preloader\/fb-preloader\.js"/);
  assert.doesNotMatch(html, /\son\w+=/i);
  assert.doesNotMatch(css, /#fb-site\s*\{[^}]*opacity\s*:\s*0/is);
  assert.match(script, /sessionStorage/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /window\.setTimeout\(finish,\s*8000\)/);
  assert.match(script, /video\?\.addEventListener\("error", finish/);
  assert.equal((script.match(/tr2\.mp4/g) ?? []).length, 1);
  assert.match(html, /href="\/fonts\/b-titr-bold\.woff"/);
  assert.match(css, /font-family:\s*"B Titr"/);
  assert.match(css, /url\("\/fonts\/b-titr-bold\.woff"\)/);
  assert.match(css, /\.fb-preloader__latin\s*\{[^}]*color:\s*#fff[^}]*Arial/is);
  assert.match(
    css,
    /\.fb-preloader__accent\s*\{[^}]*color:\s*#f6b500[^}]*font-size:\s*0\.75em/is,
  );
  assert.match(
    css,
    /\.fb-preloader__brand strong \.fb-preloader__accent\s*\{[^}]*font-size:\s*0\.5em/is,
  );
  assert.match(script, /<span>بنیان فولاد<\/span>/);
  assert.match(script, /class="fb-preloader__accent">داریا<\/span>/);
  assert.match(script, /<span>BONYAN FOULAD<\/span>/);
  assert.match(script, /class="fb-preloader__accent">DARIA<\/span>/);
});

test("core palette combinations meet WCAG AA contrast", () => {
  const relativeLuminance = (hex) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)
      .map((channel) => Number.parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const ratio = (foreground, background) => {
    const values = [
      relativeLuminance(foreground),
      relativeLuminance(background),
    ].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };

  assert.ok(ratio("#222226", "#F6B500") >= 4.5);
  assert.ok(ratio("#FFFFFF", "#3B3B3E") >= 4.5);
  assert.ok(ratio("#65656C", "#FFFFFF") >= 4.5);
});

test("source exposes one H1 and complete social metadata", async () => {
  const [component, html, robots, sitemap] = await Promise.all([
    read("../app/IronDemo.tsx"),
    read("../index.html"),
    read("../public/robots.txt"),
    read("../public/sitemap.xml"),
  ]);

  assert.equal((component.match(/<h1[ >]/g) ?? []).length, 1);
  for (const token of [
    'rel="canonical"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:card"',
    'type="application/ld\\+json"',
    'http-equiv="Content-Security-Policy"',
  ]) {
    assert.match(html, new RegExp(token));
  }
  assert.match(robots, /Sitemap: https:\/\/aliakbar-rajab\.github\.io\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/aliakbar-rajab\.github\.io\/<\/loc>/);
});

test("rebar prices are sourced, validated, and refreshed on a schedule", async () => {
  const [component, navigation, fetcher, workflow, priceData] = await Promise.all([
    read("../app/RebarPrices.tsx"),
    read("../app/IronDemo.tsx"),
    read("../scripts/fetch-rebar-prices.mjs"),
    read("../.github/workflows/pages.yml"),
    read("../app/data/rebar-prices.json").then(JSON.parse),
  ]);

  assert.deepEqual(
    priceData.categories.map((category) => category.label).sort(),
    [
      "میلگرد آجدار",
      "میلگرد ساده",
      "میلگرد استیل",
      "میلگرد آلیاژی",
    ].sort(),
  );
  assert.match(component, /rebar-kind-tabs/);
  assert.match(component, /ارزش افزوده/);
  assert.match(component, /محاسبه وزن میلگرد/);
  assert.match(navigation, /قیمت میلگرد استیل/);
  assert.match(navigation, /قیمت میلگرد آلیاژی/);
  assert.match(navigation, /کارخانه‌های میلگرد/);
  assert.match(navigation, /سایزهای میلگرد/);
  assert.match(fetcher, /__NEXT_DATA__/);
  assert.match(fetcher, /www\.fooladiranian\.com\/productlist/);
  assert.match(fetcher, /existingDataIsUsable/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /17 \*\/4 \* \* \*/);
  assert.equal(priceData.categories.length, 4);
  assert.ok(
    priceData.categories.every((category) =>
      category.factories.some((factory) => factory.rows.length > 0),
    ),
  );
});

test("beam and hash prices are sourced and exposed through the catalog", async () => {
  const [component, navigation, styles, fetcher, priceData, packageJson] =
    await Promise.all([
      read("../app/BeamPrices.tsx"),
      read("../app/IronDemo.tsx"),
      read("../app/globals.css"),
      read("../scripts/fetch-beam-prices.mjs"),
      read("../app/data/beam-prices.json").then(JSON.parse),
      read("../package.json").then(JSON.parse),
    ]);

  assert.deepEqual(
    priceData.categories.map((category) => category.label),
    ["تیرآهن", "تیرآهن هاش"],
  );
  assert.match(component, /beam-kind-tabs/);
  assert.match(component, /PriceCatalog/);
  assert.match(navigation, /قیمت هاش/);
  assert.match(navigation, /کارخانه‌های تیرآهن/);
  assert.match(navigation, /سایزهای تیرآهن/);
  assert.match(navigation, /<BeamPrices/);
  assert.match(styles, /grid-template-areas:\s*"other types factories sizes"/);
  assert.match(
    styles,
    /\.mega-other-products > div\s*\{[^}]*grid-template-columns:\s*1fr/is,
  );
  assert.match(fetcher, /__NEXT_DATA__/);
  assert.match(
    fetcher,
    /%D8%AA%DB%8C%D8%B1%D8%A2%D9%87%D9%86-%D9%87%D8%A7%D8%B4/,
  );
  assert.match(fetcher, /existingDataIsUsable/);
  assert.match(packageJson.scripts["prices:update"], /prices:update:beam/);
  assert.equal(priceData.categories.length, 2);
  assert.ok(
    priceData.categories.every((category) =>
      category.factories.some((factory) => factory.rows.length > 0),
    ),
  );
  assert.ok(
    priceData.categories
      .find((category) => category.id === "beam")
      .factories.length >= 8,
  );
});

test("all remaining product groups expose complete live price catalogs", async () => {
  const [component, navigation, fetcher, priceData, packageJson] =
    await Promise.all([
      read("../app/ProductPrices.tsx"),
      read("../app/IronDemo.tsx"),
      read("../scripts/fetch-product-prices.mjs"),
      read("../app/data/product-prices.json").then(JSON.parse),
      read("../package.json").then(JSON.parse),
    ]);

  assert.deepEqual(
    priceData.catalogs.map((catalog) => catalog.id),
    ["sheet", "profile", "pipe", "angle", "channel", "wire"],
  );
  assert.deepEqual(
    Object.fromEntries(
      priceData.catalogs.map((catalog) => [
        catalog.id,
        catalog.categories.length,
      ]),
    ),
    {
      sheet: 15,
      profile: 7,
      pipe: 10,
      angle: 1,
      channel: 1,
      wire: 6,
    },
  );
  const rows = priceData.catalogs.flatMap((catalog) =>
    catalog.categories.flatMap((category) =>
      category.factories.flatMap((factory) => factory.rows),
    ),
  );
  assert.ok(rows.length >= 1_500);
  assert.ok(
    priceData.catalogs.every((catalog) =>
      catalog.categories.every((category) =>
        category.factories.some((factory) => factory.rows.length > 0),
      ),
    ),
  );
  assert.ok(rows.some((row) => row.specifications?.length));
  assert.match(component, /PriceCatalog/);
  assert.match(navigation, /<ProductPrices/);
  assert.match(navigation, /getProductPriceCatalog/);
  assert.match(navigation, /انواع \{megaCatalog\.label\}/);
  assert.match(fetcher, /__NEXT_DATA__/);
  assert.match(fetcher, /mapWithConcurrency/);
  assert.match(fetcher, /ورق-سیاه/);
  assert.match(fetcher, /پروفیل-صنعتی/);
  assert.match(fetcher, /لوله-مانیسمان/);
  assert.match(fetcher, /توری-حصاری/);
  assert.match(fetcher, /existingDataIsUsable/);
  assert.match(packageJson.scripts["prices:update"], /prices:update:products/);
});
