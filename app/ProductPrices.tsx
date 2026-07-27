import { useEffect, useState } from "react";
import {
  PriceCatalog,
  type CatalogPriceData,
  type PriceCatalogConfig,
} from "./RebarPrices";
import {
  loadProductPricePayload,
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
  const [loaded, setLoaded] = useState<{
    payload: Awaited<ReturnType<typeof loadProductPricePayload>>;
    catalog: Awaited<ReturnType<typeof loadProductPricePayload>>["catalogs"][number];
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    loadProductPricePayload()
      .then((payload) => {
        const catalog = payload.catalogs.find((item) => item.id === catalogId);
        if (!catalog) throw new Error(`Unknown catalog ${catalogId}`);
        if (active) setLoaded({ payload, catalog });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [catalogId]);

  if (loadError) {
    return (
      <p className="catalog-load-state" role="alert">
        دریافت قیمت این گروه ممکن نشد. لطفاً صفحه را دوباره بارگذاری کنید.
      </p>
    );
  }
  if (!loaded) {
    return (
      <p className="catalog-load-state" role="status">
        در حال دریافت قیمت محصولات…
      </p>
    );
  }

  const { payload, catalog } = loaded;
  const priceData: CatalogPriceData = {
    fetchedAt: payload.fetchedAt,
    sourceName: payload.sourceName,
    sourceHome: payload.sourceHome,
    taxRate: payload.taxRate,
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
