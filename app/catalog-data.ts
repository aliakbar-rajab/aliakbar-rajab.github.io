import { validateCatalogPriceData } from "./catalog-validation.mjs";
import type { CatalogPriceData } from "./RebarPrices";

let rebarPromise: Promise<CatalogPriceData> | undefined;
let beamPromise: Promise<CatalogPriceData> | undefined;

export function loadRebarPriceData() {
  rebarPromise ??= import("./data/rebar-prices.json").then((module) =>
    validateCatalogPriceData(module.default, {
      expectedCategoryIds: ["ribbed", "simple", "stainless", "alloy"],
    }),
  ) as Promise<CatalogPriceData>;
  return rebarPromise;
}

export function loadBeamPriceData() {
  beamPromise ??= import("./data/beam-prices.json").then((module) =>
    validateCatalogPriceData(module.default, {
      expectedCategoryIds: ["beam", "hash"],
    }),
  ) as Promise<CatalogPriceData>;
  return beamPromise;
}
