import assert from "node:assert/strict";
import test from "node:test";
import {
  filterProductGroups,
  normalizeSearchText,
  toAsciiDigits,
} from "../app/site-logic.mjs";

const groups = [
  {
    id: "rebar",
    label: "میلگرد",
    rows: [
      { product: "میلگرد آجدار ۱۶", origin: "کارخانه معتبر", unit: "کیلوگرم" },
    ],
  },
  {
    id: "sheet",
    label: "ورق فولادی",
    rows: [
      { product: "ورق سیاه", origin: "کارخانه معتبر", unit: "کیلوگرم" },
    ],
  },
];

test("Persian and Arabic digits normalize to ASCII", () => {
  assert.equal(toAsciiDigits("۱۲۳٤٥"), "12345");
});

test("Arabic Yeh and Kaf normalize for Persian search", () => {
  assert.equal(normalizeSearchText("  ميلگرد كلاف  "), "میلگرد کلاف");
});

test("search finds a row by Persian product text", () => {
  const result = filterProductGroups(groups, "سیاه");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "sheet");
  assert.equal(result[0].rows[0].product, "ورق سیاه");
});

test("search matches normalized Persian digits", () => {
  const result = filterProductGroups(groups, "16");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "rebar");
});

test("empty search retains all groups", () => {
  assert.equal(filterProductGroups(groups, "  ").length, 2);
});
