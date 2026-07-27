import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculateRebarWeight,
  getCategoryPricingState,
  getTrendPresentation,
} from "../app/catalog-behavior.mjs";
import { buildCatalogSearchGroups } from "../app/catalog-search.mjs";
import {
  validateCatalogPriceData,
  validateProductPricePayload,
} from "../app/catalog-validation.mjs";
import { filterProductGroups } from "../app/site-logic.mjs";

const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("committed price payloads pass runtime semantic validation", async () => {
  const [rebar, beam, products] = await Promise.all([
    readJson("../app/data/rebar-prices.json"),
    readJson("../app/data/beam-prices.json"),
    readJson("../app/data/product-prices.json"),
  ]);

  assert.equal(validateCatalogPriceData(rebar), rebar);
  assert.equal(validateCatalogPriceData(beam), beam);
  assert.equal(validateProductPricePayload(products), products);
});

test("known source ambiguities are represented honestly", async () => {
  const [rebar, beam, products] = await Promise.all([
    readJson("../app/data/rebar-prices.json"),
    readJson("../app/data/beam-prices.json"),
    readJson("../app/data/product-prices.json"),
  ]);

  const correctedRow = rebar.categories
    .flatMap((category) => category.factories)
    .flatMap((factory) => factory.rows)
    .find((row) => row.id === 504);
  assert.equal(correctedRow.title, "میلگرد 32 نیشابور آجدار A3");
  assert.equal(correctedRow.size, "32");

  const profile = products.catalogs.find((catalog) => catalog.id === "profile");
  assert.equal(
    profile.categories.find((category) => category.id === "box-profile")
      .groupingLabel,
    "گروه",
  );
  assert.equal(
    profile.categories.find((category) => category.id === "building-profile")
      .groupingLabel,
    "گروه",
  );

  const beamPricing = getCategoryPricingState(
    beam.categories.find((category) => category.id === "beam"),
  );
  assert.deepEqual(new Set(beamPricing.units), new Set(["شاخه", "کیلوگرم"]));

  const unpriced = products.catalogs
    .flatMap((catalog) => catalog.categories)
    .filter(
      (category) =>
        category.factories
          .flatMap((factory) => factory.rows)
          .every((row) => row.price === null),
    );
  assert.ok(unpriced.length > 0);
  assert.ok(
    unpriced.every((category) => {
      const state = getCategoryPricingState(category);
      return (
        !state.hasPrices &&
        category.summary.min === 0 &&
        category.summary.max === 0 &&
        category.summary.average === 0
      );
    }),
  );
});

test("live catalog search indexes real rows and navigation metadata", async () => {
  const [rebar, beam, products] = await Promise.all([
    readJson("../app/data/rebar-prices.json"),
    readJson("../app/data/beam-prices.json"),
    readJson("../app/data/product-prices.json"),
  ]);
  const baseGroups = [
    { id: "rebar", label: "میلگرد", rows: [] },
    { id: "beam", label: "تیرآهن", rows: [] },
    ...products.catalogs.map((catalog) => ({
      id: catalog.id,
      label: catalog.label,
      rows: [],
    })),
  ];
  const groups = buildCatalogSearchGroups(baseGroups, {
    rebar,
    beam,
    products,
  });

  assert.ok(
    groups.reduce((total, group) => total + group.rows.length, 0) >= 2_000,
  );
  const result = filterProductGroups(groups, "میلگرد 32 نیشابور");
  assert.equal(result[0].id, "rebar");
  assert.equal(result[0].rows[0].categoryId, "ribbed");
  assert.equal(result[0].rows[0].factory, "نیشابور");
  assert.equal(result[0].rows[0].size, "32");
});

test("trend and calculator helpers preserve business meaning", () => {
  assert.deepEqual(getTrendPresentation("down", -2.5), {
    direction: "کاهش",
    symbol: "↓",
    amount: 2.5,
  });
  assert.deepEqual(getTrendPresentation("up", 1), {
    direction: "افزایش",
    symbol: "↑",
    amount: 1,
  });
  assert.deepEqual(getTrendPresentation("up", 0), {
    direction: "بدون تغییر",
    symbol: "—",
    amount: 0,
  });
  assert.equal(calculateRebarWeight(16, 12, 2), (16 ** 2 / 162) * 12 * 2);
  assert.equal(calculateRebarWeight(16, 12, 1.5), null);
  assert.equal(calculateRebarWeight(16, 12, 0), null);
});
