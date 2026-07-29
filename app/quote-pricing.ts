import { createRetryableLoader } from "./catalog-cache";
import { loadBeamPriceData, loadRebarPriceData } from "./catalog-data";
import { loadProductPricePayload } from "./product-price-data";
import type { CatalogCategory } from "./RebarPrices";

export type QuoteProductName =
  | "میلگرد"
  | "تیرآهن"
  | "هاش"
  | "ورق فولادی"
  | "پروفیل و قوطی"
  | "لوله فولادی"
  | "نبشی"
  | "ناودانی"
  | "مفتول و سیم"
  | "سایر محصولات فولادی";

export type QuotePriceEstimate = {
  product: QuoteProductName;
  unitPriceTomanPerKg: number;
  minPriceTomanPerKg: number;
  maxPriceTomanPerKg: number;
  rowCount: number;
  date: string;
};

const productCatalogMapping = {
  "ورق فولادی": "sheet",
  "پروفیل و قوطی": "profile",
  "لوله فولادی": "pipe",
  نبشی: "angle",
  ناودانی: "channel",
  "مفتول و سیم": "wire",
} as const;

function buildKilogramEstimate(
  product: QuoteProductName,
  category: CatalogCategory | undefined,
): QuotePriceEstimate | null {
  if (!category) return null;

  const prices = category.factories
    .flatMap((factory) => factory.rows)
    .filter(
      (row): row is typeof row & { price: number } =>
        row.unit === "کیلوگرم" &&
        typeof row.price === "number" &&
        Number.isFinite(row.price) &&
        row.price > 0,
    )
    .map((row) => row.price);

  if (!prices.length) return null;

  return {
    product,
    unitPriceTomanPerKg: Math.round(
      prices.reduce((sum, price) => sum + price, 0) / prices.length,
    ),
    minPriceTomanPerKg: Math.min(...prices),
    maxPriceTomanPerKg: Math.max(...prices),
    rowCount: prices.length,
    date: category.summary.date,
  };
}

export const loadQuotePriceEstimates = createRetryableLoader(async () => {
  const [rebar, beam, productPayload] = await Promise.all([
    loadRebarPriceData(),
    loadBeamPriceData(),
    loadProductPricePayload(),
  ]);

  const estimates: Partial<
    Record<QuoteProductName, QuotePriceEstimate>
  > = {};

  const addEstimate = (
    product: QuoteProductName,
    category: CatalogCategory | undefined,
  ) => {
    const estimate = buildKilogramEstimate(product, category);
    if (estimate) estimates[product] = estimate;
  };

  addEstimate(
    "میلگرد",
    rebar.categories.find((category) => category.id === "ribbed"),
  );
  addEstimate(
    "تیرآهن",
    beam.categories.find((category) => category.id === "beam"),
  );
  addEstimate(
    "هاش",
    beam.categories.find((category) => category.id === "hash"),
  );

  for (const [product, catalogId] of Object.entries(productCatalogMapping) as Array<
    [keyof typeof productCatalogMapping, (typeof productCatalogMapping)[keyof typeof productCatalogMapping]]
  >) {
    const catalog = productPayload.catalogs.find(
      (candidate) => candidate.id === catalogId,
    );
    addEstimate(
      product,
      catalog?.categories.find(
        (category) => category.id === catalog.initialCategoryId,
      ),
    );
  }

  return estimates;
});

export function calculateApproximateTotal(
  unitPriceTomanPerKg: number,
  quantity: number,
  unit: string,
) {
  if (
    !Number.isFinite(unitPriceTomanPerKg) ||
    unitPriceTomanPerKg <= 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  const weightInKg =
    unit === "تن" ? quantity * 1_000 : unit === "کیلوگرم" ? quantity : null;
  if (weightInKg === null) return null;

  return Math.round(unitPriceTomanPerKg * weightInKg);
}
