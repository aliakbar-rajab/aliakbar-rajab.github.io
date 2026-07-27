import { validateProductPricePayload } from "./catalog-validation.mjs";
import type {
  CatalogCategory,
  CatalogPriceData,
  CatalogViewRequest,
} from "./RebarPrices";

export type ProductCatalogId =
  | "sheet"
  | "profile"
  | "pipe"
  | "angle"
  | "channel"
  | "wire";

export type ProductViewRequest = CatalogViewRequest;

export type ProductPriceCatalog = {
  id: ProductCatalogId;
  label: string;
  initialCategoryId: string;
  categories: CatalogCategory[];
};

export type ProductPricePayload = Omit<CatalogPriceData, "categories"> & {
  catalogs: ProductPriceCatalog[];
};

let productPricePromise: Promise<ProductPricePayload> | undefined;

export function loadProductPricePayload() {
  productPricePromise ??= import("./data/product-prices.json").then((module) =>
    validateProductPricePayload(module.default),
  ) as Promise<ProductPricePayload>;
  return productPricePromise;
}

export async function loadProductPriceCatalog(catalogId: ProductCatalogId) {
  const payload = await loadProductPricePayload();
  const catalog = payload.catalogs.find((item) => item.id === catalogId);
  if (!catalog) {
    throw new Error(`داده قیمت گروه ${catalogId} در دسترس نیست.`);
  }
  return catalog;
}
