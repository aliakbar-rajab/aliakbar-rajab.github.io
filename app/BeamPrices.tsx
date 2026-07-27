import importedPriceData from "./data/beam-prices.json";
import {
  PriceCatalog,
  type CatalogPriceData,
  type CatalogViewRequest,
  type PriceCatalogConfig,
} from "./RebarPrices";

export type BeamViewRequest = Omit<CatalogViewRequest, "categoryId"> & {
  categoryId?: "beam" | "hash";
};

const beamPriceData = importedPriceData as CatalogPriceData;
const beamConfig: PriceCatalogConfig = {
  productLabel: "تیرآهن",
  initialCategoryId: "beam",
  categoryIcons: {
    beam: "I",
    hash: "H",
  },
  tabClassName: "beam-kind-tabs",
};

export default function BeamPrices({
  phoneHref,
  requestedView,
}: {
  phoneHref: string;
  requestedView?: BeamViewRequest;
}) {
  return (
    <PriceCatalog
      priceData={beamPriceData}
      config={beamConfig}
      phoneHref={phoneHref}
      requestedView={requestedView}
    />
  );
}
