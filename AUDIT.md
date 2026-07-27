# Defect audit — bonyan-foulad-daria-website

Date: 2026-07-27 · Commit: `8f141f6` (plus uncommitted working-tree changes)
Nothing was fixed. Every finding below cites `file:line`, quotes the code, and gives a reproduction.

---

## 0. Repo map

| Aspect | Detail |
| --- | --- |
| Entry points | [index.html](index.html) → [static-entry/main.tsx](static-entry/main.tsx) (CSR only, no SSR, no router) · [public/preloader/fb-preloader.js](public/preloader/fb-preloader.js) (classic `defer` script, runs before the module) |
| UI modules | [app/IronDemo.tsx](app/IronDemo.tsx) (1213 lines, whole page + nav + search) → [app/RebarPrices.tsx](app/RebarPrices.tsx) (`PriceCatalog`, shared by all 8 groups) ← [app/BeamPrices.tsx](app/BeamPrices.tsx), [app/ProductPrices.tsx](app/ProductPrices.tsx) |
| Pure logic (`.mjs`, untyped) | [app/site-logic.mjs](app/site-logic.mjs), [app/catalog-behavior.mjs](app/catalog-behavior.mjs), [app/catalog-search.mjs](app/catalog-search.mjs), [app/catalog-validation.mjs](app/catalog-validation.mjs) |
| Data loaders | [app/catalog-data.ts](app/catalog-data.ts), [app/product-price-data.ts](app/product-price-data.ts) — module-level promise caches over `import()` of JSON |
| Committed data | `app/data/*.json` — 2,201,342 bytes total (`product-prices.json` alone is 1.89 MB) |
| Build / test | Vite 8 → `dist`; `npm run verify` = lint → tsc → 4 node:test files → build → built-site test. All 22 tests pass, lint and typecheck are clean as of this audit. |
| External I/O | **Egress only.** Three scrapers `fetch()` `https://www.fooladiranian.com/productlist/*`, regex out `__NEXT_DATA__`, `JSON.parse`, validate, write via temp-file + `rename`. Browser runtime makes **zero** network calls beyond its own static assets. |
| Trust boundaries | (1) scraped HTML → `app/data/*.json` → bundled → rendered. Sole gate is `app/catalog-validation.mjs`. (2) `price-data` git branch → `build` job (`git checkout FETCH_HEAD -- app/data`). (3) `refresh` job holds `contents: write`. |
| Auth / DB / subprocess / secrets | **None.** No forms, no `fetch()` in client code, no DB (the `db/`, `drizzle/`, `worker/`, `examples/` dirs are empty starter leftovers), no credentials in source. Confirmed: no `mailto:`/email addresses, actions are SHA-pinned, `permissions: {}` at workflow top level. |

No P0 found: no data loss, no exploitable injection, no secret in source, no crash on a normal path.

---

## 1. Findings

