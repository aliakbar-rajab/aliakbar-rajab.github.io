import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

  const itemCount = factories.reduce(
    (total, factory) => total + factory.rows.length,
    0,
  );
  if (itemCount < source.minimumItems) {
    throw new Error(
      `تعداد ردیف‌های ${source.label} کمتر از حد انتظار است (${itemCount}).`,
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
      min: normaliseSummaryPrice(compare.min_price),
      max: normaliseSummaryPrice(compare.max_price),
      average: normaliseSummaryPrice(compare.avg_price),
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
        "Bonyan-Foulad-Daria/1.0 (+https://aliakbar-rajab.github.io/)",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`${source.label}: HTTP ${response.status}`);
  }
  return parseNextData(await response.text(), source);
}

async function existingDataIsUsable() {
  try {
    const existing = JSON.parse(await readFile(outputPath, "utf8"));
    return (
      Array.isArray(existing.categories) &&
      existing.categories.length === sources.length &&
      existing.categories.every((category) => category.factories?.length)
    );
  } catch {
    return false;
  }
}

async function main() {
  try {
    const categories = await Promise.all(sources.map(fetchSource));
    const payload = {
      fetchedAt: new Date().toISOString(),
      sourceName: "فولاد ایرانیان",
      sourceHome: "https://www.fooladiranian.com/",
      taxRate: 0.1,
      categories,
    };

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
      `قیمت‌های میلگرد از منبع بروزرسانی شد: ${itemCount.toLocaleString("fa-IR")} ردیف`,
    );
  } catch (error) {
    if (await existingDataIsUsable()) {
      console.warn(
        `دریافت قیمت تازه ممکن نبود؛ آخرین داده معتبر حفظ شد. ${error.message}`,
      );
      return;
    }
    throw error;
  }
}

await main();
