import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveSummaryFromRows,
  validateProductPricePayload,
} from "../app/catalog-validation.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "app", "data", "product-prices.json");
const temporaryPath = `${outputPath}.tmp`;
const sourceRoot = "https://www.fooladiranian.com/productlist/";

const source = (
  id,
  label,
  slug,
  specificationKey = "ضخامت",
  groupingLabel = "کارخانه",
) => ({
  id,
  label,
  url: new URL(`${encodeURIComponent(slug).replaceAll("%2D", "-")}/`, sourceRoot)
    .href,
  specificationKey,
  groupingLabel,
});

const catalogs = [
  {
    id: "sheet",
    label: "ورق فولادی",
    initialCategoryId: "black-sheet",
    sources: [
      source("black-sheet", "ورق سیاه", "ورق-سیاه"),
      source("sheet-st52", "ورق ST52", "ورق-st52"),
      source("sheet-a283", "ورق A283", "ورق-a283"),
      source("sheet-a285", "ورق A285", "ورق-a285"),
      source("sheet-a516", "ورق A516", "ورق-a516"),
      source("steel-strip", "تسمه آهنی", "تسمه-آهنی", "عرض"),
      source("galvanized-sheet", "ورق گالوانیزه", "ورق-گالوانیزه"),
      source("colored-sheet", "ورق رنگی", "ورق-رنگی"),
      source("oily-sheet", "ورق روغنی", "ورق-روغنی"),
      source("checkered-sheet", "ورق آجدار", "ورق-آجدار"),
      source("pickled-sheet", "ورق اسیدشویی", "ورق-اسید-شویی"),
      source("decking-sheet", "عرشه فولادی", "عرشه-فولادی"),
      source(
        "stainless-sheet",
        "ورق استیل",
        "ورق-استیل",
        "گرید",
        "گرید",
      ),
      source("wear-resistant-sheet", "ورق ضد سایش", "ورق-ضد-سایش", "گرید", "گرید"),
      source("sheet-ck45", "ورق CK45", "ورق-ck45"),
    ],
  },
  {
    id: "profile",
    label: "قوطی و پروفیل",
    initialCategoryId: "box-profile",
    sources: [
      source("box-profile", "قوطی و پروفیل", "قوطی-و-پروفیل", "ضخامت", "گروه"),
      source(
        "building-profile",
        "پروفیل ساختمانی",
        "پروفیل-ساختمانی",
        "ضخامت",
        "گروه",
      ),
      source("industrial-profile", "پروفیل صنعتی", "پروفیل-صنعتی"),
      source(
        "stainless-profile",
        "پروفیل استیل",
        "پروفیل-استیل",
        "گرید",
        "گرید",
      ),
      source("furniture-profile", "پروفیل مبلی", "پروفیل-مبلی"),
      source("galvanized-profile", "پروفیل گالوانیزه", "پروفیل-گالوانیزه"),
      source("z-profile", "پروفیل Z", "پروفیل-زد"),
    ],
  },
  {
    id: "pipe",
    label: "لوله فولادی",
    initialCategoryId: "scaffold-pipe",
    sources: [
      source("scaffold-pipe", "لوله داربست", "لوله-داربست"),
      source("galvanized-pipe", "لوله گالوانیزه", "لوله-گالوانیزه"),
      source(
        "stainless-pipe",
        "لوله استیل",
        "لوله-استیل",
        "گرید",
        "گرید",
      ),
      source("water-test-pipe", "لوله تست آب", "لوله-تست-آب"),
      source("spiral-pipe", "لوله اسپیرال", "لوله-اسپیرال"),
      source("api-pipe", "لوله API", "لوله-api", "استاندارد"),
      source("gas-pipe", "لوله گاز", "لوله-گاز-خانگی"),
      source("well-casing-pipe", "لوله جدار چاه", "لوله-جدار-چاه"),
      source("seamless-pipe", "لوله مانیسمان", "لوله-مانیسمان", "رده"),
      source("thick-wall-pipe", "لوله گوشتدار", "لوله-گوشتدار"),
    ],
  },
  {
    id: "angle",
    label: "نبشی",
    initialCategoryId: "angle",
    sources: [source("angle", "نبشی", "نبشی")],
  },
  {
    id: "channel",
    label: "ناودانی",
    initialCategoryId: "channel",
    sources: [source("channel", "ناودانی", "ناودانی", "طول شاخه")],
  },
  {
    id: "wire",
    label: "مفتول و سیم",
    initialCategoryId: "wire",
    sources: [
      source("wire", "سیم مفتول", "سیم-مفتول", "حالت", "گروه"),
      source("rib-lath", "رابیتس", "رابیتس", "ستون", "گروه"),
      source("steel-mesh", "مش", "مش", "چشمه", "گروه"),
      source("chicken-mesh", "توری مرغی", "توری-مرغی", "عرض", "گروه"),
      source("chain-link-mesh", "توری حصاری", "توری-حصاری", "ضخامت", "گروه"),
      source("crimped-mesh", "توری پرسی", "توری-پرسی", "ضخامت", "گروه"),
    ],
  },
];

const sources = catalogs.flatMap((catalog) =>
  catalog.sources.map((item) => ({ ...item, catalogId: catalog.id })),
);

const persianDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Tehran",
});

const detailKeys = [
  "عرض",
  "ضخامت",
  "طول",
  "طول شاخه",
  "حالت",
  "استاندارد",
  "گرید",
  "رده",
  "وزن تقریبی",
  "چشمه",
  "ستون",
];

function metaValue(item, key) {
  const directValue = item[`meta-${key}`];
  if (directValue !== undefined && directValue !== null) {
    return String(directValue);
  }
  const meta = item.metas?.find((entry) => entry.title === key);
  return meta?.value !== undefined && meta?.value !== null
    ? String(meta.value)
    : "";
}

