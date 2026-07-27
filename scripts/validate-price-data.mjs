import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  validateCatalogPriceData,
  validateProductPricePayload,
} from "../app/catalog-validation.mjs";

const readJson = async (path) =>
  JSON.parse(await readFile(resolve(import.meta.dirname, "..", path), "utf8"));

const rebar = await readJson("app/data/rebar-prices.json");
const beam = await readJson("app/data/beam-prices.json");
const products = await readJson("app/data/product-prices.json");

validateCatalogPriceData(rebar, {
  expectedCategoryIds: ["ribbed", "simple", "stainless", "alloy"],
});
validateCatalogPriceData(beam, {
  expectedCategoryIds: ["beam", "hash"],
});
validateProductPricePayload(products, {
  expectedCatalogs: [
    {
      id: "sheet",
      categoryIds: [
        "black-sheet",
        "sheet-st52",
        "sheet-a283",
        "sheet-a285",
        "sheet-a516",
        "steel-strip",
        "galvanized-sheet",
        "colored-sheet",
        "oily-sheet",
        "checkered-sheet",
        "pickled-sheet",
        "decking-sheet",
        "stainless-sheet",
        "wear-resistant-sheet",
        "sheet-ck45",
      ],
    },
    {
      id: "profile",
      categoryIds: [
        "box-profile",
        "building-profile",
        "industrial-profile",
        "stainless-profile",
        "furniture-profile",
        "galvanized-profile",
        "z-profile",
      ],
    },
    {
      id: "pipe",
      categoryIds: [
        "scaffold-pipe",
        "galvanized-pipe",
        "stainless-pipe",
        "water-test-pipe",
        "spiral-pipe",
        "api-pipe",
        "gas-pipe",
        "well-casing-pipe",
        "seamless-pipe",
        "thick-wall-pipe",
      ],
    },
    { id: "angle", categoryIds: ["angle"] },
    { id: "channel", categoryIds: ["channel"] },
    {
      id: "wire",
      categoryIds: [
        "wire",
        "rib-lath",
        "steel-mesh",
        "chicken-mesh",
        "chain-link-mesh",
        "crimped-mesh",
      ],
    },
  ],
});

console.log("اعتبارسنجی ساختاری و معنایی همه داده‌های قیمت با موفقیت انجام شد.");
