import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalogPriceData } from "../app/catalog-validation.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "app", "data", "beam-prices.json");
const temporaryPath = `${outputPath}.tmp`;

const sources = [
  {
    id: "beam",
    label: "تیرآهن",
    url: "https://www.fooladiranian.com/productlist/%D8%AA%DB%8C%D8%B1%D8%A2%D9%87%D9%86/",
    minimumItems: 30,
  },
  {
    id: "hash",
    label: "تیرآهن هاش",
    url: "https://www.fooladiranian.com/productlist/%D8%AA%DB%8C%D8%B1%D8%A2%D9%87%D9%86-%D9%87%D8%A7%D8%B4/",
    minimumItems: 5,
  },
];

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Tehran",
});

function metaValue(item, key) {
  const directValue = item[`meta-${key}`];
  if (directValue !== undefined && directValue !== null) {
    return String(directValue);
  }
  const meta = item.metas?.find((entry) => entry.title === key);
  return meta?.value ? String(meta.value) : "";
}

function normaliseSummaryPrice(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.floor(numericValue / 1_000) * 100;
}

function formatPersianDate(unixTimestamp) {
  if (!unixTimestamp) return "";
  return persianDateFormatter
    .format(new Date(Number(unixTimestamp) * 1_000))
    .replace(/\u200f/g, "");
}

function deriveSummary(rows) {
  const prices = rows
    .map((row) => row.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) {
    return { min: 0, max: 0, average: 0 };
  }
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: Math.round(
      prices.reduce((total, price) => total + price, 0) / prices.length,
    ),
  };
}

function parseNextData(html, source) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
  );
  if (!match) {
    throw new Error(`داده ساختاریافته در صفحه ${source.label} پیدا نشد.`);
  }

  const shopData = JSON.parse(match[1])?.props?.pageProps?.shopData;
  if (!shopData?.products || !shopData?.price_compare) {
    throw new Error(`ساختار داده صفحه ${source.label} معتبر نیست.`);
  }

  const factories = shopData.products.map((factoryGroup) => {
    const rows = (factoryGroup.productsitem ?? []).map((item) => ({
      id: Number(item.id),
      title: String(item.title ?? ""),
      size: metaValue(item, "سایز"),
      standard: metaValue(item, "استاندارد"),
      grade: metaValue(item, "گرید"),
      branchLength: metaValue(item, "طول شاخه"),
      form: metaValue(item, "حالت"),
      approximateWeight: metaValue(item, "وزن تقریبی"),
      delivery: metaValue(item, "محل تحویل"),
      unit: metaValue(item, "واحد") || "کیلوگرم",
      factory: metaValue(item, "کارخانه") || String(item.factory ?? ""),
      price: Number(item.price) > 0 ? Number(item.price) : null,
      percent: Number(item.percent) || 0,
      status: String(item.status ?? "same"),
      updatedAt: Number(item.updated_at) || 0,
      updatedDate: formatPersianDate(item.updated_at),
    }));

    const latestUpdate = Math.max(0, ...rows.map((row) => row.updatedAt));
    return {
      name: String(factoryGroup.title ?? rows[0]?.factory ?? ""),
      updatedAt: latestUpdate,
      updatedDate: formatPersianDate(latestUpdate),
      rows,
    };
  });

  const rows = factories.flatMap((factory) => factory.rows);
  if (rows.length < source.minimumItems) {
    throw new Error(
      `تعداد ردیف‌های ${source.label} کمتر از حد انتظار است (${rows.length}).`,
    );
  }

  const compare = shopData.price_compare;
  const derivedSummary = deriveSummary(rows);
  const sourceSummary = {
    min: normaliseSummaryPrice(compare.min_price),
    max: normaliseSummaryPrice(compare.max_price),
    average: normaliseSummaryPrice(compare.avg_price),
  };
  const summary =
    sourceSummary.min > 0 &&
    sourceSummary.max > 0 &&
    sourceSummary.average > 0
      ? sourceSummary
      : derivedSummary;

  return {
    id: source.id,
    label: source.label,
    groupingLabel: "کارخانه",
    specificationLabel: "استاندارد",
    sourceTitle: String(shopData.title ?? source.label),
    sourceUrl: source.url,
    summary: {
      date: String(compare.date ?? ""),
      ...summary,
      percent: Number(compare.percent) || 0,
      status: String(compare.status ?? "same"),
    },
    filters: {
      sizes: [
        ...new Set(rows.map((row) => row.size).filter(Boolean)),
      ].sort((a, b) => Number(a) - Number(b)),
      factories: factories.map((factory) => factory.name),
    },
    factories,
  };
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "fa-IR,fa;q=0.9",
      "user-agent":
        "Bonyan-Foulad-Daria/1.0 (+https://aliakbar-rajab.github.io/)",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`${source.label}: HTTP ${response.status}`);
  }
  return parseNextData(await response.text(), source);
}

async function main() {
  const categories = await Promise.all(sources.map(fetchSource));
  const payload = {
    fetchedAt: new Date().toISOString(),
    sourceName: "فولاد ایرانیان",
    sourceHome: "https://www.fooladiranian.com/",
    taxRate: 0.1,
    categories,
  };
  validateCatalogPriceData(payload, {
    expectedCategoryIds: sources.map((source) => source.id),
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`);
  await rename(temporaryPath, outputPath);

  const itemCount = categories.reduce(
    (total, category) =>
      total +
      category.factories.reduce(
        (factoryTotal, factory) => factoryTotal + factory.rows.length,
        0,
      ),
    0,
  );
  console.log(
    `قیمت‌های تیرآهن از منبع بروزرسانی شد: ${itemCount.toLocaleString("fa-IR")} ردیف`,
  );
}

await main();