| ID | Sev | File:line | What breaks | Confidence | Est. fix |
| --- | --- | --- | --- | --- | --- |
| F1 | P1 | [scripts/fetch-rebar-prices.mjs:56](scripts/fetch-rebar-prices.mjs#L56), [fetch-beam-prices.mjs:44](scripts/fetch-beam-prices.mjs#L44), [fetch-product-prices.mjs:170](scripts/fetch-product-prices.mjs#L170) | Summary stat cards display min/max prices that no row in the table has. 17 of 41 single-unit categories are wrong right now. | High (measured) | S |
| F2 | P1 | [app/IronDemo.tsx:498](app/IronDemo.tsx#L498) + [:336](app/IronDemo.tsx#L336) | Every first search paints "محصولی پیدا نشد" while claiming "در حال جست‌وجو…"; if the load fails the page is stuck in that state. | High | S |
| F3 | P1 | [app/catalog-data.ts:8](app/catalog-data.ts#L8), [:17](app/catalog-data.ts#L17), [app/product-price-data.ts:32](app/product-price-data.ts#L32), [app/IronDemo.tsx:176](app/IronDemo.tsx#L176) | A rejected load is cached forever. The UI says "try again" / "reload the page", but retry is a guaranteed no-op. | High | S |
| F4 | P1 | [app/RebarPrices.tsx:538](app/RebarPrices.tsx#L538), [:421](app/RebarPrices.tsx#L421) | Any move under 0.5 % renders as "افزایش ۰٪" — an arrow and a direction next to a zero. 69 rows affected today. | High (measured) | S |
| F5 | P2 | [app/catalog-utils.ts:3](app/catalog-utils.ts#L3) | Thousand separators get injected into dimensions: `طول*1250` → `طول*۱٬۲۵۰`, `1000 گرم` → `۱٬۰۰۰ گرم`. | High (measured) | S |
| F6 | P2 | [eslint.config.mjs:11](eslint.config.mjs#L11) | ESLint applies **0 rules** to every `.mjs` file. ~1,900 lines — all three scrapers, the validator, all tests — are unlinted and untyped. | High (verified) | S |
| F7 | P2 | [index.html:8](index.html#L8) | CSP `style-src 'self'` blocks Vite's dev-mode `<style>` injection, so `npm run dev` (the documented workflow) serves an unstyled page. | Med-High | S |
| F8 | P2 | [app/IronDemo.tsx:196](app/IronDemo.tsx#L196), [:215](app/IronDemo.tsx#L215), [:239](app/IronDemo.tsx#L239), [:250](app/IronDemo.tsx#L250) | Mega-menu factory/size lists are hardcoded but the data they filter refreshes every 4 h. Drift silently yields dead menu entries; nothing tests the coupling. | High | M |
| F9 | P2 | [app/catalog-validation.mjs:95](app/catalog-validation.mjs#L95) + [app/RebarPrices.tsx:185](app/RebarPrices.tsx#L185) + [static-entry/main.tsx:15](static-entry/main.tsx#L15) | 9 row fields cross the trust boundary unvalidated, two of them are dereferenced as strings, and there is no error boundary — one bad type blanks the whole site. | High (mechanism) / Med (trigger) | M |
| F10 | P2 | [app/catalog-validation.mjs:47](app/catalog-validation.mjs#L47) vs [:158](app/catalog-validation.mjs#L158) | `sourceHome` is scheme-checked but never used in markup; `sourceUrl` **is** rendered into `href` and is only checked non-empty. Backwards. | High (asymmetry) / Low (exploit) | S |
| F11 | P2 | [app/IronDemo.tsx:176](app/IronDemo.tsx#L176) | The first search submit downloads all three catalogs — 907 KB of uncompressed JS. Unbounded: grows with the upstream catalog, and `built-site.test.mjs` only guards the *main* chunk. | High (measured) | M |
| F12 | P2 | [.github/workflows/pages.yml:14](.github/workflows/pages.yml#L14) | `concurrency: {group: pages, cancel-in-progress: true}` is shared by push, PR and schedule — a PR push cancels an in-flight production deploy. | High | S |
| F13 | P2 | [.github/workflows/pages.yml:46](.github/workflows/pages.yml#L46) | `git rev-parse origin/price-data` hard-fails if the branch doesn't exist; the refresh job cannot bootstrap itself. | High | S |
| F14 | P2 | [app/RebarPrices.tsx:113](app/RebarPrices.tsx#L113) | Tax-inclusive prices are silently rounded to the nearest 100 toman/kg, with no indication that the figure is approximate. | High (behaviour) / Med (is-it-a-bug) | S |
| F15 | P2 | [app/IronDemo.tsx:1057](app/IronDemo.tsx#L1057) | When a search returns nothing, *every* product tab gets `tabIndex={-1}` — the tablist drops out of the tab order entirely. | High | S |
| F16 | P3 | [app/RebarPrices.tsx:452](app/RebarPrices.tsx#L452) | The VAT switch is rendered once per factory card — up to 27 identical `role="switch"` controls bound to one state. | High | S |
| F17 | P3 | [app/IronDemo.tsx:77](app/IronDemo.tsx#L77) + [tests/site-logic.test.mjs:14](tests/site-logic.test.mjs#L14) | 24 hardcoded `rows` entries are dead except inside the two broken states of F2; the test fixture diverges from them so it can't catch that. | High | S |
| F18 | P3 | [app/IronDemo.tsx:518](app/IronDemo.tsx#L518) | `filterProductGroups` runs twice over the 1,105-row corpus on every search — once eagerly, once in the memo. | High | S |
| F19 | P3 | [public/preloader/fb-preloader.js:34](public/preloader/fb-preloader.js#L34), [:51](public/preloader/fb-preloader.js#L51) | `fb-preloader-complete` and `id="fb-site"` have no consumer in any CSS or JS. Dead. | High (verified) | S |
| F20 | P3 | [scripts/fetch-product-prices.mjs:196](scripts/fetch-product-prices.mjs#L196) | `compareSizeValues` mixes numeric and locale comparison, producing a non-transitive comparator → implementation-defined filter ordering. | Med | S |
| F21 | P3 | [tests/source-contract.test.mjs](tests/source-contract.test.mjs), [tests/catalog-ui.test.mjs:129](tests/catalog-ui.test.mjs#L129) | ~60 of the suite's assertions regex the *source text* or assert the absence of strings that never existed. They fail on renames and pass through logic breaks. | High | L |

---

## 2. Detail

### F1 · P1 — Summary cards show prices that exist nowhere in the table

`scripts/fetch-rebar-prices.mjs:53-57` (identical in `fetch-beam-prices.mjs:41-45`, `fetch-product-prices.mjs:167-171`):

```js
function normaliseSummaryPrice(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.floor(numericValue / 1_000) * 100;
}
```

The source publishes `price_compare.min_price` in rial and `productsitem[].price` in toman. `/1000*100` is a rial→toman conversion (`/10`) that **also truncates to whole hundreds**, while row prices at `fetch-rebar-prices.mjs:103` are copied through untouched:

```js
price: Number(item.price) > 0 ? Number(item.price) : null,
```

Failure: open قیمت میلگرد ساده. `app/data/rebar-prices.json` has `summary.min = 65400`, so the "کمترین قیمت" card reads **۶۵٬۴۰۰**. The cheapest row in the table below it is **۶۵٬۴۵۰**. Measured across the shipped data — 17 of the 41 single-unit categories disagree:

```
rebar   simple              shown min 65400   actual min 65450
rebar   alloy               shown min 65300   actual min 65360
sheet   checkered-sheet     shown min 133100  actual min 133180  | shown max 144700  actual max 144720
profile stainless-profile   shown min 817200  actual min 817270
angle   angle               shown min 64900   actual min 64980
channel channel             shown min 64900   actual min 64960
wire    wire                shown min 82700   actual min 82730   | shown max 109000  actual max 109090
… 10 more
```

`validateSummary` at `app/catalog-validation.mjs:24-41` cannot catch this: it checks `min > 0`, `max >= min` and `average ∈ [min, max]`, but never compares the summary against the rows it summarises.

---

### F2 · P1 — Search paints "no results" while it is still searching, and stays there on failure

`app/IronDemo.tsx:495-516`:

```js
const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const query = searchInput.trim();
  setCommittedSearch(query);            // ← committed synchronously
  …
    setSearchMessage(`در حال جست‌وجوی «${query}»…`);
    let groups: ProductGroup[];
    try {
      groups = await loadCatalogSearchGroups();   // ← yields; network on first call
    } catch {
      setSearchMessage("دریافت فهرست زنده محصولات ممکن نشد. لطفاً دوباره تلاش کنید.");
      setSearchLoading(false);
      return;                            // ← committedSearch stays set, searchGroups stays null
    }
    setSearchGroups(groups);
```

`app/IronDemo.tsx:336-344` then filters against the *placeholder* rows, because `searchGroups` is still `null`:

```js
const filteredGroups = useMemo(
  () => filterProductGroups(searchGroups ?? productGroups, committedSearch),
  [committedSearch, searchGroups],
);
const visibleGroup =
  filteredGroups.find((group) => group.id === activeGroup) ?? filteredGroups[0] ?? null;
```

`visibleGroup === null` renders the empty state at `:1102-1109`, unmounting the price catalog.

Failure (verified against the real `productGroups` array): search `نیشابور`. `filterProductGroups(productGroups, "نیشابور")` returns **0 groups** — as do `ذوب آهن`, `ورق گالوانیزه`, and `16`. So on every cold search the user sees the status line say *"در حال جست‌وجوی «نیشابور»…"* directly above *"محصولی پیدا نشد"* until 907 KB of chunks land (F11). If the chunk request fails, the `return` leaves `committedSearch = "نیشابور"` and `searchGroups = null` permanently: the entire price section reads "محصولی پیدا نشد" until the user finds the "پاک‌کردن جست‌وجو" button, and per F3 no retry can ever recover.

---

### F3 · P1 — Rejected loads are cached permanently, so every "try again" is a no-op

Four sites use `??=` over a promise, which stores the *rejected* promise on failure:

```js
// app/catalog-data.ts:8
rebarPromise ??= import("./data/rebar-prices.json").then(…)
// app/catalog-data.ts:17
beamPromise ??= import("./data/beam-prices.json").then(…)
// app/product-price-data.ts:32
productPricePromise ??= import("./data/product-prices.json").then(…)
// app/IronDemo.tsx:176
searchGroupsPromise ??= Promise.all([...]).then(…)
```

Because the variable is non-`undefined` after rejection, `??=` never re-runs. Every subsequent call returns the same rejection.

Failure: go offline mid-session, submit a search. `app/IronDemo.tsx:511` shows *"دریافت فهرست زنده محصولات ممکن نشد. **لطفاً دوباره تلاش کنید**"* — but reconnecting and submitting again re-awaits the cached rejection and shows the same message forever. Same shape at `app/RebarPrices.tsx:799` and `app/ProductPrices.tsx:49`, where the copy says "reload the page" — technically true only because a reload discards the module. `setMegaCatalogError` at `app/IronDemo.tsx:400` inherits the same dead end: once a group's mega menu has failed, reopening it shows "دریافت فهرست این گروه ممکن نشد." with no further attempt.

---

### F4 · P1 — Sub-1 % price moves render as "increase 0 %"

`app/RebarPrices.tsx:103-105` and `:531-540`:

```js
function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("fa-IR", { maximumFractionDigits });
}
…
<span aria-hidden="true">{trend.symbol}</span>{" "}
{trend.direction}{" "}
{trend.amount ? `${formatNumber(trend.amount)}٪` : ""}
```

`getTrendPresentation` (`app/catalog-behavior.mjs:19`) only zeroes `amount` when the percent is exactly 0, so any `0 < |percent| < 0.5` survives as a truthy number and then rounds to zero on display.

Failure: row id `6439` in `app/data/rebar-prices.json` — `میلگرد 8 کاوه تیکمه داش آجدار A2`, `status: "up"`, `percent: 0.14`. The نوسان cell renders **"↑ افزایش ۰٪"**. Verified: `(0.14).toLocaleString("fa-IR", {maximumFractionDigits: 0}) === "۰"`. 69 rows in the shipped data are in this band (0.14 – 0.49). `:421` has the same defect for the category-level card: `{formatNumber(Math.abs(category.summary.percent))}٪`.

---

### F5 · P2 — Dimensions get thousand separators

`app/catalog-utils.ts:1-8`:

```js
export function localizeCatalogValue(value: string) {
  if (!value) return "—";
  return value.replace(/\d+(?:\.\d+)?/g, (part) =>
    Number(part).toLocaleString("fa-IR", { … }),
  );
}
```

`toLocaleString` applies grouping unconditionally, but this function is applied to sizes and spec values, not just money — `app/RebarPrices.tsx:503` (`localizeCatalogValue(row.size)`), `:506` (specification), `:560` (every detail row), `:649` (the size dropdown).

Failure: verified with node —

```
"طول*1250"  → "طول*۱٬۲۵۰"
"1000 گرم"  → "۱٬۰۰۰ گرم"
"عرض 1000"  → "عرض ۱٬۰۰۰"
```

Affects 9 rows and 5 dropdown entries in the shipped data (`sheet/black-sheet` size `طول*1250`; `wire/rib-lath` sizes `1000 گرم` … `1300 گرم`). `updatedDate` escapes only by luck — `formatPersianDate` already emits Persian digits (`"۱۴۰۵/۵/۴"`), which the ASCII-only `\d` class doesn't match. If that formatting ever changes, `1405/5/4` would render as `۱٬۴۰۵/۵/۴`.

---

### F6 · P2 — ESLint applies zero rules to every `.mjs` file

`eslint.config.mjs:9-11`:

```js
{
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ["**/*.{ts,tsx}"],
```

That `files` key scopes the *only* rule-bearing config object to `.ts`/`.tsx`. Verified:

```
npx eslint --print-config app/site-logic.mjs   → rules: 0
npx eslint --print-config app/IronDemo.tsx     → rules: 108
```

ESLint still *visits* the `.mjs` files (they appear in `eslint .` output) so it looks covered, but no rule can ever fire. `tsconfig.json:26` compounds it: `include: ["app","static-entry","vite.config.ts"]` with `checkJs: false`, so `scripts/` and `tests/` get neither lint nor typecheck.

Failure: a `no-undef`/`no-unused-vars`-class mistake anywhere in the three scrapers, in `catalog-validation.mjs`, or in the tests passes `npm run verify` clean and first surfaces as a red 4-hourly refresh job in CI, blocking scheduled deploys until someone reads the logs.

---

### F7 · P2 — The CSP in `index.html` breaks `npm run dev`

`index.html:6-9`:

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self'; …" />
```

`style-src 'self'` with no `'unsafe-inline'`, nonce, or hash. Vite's dev client injects CSS through a runtime-created `<style>` element — `node_modules/vite/dist/client/client.mjs:1192-1195`:

```js
style = document.createElement("style");
…
style.textContent = content;
```

Per CSP, `<style>` element content inserted at runtime is inline style and is blocked without `'unsafe-inline'`. Production is unaffected: `dist/index.html:91` links a real stylesheet (`<link rel="stylesheet" crossorigin href="/assets/index-D_2fVpdf.css">`), and `README.md:10-13` documents `npm run dev` as the local workflow.

Confidence note: I verified the Vite code path and the CSP header, but did **not** boot the dev server to watch the violation land. The mechanism is spec behaviour, so I'd expect an unstyled page plus `Refused to apply inline style` in the console.

---

### F8 · P2 — Hardcoded mega-menu lists vs. data that refreshes every 4 hours

`app/IronDemo.tsx:196-250` hardcodes 16 rebar factories, 13 rebar sizes, 8 beam factories and 9 beam sizes. Those strings become filter values at `:699-706`:

```js
onClick={() =>
  goToRebarView({
    categoryId: "ribbed",
    factory:
      factory === "ابهر"
        ? "سیادن ابهر"
        : factory,
  })
}
```

That ternary is direct evidence the drift has already happened once — the display name and the data key diverged and were patched with a one-off special case.

I checked all four lists against the shipped data and they currently match exactly (0 mismatches), so this is not broken today. The defect is structural: `.github/workflows/pages.yml:9` re-scrapes on `cron: "17 */4 * * *"`, and neither `prices:validate` nor any test asserts that these literals still exist in `filters.factories` / `filters.sizes`.

Failure: upstream renames `سیادن ابهر`, or drops `اروند` from the آجدار listing. The refresh commits, `npm run verify` passes (nothing checks the coupling), the site deploys. Clicking **میلگرد ابهر** then sets `factoryFilter` to a name no row carries, `filteredFactories` at `app/RebarPrices.tsx:243-255` comes back empty, and the user gets a bare "قیمتی با این مشخصات پیدا نشد." with no hint that the menu entry itself is stale.

---

### F9 · P2 — Unvalidated fields dereferenced as strings, with no error boundary

`app/catalog-validation.mjs:95-100` type-checks exactly three optional string fields:

```js
for (const field of ["size", "unit", "factory"]) {
  assert(
    typeof row[field] === "string",
    `${rowLocation}.${field} رشته نیست`,
  );
}
```

Never checked: `specification`, `standard`, `grade`, `branchLength`, `form`, `approximateWeight`, `delivery`, `updatedDate`, `specifications`. Two of those are then dereferenced as strings. `app/RebarPrices.tsx:183-189`:

```js
value: row.branchLength
  ? row.branchLength.includes("متر")
    ? row.branchLength
    : `${row.branchLength} متر`
  : "—",
```

and `:560`, which reaches `value.replace` inside `localizeCatalogValue`:

```jsx
<dd>{localizeCatalogValue(detail.value)}</dd>
```

`row.specifications` is spread unguarded at `:163` (`...row.specifications`) and its entries are dot-accessed at `app/catalog-search.mjs:39-42`.

There is no error boundary anywhere — grep for `ErrorBoundary|componentDidCatch|getDerivedStateFromError|onCaughtError|onUncaughtError` across `app/`, `static-entry/`, `index.html` returns nothing, and `static-entry/main.tsx:15-19` renders `<IronDemo />` bare inside `<StrictMode>`.

Failure: a row where `branchLength` is the JSON number `12` instead of `"12"`. Validation passes. Expanding that row calls `(12).includes` → `TypeError: row.branchLength.includes is not a function` → React unmounts the tree → **fully blank white page**, no message, no phone number.

Trigger confidence: Medium, not High. Today the scrapers' `metaValue` always returns `String(...)`, so the JSON is string-typed by construction. The exposure is the second trust boundary — a hand-edit of `app/data/*.json` or of the `price-data` branch reaches the renderer with these fields unchecked.

---

### F10 · P2 — Scheme validation is on the field that isn't rendered, not the one that is

`app/catalog-validation.mjs:158-162` guards `sourceHome`:

```js
assert(
  typeof payload.sourceHome === "string" &&
    /^https:\/\//.test(payload.sourceHome),
  `${location}.sourceHome معتبر نیست`,
);
```

`sourceHome` never appears in any JSX. The field that *is* rendered into an `href` — `app/RebarPrices.tsx:742` — is `sourceUrl`:

```jsx
<a href={category.sourceUrl} target="_blank" rel="noreferrer">
```

and `sourceUrl` is only checked for non-emptiness, at `app/catalog-validation.mjs:44-57` (`typeof category[field] === "string" && category[field].trim()`). The guard is on the wrong field.

Not exploitable today: `sourceUrl` is assigned from the scrapers' own hardcoded `source.url` (`fetch-rebar-prices.mjs:139`, `fetch-beam-prices.mjs:137`, `fetch-product-prices.mjs:286`), never from scraped content, and reaching it requires write access to `app/data` or to `price-data` — which already implies `contents: write`. Flagging it as a misplaced check rather than a live hole: the validator is the documented gate for the `price-data` branch, and it would currently accept `sourceUrl: "javascript:…"`. `rel="noreferrer"` correctly implies `noopener`, so tab-nabbing is already covered.

---

### F11 · P2 — The first search downloads 907 KB, with no ceiling

`app/IronDemo.tsx:173-184`:

```js
searchGroupsPromise ??= Promise.all([
  loadRebarPriceData(),
  loadBeamPriceData(),
  loadProductPricePayload(),
]).then(([rebar, beam, products]) =>
  buildCatalogSearchGroups(productGroups, { rebar, beam, products }),
);
```

Typing into the header search box and pressing Enter pulls all three catalogs, whether or not the query could possibly match them. Measured from `dist/assets/`:

```
product-prices-pTq7YtEo.js   751,932 B
rebar-prices-CNA-ZXJR.js     137,081 B
beam-prices-CMtifQTp.js       17,997 B
                             ─────────
                             907,010 B  (uncompressed)
```

`buildCatalogSearchGroups` then materialises a 1,105-row array where each row carries a concatenated `searchText` string (`app/catalog-search.mjs:25-45`), held for the page's lifetime.

Failure: a mobile user on a slow connection types "میلگرد" and waits on ~900 KB — during which they are looking at F2's "محصولی پیدا نشد". Unbounded direction: the payload is whatever the upstream catalog happens to contain (already 1.89 MB of JSON), and `tests/built-site.test.mjs:56-59` only asserts `mainStats.size < 500_000` for the *entry* chunk, so lazy-chunk growth is untested. `validateCategory` caps neither string lengths nor row counts.

---

### F12 · P2 — A PR push cancels the production deploy

`.github/workflows/pages.yml:3-16`:

```yaml
on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]
  schedule:
    - cron: "17 */4 * * *"
  workflow_dispatch:

permissions: {}

concurrency:
  group: pages
  cancel-in-progress: true
```

One concurrency group, no `${{ github.ref }}` in the key, and `cancel-in-progress: true` — so *any* triggering event cancels *any* in-flight run.

Failure: a scheduled refresh commits fresh prices to `price-data` at 04:17 and enters `build`. At 04:19 someone pushes a commit to an open PR. The PR run takes group `pages` and cancels the scheduled run mid-`build`. `deploy` never executes, so the fresh data sits on `price-data` unpublished until the 08:17 cron. The failure is silent — the cancelled run isn't a red X anyone is paged for.

---

### F13 · P2 — The refresh job can't bootstrap a missing `price-data` branch

`.github/workflows/pages.yml:42-55`:

```bash
git fetch origin price-data
price_data_sha="$(git rev-parse origin/price-data)"
if ! git diff --quiet -- app/data; then
  …
fi
git push \
  --force-with-lease="price-data:${price_data_sha}" \
  origin HEAD:price-data
```

No branch-existence handling. `git fetch origin price-data` errors with `couldn't find remote ref`; with `set -e` semantics under `shell: bash` the step fails, and `git rev-parse` would fail next regardless.

Failure: fork the repo, or delete `price-data`, then trigger `workflow_dispatch`. The refresh job fails → `build`'s `if: needs.refresh.result == 'success' || 'skipped'` is false → `build` and `deploy` are skipped. Nothing deploys, and the only fix is to hand-create the branch. Same shape in `build` at `:85-86` (`git fetch --depth=1 origin price-data` / `git checkout FETCH_HEAD -- app/data`), which is unguarded for a first-ever run.

---

### F14 · P2 — VAT prices are silently rounded to the nearest 100 toman

`app/RebarPrices.tsx:107-117`:

```js
function displayPrice(price, taxIncluded, taxRate) {
  if (!price) return "تماس بگیرید";
  const adjustedPrice = taxIncluded
    ? Math.round((price * (1 + taxRate)) / 100) * 100
    : price;
  return formatNumber(adjustedPrice);
}
```

Failure: `69,700 × 1.1 = 76,670` → `Math.round(766.7) * 100` = **76,700** — displayed as an exact per-kg figure, 30 toman above the true VAT-inclusive price. On a 20-tonne order that is a 600,000-toman discrepancy against a number the buyer read off the site. The rounding is invisible: no "≈", and the same `displayPrice` feeds the summary cards at `:330-331`.

I'm flagging this rather than asserting it: the page carries a "confirm with sales before purchase" disclaimer at `:738-741`, so this may be a deliberate presentation choice. If it is, the rounding should be visible in the UI.

---

### F15 · P2 — Empty search results remove the product tablist from the tab order

`app/IronDemo.tsx:1048-1062`:

```jsx
const selected = visibleGroup?.id === group.id;
return (
  <button
    type="button"
    role="tab"
    …
    tabIndex={selected ? 0 : -1}
```

Roving tabindex with no fallback: when `visibleGroup` is `null`, no group matches, so all 8 tabs get `-1`.

Failure: search `zzz` (or hit F2's stuck state). `filteredGroups` is `[]` → `visibleGroup` is `null` → every tab is `tabIndex={-1}` and the whole tablist is skipped by <kbd>Tab</kbd>. A keyboard user cannot reach the product tabs; recovery depends on finding the "پاک‌کردن جست‌وجو" button at `:1031`. The tabs also keep `aria-controls="panel-<id>"` pointing at a `tabpanel` that no longer exists in the DOM.

---

### F16 · P3 — The VAT switch is duplicated once per factory card

`app/RebarPrices.tsx:449-455`:

```jsx
{visibleFactories.map((factory) => (
  <section className="factory-price-card" key={factory.name}>
    <header>
      <TaxSwitch
        checked={taxIncluded}
        onChange={() => setTaxIncluded((current) => !current)}
      />
```

One piece of state, N identical controls. Failure: open قیمت میلگرد آجدار and press "نمایش ۲۱ کارخانه دیگر" (`:578-588`) — 27 factory cards render, each with its own `role="switch"` labelled "ارزش افزوده". A screen-reader user hears 27 identical switches; toggling any one flips all of them, and there is no cue that they are the same control.

---

### F17 · P3 — 24 hardcoded catalog rows that only matter when things are broken

`app/IronDemo.tsx:77-81` and equivalents for the other 7 groups:

```js
rows: [
  { product: "میلگرد آجدار", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
  { product: "میلگرد ساده", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
  { product: "کلاف میلگرد", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
],
```

`ProductGroup.rows` is never rendered — the panel renders `PriceCatalog`, and `visibleGroup` is used only for `.id`. Its sole consumer is `filterProductGroups`, which is a no-op when the query is empty. So these 24 rows only have an observable effect in exactly the two states from F2 — where their effect is to produce the *wrong* empty state.

`tests/site-logic.test.mjs:9-24` hides this by using a fixture that doesn't match production:

```js
{ product: "میلگرد آجدار ۱۶", origin: "کارخانه معتبر", unit: "کیلوگرم" },
```

The fixture has a size in the product name; the real data doesn't. So `filterProductGroups(groups, "16")` passes at `:41-45` while the production array returns 0 groups for the same query.

---

### F18 · P3 — Search filters the corpus twice

`app/IronDemo.tsx:517-518` filters eagerly:

```js
setSearchGroups(groups);
const results = filterProductGroups(groups, query);
```

and `:336-339` filters again in the memo once `searchGroups` commits. Measured: ~9.3 ms for two passes over the 1,105-row corpus, so ~4.6 ms is pure waste — small now, but it scales with the upstream catalog (F11) and lands on the main thread in the same tick as a large state commit.

---

### F19 · P3 — Dead preloader hook and dead root id

`public/preloader/fb-preloader.js:34` and `:51`:

```js
root.classList.add("fb-preloader-complete");
```

Grepping `fb-preloader-complete` across all `.css`, `.tsx`, `.js`, `.html`, `.mjs` (excluding `node_modules`, `dist`, `pages-dist`) matches only these two writes — no CSS rule, no JS read. Same for `id="fb-site"` at `app/IronDemo.tsx:582`: the only other match is the negative assertion at `tests/source-contract.test.mjs:61`.

Not a live bug — the page is visible by default, so removing them changes nothing. Worth noting because the pair reads like a visibility gate, and someone could reasonably assume `#fb-site` is hidden until `fb-preloader-complete` lands.

---

### F20 · P3 — `compareSizeValues` is not a valid comparator

`scripts/fetch-product-prices.mjs:196-203`:

```js
function compareSizeValues(first, second) {
  const firstNumber = Number.parseFloat(String(first).replace(/[^\d.]/g, ""));
  const secondNumber = Number.parseFloat(String(second).replace(/[^\d.]/g, ""));
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }
  return String(first).localeCompare(String(second), "fa");
}
```

Two different orderings depending on the pair: numeric when both sides contain a digit, Persian collation otherwise. That makes the comparator non-transitive (`a < b` numerically, `b < c` numerically, `c < a` by collation is reachable), and `Array.prototype.sort` with an inconsistent comparator produces an implementation-defined result.

Also, stripping non-digits mangles compound dimensions: `"1.5*1.5"` → `"1.51.5"` → `parseFloat` → `1.51`, and `"20*20"` → `2020`. So `filters.sizes` is ordered by digits-concatenated rather than by dimension.

Effect is cosmetic (dropdown order at `app/RebarPrices.tsx:647-651`) and the shipped data currently has no all-non-numeric size, so I can't point at a wrong ordering in today's output — the comparator is simply not sound. The rebar/beam scrapers have the milder version of the same issue: `.sort((a, b) => Number(a) - Number(b))` at `fetch-rebar-prices.mjs:155` and `fetch-beam-prices.mjs:149` returns `NaN` for any non-numeric size (all sizes are numeric there today).

---

### F21 · P3 — Most of the suite asserts source text, not behaviour

`tests/source-contract.test.mjs` reads component *source* as a string and regexes it. Representative, `:45-48`:

```js
assert.match(
  component,
  /const contactHref = isDirectCallDevice \? phones\[0\]\.href : "#phone-numbers"/,
);
```

This pins an exact line of source. Renaming `contactHref` fails the test while changing nothing; inverting the ternary passes it while breaking every call-to-action link on mobile. Same pattern at `:161-171`, `:197-215`, `:273-285` (~60 assertions of this shape).

A second group asserts the absence of strings that never existed — `tests/catalog-ui.test.mjs:129-130`:

```js
assert.equal(within(table).queryByText("نمودار"), null);
assert.equal(within(table).queryByLabelText("روند قیمت"), null);
```

These cannot fail against any plausible edit and carry no information.

The suite does contain real behavioural tests — `catalog-ui.test.mjs` renders `PriceCatalog` and drives it with `user-event`, and `catalog-data.test.mjs` runs the validator over the shipped payloads. Those are the ones that would have caught F1 and F4 had they asserted on rendered numbers; the source-regex layer is what creates the false sense that 22 green tests cover this code.

---

## 3. Checked and clean

Recording these so the negatives are on the record:

- **Injection / XSS**: no `dangerouslySetInnerHTML`, no `eval`, no `new Function`. The one `innerHTML` (`public/preloader/fb-preloader.js:75`) is a static literal. Scraped strings only ever reach React text nodes. `href` values are hardcoded (`tel:`, `#anchor`) except `sourceUrl` — see F10.
- **Secrets**: no tokens, keys, or credentials in tracked files; `.gitignore:19-21` covers `.env*`; the workflow uses no secrets beyond the default `GITHUB_TOKEN`.
- **Concurrency**: single-threaded client. `submitSearch` can overlap itself, but the shared memoised promise means both continuations resolve to the same value and the later one wins — no torn state found. The four module-level promise caches are init-once (F3 is their failure mode, not a race).
- **Resource safety**: `setInterval` (`app/IronDemo.tsx:361-364`), `document` listeners (`:379-384`), `matchMedia` listeners (`:252-256`), and the preloader's `watchdog` (`fb-preloader.js:41`) are all cleaned up. `let active` guards prevent post-unmount `setState` in all four loaders. `expandedRows` is reset on category change (`app/RebarPrices.tsx:288`). No file handles left open — the scrapers write via `writeFile` + `rename`.
- **Data integrity / atomicity**: `writeFile(temporaryPath)` → `rename(outputPath)` is a correct atomic swap, and validation runs *before* the write in all three scrapers.
- **Trend/status contradictions**: 0 rows in the shipped data have `status: "same"` with a non-zero `percent`.
- **Mixed-unit categories**: correctly detected and the misleading stat cards suppressed (`app/RebarPrices.tsx:376-397` via `getCategoryPricingState`) — `beam` has both `شاخه` and `کیلوگرم` and is handled.
- **Breakpoint coupling**: the JS `(max-width: 900px)` at `app/IronDemo.tsx:327` matches the CSS `@media (max-width: 900px)` at `app/globals.css:1929`, and `[hidden] { display: none !important }` (`:77`) correctly beats `.primary-nav { display: flex }` (`:339`).
- **Workflow supply chain**: all five actions pinned to full SHAs, `permissions: {}` at top level with per-job least privilege, `--force-with-lease` on the data push.
- **`toAsciiDigits`**: the `[۰-۹٠-٩]` class correctly covers both U+06F0–U+06F9 and U+0660–U+0669.

Empty starter leftovers not worth a numbered finding: `build/`, `db/`, `drizzle/`, `worker/`, `examples/`, `.openai/` contain no files, and `.wrangler/` + `pages-dist/` are gitignored stale output — though `eslint.config.mjs:8` ignores only `dist/**` and `node_modules/**`, so `eslint .` still walks the stale `pages-dist/assets/index-OyjlyXYB.js` bundle.

---

Waiting for your approval before changing anything.
