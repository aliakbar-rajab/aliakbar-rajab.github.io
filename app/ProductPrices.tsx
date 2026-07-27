import {
  PriceCatalog,
  type CatalogPriceData,
  type PriceCatalogConfig,
} from "./RebarPrices";
import {
  getProductPriceCatalog,
  productPricePayload,
  type ProductCatalogId,
  type ProductViewRequest,
} from "./product-price-data";

const categoryIcons = ["◆", "◇", "◈", "▰", "▱", "⌁", "▦", "⬡"];

export default function ProductPrices({
  catalogId,
  phoneHref,
  requestedView,
}: {
  catalogId: ProductCatalogId;
  phoneHref: string;
  requestedView?: ProductViewRequest;
}) {
  const catalog = getProductPriceCatalog(catalogId);
  const priceData: CatalogPriceData = {
    fetchedAt: productPricePayload.fetchedAt,
    sourceName: productPricePayload.sourceName,
    sourceHome: productPricePayload.sourceHome,
    taxRate: productPricePayload.taxRate,
    categories: catalog.categories,
  };
  const config: PriceCatalogConfig = {
    productLabel: catalog.label,
    initialCategoryId: catalog.initialCategoryId,
    categoryIcons: Object.fromEntries(
      catalog.categories.map((category, index) => [
        category.id,
        categoryIcons[index % categoryIcons.length],
      ]),
    ),
    tabClassName: "product-kind-tabs",
  };

  return (
    <PriceCatalog
      priceData={priceData}
      config={config}
      phoneHref={phoneHref}
      requestedView={requestedView}
    />
  );
}
