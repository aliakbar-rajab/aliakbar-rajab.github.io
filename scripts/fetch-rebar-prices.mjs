import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveSummaryFromRows,
  validateCatalogPriceData,
} from "../app/catalog-validation.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "app", "data", "rebar-prices.json");
const temporaryPath = `${outputPath}.tmp`;

const sources = [
  {
    id: "ribbed",
    label: "میلگرد آجدار",
    url: "https://www.fooladiranian.com/productlist/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF-%D8%A2%D8%AC%D8%AF%D8%A7%D8%B1/",
    minimumItems: 100,
  },
  {
    id: "simple",
    label: "میلگرد ساده",
    url: "https://www.fooladiranian.com/productlist/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF-%D8%B3%D8%A7%D8%AF%D9%87/",
    minimumItems: 20,
  },
  {
    id: "stainless",
    label: "میلگرد استیل",
    url: "https://www.fooladiranian.com/productlist/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF-%D8%A7%D8%B3%D8%AA%DB%8C%D9%84/",
    minimumItems: 20,
  },
  {
    id: "alloy",
    label: "میلگرد آلیاژی",
    url: "https://www.fooladiranian.com/productlist/%D9%85%DB%8C%D9%84%DA%AF%D8%B1%D8%AF-%D8%A2%D9%84%DB%8C%D8%A7%DA%98%DB%8C/",
    minimumItems: 40,
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

function formatPersianDate(unixTimestamp) {
  if (!unixTimestamp) return "";
  return persianDateFormatter
    .format(new Date(Number(unixTimestamp) * 1_000))
    .replace(/\u200f/g, "");
}

function deriveRebarSize(item, source) {
  const sourceSize = metaValue(item, "سایز");
  if (source.id !== "ribbed" && source.id !== "simple") return sourceSize;
  const title = String(item.title ?? "");
  const match =
    source.id === "simple"
      ? title.match(/میلگرد\s+ساده\s+(\d+(?:[./]\d+)?)/)
      : title.match(/میلگرد\s+(\d+(?:[./]\d+)?)/);
  return match?.[1]?.replace("/", ".") ?? sourceSize;
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
      size: deriveRebarSize(item, source),
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
  return {
    id: source.id,
    label: source.label,
    groupingLabel:
      source.id === "stainless" || source.id === "alloy"
        ? "گرید"
        : "کارخانه",
    specificationLabel: source.id === "stainless" ? "گرید" : "استاندارد",
    sourceTitle: String(shopData.title ?? source.label),
    sourceUrl: source.url,
    summary: {
      date: String(compare.date ?? ""),
      // Derived from the rows, never from compare.min_price/max_price/avg_price:
      // the upstream fields are rial and rounding them to hundreds of toman
      // produced prices that appear in no row of the table.
      ...deriveSummaryFromRows(rows),
      percent: Number(compare.percent) || 0,
      status: String(compare.status ?? "same"),
    },
    filters: {
      sizes: [
        ...new Set(
          factories.flatMap((factory) =>
            factory.rows.map((row) => row.size).filter(Boolean),
          ),
        ),
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
        "Bonyan-Foulad-Daria/1.0 (+https://fouladbonyan.com/)",
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
  await writeFile(temporaryPath, `${JSON.stringify(payload)}\n`);
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
    `قیمت‌های میلگرد از منبع بروزرسانی شد: ${itemCount.toLocaleString("fa-IR")} ردیف`,
  );
}

await main();
