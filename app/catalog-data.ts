import { createRetryableLoader } from "./catalog-cache";
import { validateCatalogPriceData } from "./catalog-validation.mjs";
import type { CatalogPriceData } from "./catalog-types";

export const loadRebarPriceData = createRetryableLoader(
  () =>
    import("./data/rebar-prices.json").then((module) =>
      validateCatalogPriceData(module.default, {
        expectedCategoryIds: ["ribbed", "simple", "stainless", "alloy"],
      }),
    ) as Promise<CatalogPriceData>,
);

export const loadBeamPriceData = createRetryableLoader(
  () =>
    import("./data/beam-prices.json").then((module) =>
      validateCatalogPriceData(module.default, {
        expectedCategoryIds: ["beam", "hash"],
      }),
    ) as Promise<CatalogPriceData>,
);
