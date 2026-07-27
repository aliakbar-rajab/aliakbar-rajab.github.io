import importedPriceData from "./data/product-prices.json";
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

export const productPricePayload = importedPriceData as ProductPricePayload;
export const productPriceCatalogs = productPricePayload.catalogs;

export function getProductPriceCatalog(catalogId: ProductCatalogId) {
  const catalog = productPriceCatalogs.find((item) => item.id === catalogId);
  if (!catalog) {
    throw new Error(`داده قیمت گروه ${catalogId} در دسترس نیست.`);
  }
  return catalog;
}