function formatPersianDate(unixTimestamp) {
  if (!unixTimestamp) return "";
  return persianDateFormatter
    .format(new Date(Number(unixTimestamp) * 1_000))
    .replace(/\u200f/g, "");
}

function compareSizeValues(first, second) {
  const firstNumber = Number.parseFloat(String(first).replace(/[^\d.]/g, ""));
  const secondNumber = Number.parseFloat(String(second).replace(/[^\d.]/g, ""));
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }
  return String(first).localeCompare(String(second), "fa");
}

function parseNextData(html, currentSource) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
  );
  if (!match) {
    throw new Error(
      `داده ساختاریافته در صفحه ${currentSource.label} پیدا نشد.`,
    );
  }

  const shopData = JSON.parse(match[1])?.props?.pageProps?.shopData;
  if (!shopData?.products || !shopData?.price_compare) {
    throw new Error(`ساختار داده صفحه ${currentSource.label} معتبر نیست.`);
  }

  const factories = shopData.products
    .map((factoryGroup) => {
      const rows = (factoryGroup.productsitem ?? []).map((item) => {
        const specifications = detailKeys
          .map((label) => ({ label, value: metaValue(item, label) }))
          .filter((entry) => entry.value);
        return {
          id: Number(item.id),
          title: String(item.title ?? ""),
          size: metaValue(item, "سایز"),
          specification: metaValue(item, currentSource.specificationKey),
          standard: metaValue(item, "استاندارد"),
          grade: metaValue(item, "گرید"),
          branchLength:
            metaValue(item, "طول شاخه") || metaValue(item, "طول"),
          form: metaValue(item, "حالت"),
          approximateWeight: metaValue(item, "وزن تقریبی"),
          delivery: metaValue(item, "محل تحویل"),
          unit: metaValue(item, "واحد") || "کیلوگرم",
          factory:
            metaValue(item, "کارخانه") ||
            String(factoryGroup.title ?? item.factory ?? ""),
          specifications,
          price: Number(item.price) > 0 ? Number(item.price) : null,
          percent: Number(item.percent) || 0,
          status: String(item.status ?? "same"),
          updatedAt: Number(item.updated_at) || 0,
          updatedDate: formatPersianDate(item.updated_at),
        };
      });

      const latestUpdate = Math.max(0, ...rows.map((row) => row.updatedAt));
      return {
        name: String(factoryGroup.title ?? rows[0]?.factory ?? "سایر"),
        updatedAt: latestUpdate,
        updatedDate: formatPersianDate(latestUpdate),
        rows,
      };
    })
    .filter((factory) => factory.rows.length);

  const rows = factories.flatMap((factory) => factory.rows);
  if (!rows.length) {
    throw new Error(`هیچ ردیف قیمتی برای ${currentSource.label} پیدا نشد.`);
  }

  const compare = shopData.price_compare;
  // Derived from the rows, never from compare.min_price/max_price/avg_price:
  // the upstream fields are rial and rounding them to hundreds of toman
  // produced prices that appear in no row of the table.
  const summary = deriveSummaryFromRows(rows);

  return {
    id: currentSource.id,
    label: currentSource.label,
    groupingLabel: currentSource.groupingLabel,
    specificationLabel: currentSource.specificationKey,
    sourceTitle: String(shopData.title ?? currentSource.label),
    sourceUrl: currentSource.url,
    summary: {
      date: String(compare.date ?? ""),
      ...summary,
      percent: Number(compare.percent) || 0,
      status: String(compare.status ?? "same"),
    },
    filters: {
      sizes: [...new Set(rows.map((row) => row.size).filter(Boolean))].sort(
        compareSizeValues,
      ),
      factories: factories.map((factory) => factory.name),
    },
    factories,
  };
}

async function fetchSource(currentSource) {
  const response = await fetch(currentSource.url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "fa-IR,fa;q=0.9",
      "user-agent":
        "Bonyan-Foulad-Daria/1.0 (+https://aliakbar-rajab.github.io/)",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    throw new Error(`${currentSource.label}: HTTP ${response.status}`);
  }
  return parseNextData(await response.text(), currentSource);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

async function main() {
  const fetchedCategories = await mapWithConcurrency(sources, 6, fetchSource);
  const categoriesById = new Map(
    fetchedCategories.map((category) => [category.id, category]),
  );
  const outputCatalogs = catalogs.map((catalog) => ({
    id: catalog.id,
    label: catalog.label,
    initialCategoryId: catalog.initialCategoryId,
    categories: catalog.sources.map((item) => categoriesById.get(item.id)),
  }));
  const payload = {
    fetchedAt: new Date().toISOString(),
    sourceName: "فولاد ایرانیان",
    sourceHome: "https://www.fooladiranian.com/",
    taxRate: 0.1,
    catalogs: outputCatalogs,
  };
  validateProductPricePayload(payload, {
    expectedCatalogs: catalogs.map((catalog) => ({
      id: catalog.id,
      categoryIds: catalog.sources.map((item) => item.id),
    })),
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`);
  await rename(temporaryPath, outputPath);

  const itemCount = fetchedCategories.reduce(
    (total, category) =>
      total +
      category.factories.reduce(
        (factoryTotal, factory) => factoryTotal + factory.rows.length,
        0,
      ),
    0,
  );
  console.log(
    `قیمت تمام محصولات از منبع بروزرسانی شد: ${itemCount.toLocaleString("fa-IR")} ردیف در ${fetchedCategories.length.toLocaleString("fa-IR")} دسته`,
  );
}

await main();
