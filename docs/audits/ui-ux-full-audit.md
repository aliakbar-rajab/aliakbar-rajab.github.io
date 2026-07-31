# Repository Comprehensive UI/UX Audit Report — بنیان فولاد داریا (fouladbonyan.com)

> **Document Type:** UI/UX Repository Audit & Evaluation Report (Final QA Refined)
> **Target System:** بنیان فولاد داریا (`fouladbonyan.com`)
> **Audit Date:** July 31, 2026
> **Audit Scope:** Full repository analysis (16 static HTML user routes + dedicated 404 static page & client SPA fallback)
> **Execution Status:** Pure Audit & Report (0 source files modified, 0 commits/PRs created)

---

## 1. Executive Summary

### Overall System Assessment
The **بنیان فولاد داریا** web application demonstrates high architectural discipline, clean RTL Persian typography, CSP safety, and pre-rendered static performance. Built with React 19, Vite, and modular CSS, the application provides instantaneous static page loads for product category landings and informational pages.

- **Total Discovered Static User Routes:** 16 static HTML routes (1 Home, 1 Contact, 8 Product Categories, 6 Informational Pages).
- **Dedicated 404 Handling:** Dual-layer architecture:
  - **Static Output:** Dedicated standalone HTML file `dist/404.html` (generated from `public/404.html`, featuring CSP header, Vazirmatn font, and zero JS dependency).
  - **Client Routing:** `main.tsx` (L46) renders client-side `<App />` fallback on unrecognized pathnames.
- **Source & Build Verification:** 100% verified (`dist/<route>/index.html` exists for all 16 static routes + `dist/404.html`).
- **Automated Test Pipeline:** `npm run verify` passed with **48/48 unit & UI tests** and **5/5 build tests** green.
- **Dynamic Verification Status:** Unverified / Browser context unavailable (Playwright driver 404 error during browser context initialization; evaluated via static HTML/JSDOM component inspection).

### Summary of Audit Findings (Post-QA Calibration)
After rigorous QA calibration against exact WCAG 2.2 formulas and component pattern specifications:
- **P0 Critical:** 0
- **P1 High:** 0
- **P2 Medium:** 5 (FINDING-01, FINDING-02, FINDING-03, FINDING-06, FINDING-08)
- **P3 Low:** 4 (FINDING-05, FINDING-07, FINDING-09, FINDING-10)
- **Total Findings:** 9 *(FINDING-04 completely removed as source inspection confirmed no selector renders #65656c over #17171b dark backdrop)*.

---

## 2. Scope and Methodology

### Discovered Routes Breakdown (16 Static Routes + 404 Handling)
1. `/` — Homepage (`App.tsx`)
2. `/contact/` — Contact Page (`ContactPage.tsx`)
3. `/rebar/` — Category Landing: میلگرد (`rebar`)
4. `/beam/` — Category Landing: تیرآهن (`beam`)
5. `/sheet/` — Category Landing: ورق فولادی (`sheet`)
6. `/profile/` — Category Landing: قوطی و پروفیل (`profile`)
7. `/pipe/` — Category Landing: لوله فولادی (`pipe`)
8. `/angle/` — Category Landing: نبشی (`angle`)
9. `/channel/` — Category Landing: ناودانی (`channel`)
10. `/wire/` — Category Landing: مفتول و سیم (`wire`)
11. `/about/` — Informational: درباره ما (`about`)
12. `/terms/` — Informational: شرایط استفاده (`terms`)
13. `/privacy/` — Informational: حریم خصوصی (`privacy`)
14. `/quote-process/` — Informational & Form: درخواست پیش‌فاکتور (`quote-process`)
15. `/complaints/` — Informational & Form: ثبت شکایت (`complaints`)
16. `/shipping-delivery/` — Informational: شرایط ارسال و تحویل (`shipping-delivery`)
17. `[404 Handling]` — Standalone static HTML `dist/404.html` + client SPA fallback (`main.tsx` L46).

### Skill & Tool Execution Audit

#### Skills Loaded / Read
- **`chrome-devtools`** — Read SKILL.md for browser automation workflow patterns.
- **`modern-web-guidance`** — Read SKILL.md & executed CLI search for modern web guidelines.
- **`a11y-debugging`** — Read SKILL.md for accessibility testing guidelines.
- **`code-review`** — Read SKILL.md for standards and code quality heuristics.
- **`debug-optimize-lcp`** — Read SKILL.md for performance optimization guidelines.
- *Not Installed / Unused:* `research`, `responsive-design`, `ui-review` (Honestly reported as absent).

#### Tools Successfully Invoked
- **`run_command`** — Executed `git status`, `git diff --check`, `npm run verify`, `npx.cmd modern-web-guidance`, `vite preview`, Node measurement scripts.
- **`view_file`** — Inspected source components, styles, data schemas, `public/404.html`, and generator scripts.
- **`write_to_file`** — Created report documentation files in `docs/audits/`.
- **`grep_search`** — Queried codebase for ARIA attributes, styling rules, and selector usages.
- **`list_permissions`** — Inspected system tool permissions.
- **`manage_task`** — Managed background preview server process.
- *Failed Tool:* **`browser_subagent` / `open_browser_url`** (Encountered Playwright driver 404 download error from azureedge CDN).

---

## 3. Route Inventory & Verification Matrix

| Pathname | Route Type | Source Verified | Build Output Verified | Preview HTTP 200 | Browser Interaction |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `/` | Main Page | Yes (`App.tsx`) | Yes (`dist/index.html`) | Unverified | Unverified |
| `/contact/` | Contact Page | Yes (`ContactPage.tsx`) | Yes (`dist/contact/index.html`) | Unverified | Unverified |
| `/rebar/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/rebar/index.html`) | Unverified | Unverified |
| `/beam/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/beam/index.html`) | Unverified | Unverified |
| `/sheet/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/sheet/index.html`) | Unverified | Unverified |
| `/profile/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/profile/index.html`) | Unverified | Unverified |
| `/pipe/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/pipe/index.html`) | Unverified | Unverified |
| `/angle/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/angle/index.html`) | Unverified | Unverified |
| `/channel/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/channel/index.html`) | Unverified | Unverified |
| `/wire/` | Category Landing | Yes (`category-meta.ts`) | Yes (`dist/wire/index.html`) | Unverified | Unverified |
| `/about/` | Info Page | Yes (`info-page-data.ts`) | Yes (`dist/about/index.html`) | Unverified | Unverified |
| `/terms/` | Info Page | Yes (`info-page-data.ts`) | Yes (`dist/terms/index.html`) | Unverified | Unverified |
| `/privacy/` | Info Page | Yes (`info-page-data.ts`) | Yes (`dist/privacy/index.html`) | Unverified | Unverified |
| `/quote-process/`| Info & Form | Yes (`QuoteRequestForm.tsx`) | Yes (`dist/quote-process/index.html`) | Unverified | Unverified |
| `/complaints/` | Info & Form | Yes (`ComplaintForm.tsx`) | Yes (`dist/complaints/index.html`) | Unverified | Unverified |
| `/shipping-delivery/`| Info Page | Yes (`info-page-data.ts`) | Yes (`dist/shipping-delivery/index.html`)| Unverified | Unverified |
| `[404 Handling]` | Static 404 & SPA | Yes (`public/404.html`) | Yes (`dist/404.html`) | Unverified | Unverified |

---

## 4. Experience Scorecard (Internal Analytical Assessment)

> **Note:** Scores represent an **Internal Analytical Assessment** based on code inspection and unit test verification, rather than empirical live browser user measurements.

| Axis | Score | Formula / Basis | Uncertainty & Notes |
| :--- | :---: | :--- | :--- |
| **Navigation** | **4.0 / 5** | Roving tab focus (`ArrowLeft`/`Right`/`Home`/`End`) unit-tested; disclosure pattern in header. | Moderate: Mobile drawer focus trap requires live browser validation. |
| **Visual Hierarchy** | **4.5 / 5** | Vazirmatn typography scale, clear `SectionTitle` elements, brand yellow accents. | Low: CSS tokens & heading hierarchy verified in source. |
| **Responsive UX** | **3.8 / 5** | Container max-width (1200px), responsive breakpoints, sticky mobile bar. | High: Computed layout reflow & touch sizes require live browser viewport testing. |
| **Accessibility** | **3.8 / 5** | Landmarks present, `skip-link` wired, table headers defined, `aria-invalid` & `aria-describedby` set. | Moderate: Screen reader auditory feedback requires live AT testing. |
| **Forms** | **4.2 / 5** | Local non-binding draft preparation, `aria-describedby` error wiring, focus-to-first-error. | Low: Form validation and state management unit-tested in React. |
| **Content Clarity** | **4.8 / 5** | Persian microcopy, clear disclaimers regarding price volatility. | Low: Content strings verified in source. |
| **Consistency** | **4.4 / 5** | Central design tokens (`--brand-yellow`, `--ink`, `--surface`), unified `Brand` component. | Low: Style tokens verified in `base.css`. |
| **Performance Perception**| **4.2 / 5** | Static pre-rendering for all 16 routes; code-split pricing bundles. | Moderate: Real LCP/CLS metrics require Chrome performance trace. |
| **Trust** | **4.0 / 5** | Real phones, postal code, Neshan/Google/Waze map URLs. | Low: Business details verified in `site-config.ts`. |
| **RTL Quality** | **4.7 / 5** | `dir="rtl"` root setting, Vazirmatn font display, `dir="ltr"` for phone numbers. | Low: Source contract tested in unit tests. |

**Overall Experience Index:** **4.24 / 5.0** *(Internal Analytical Index)*

---

## 5. Detailed Findings & Calibrated Evaluations

### FINDING-01 [P2 Medium] — Mobile Navigation Disclosure Pattern Consistency
- **ID:** FINDING-01
- **Severity:** P2 Medium
- **Confidence:** Medium
- **Route:** `/contact/, /about/`
- **Component:** `ContactPage.tsx`
- **Category:** `Navigation / Accessibility`
- **Analysis:** Inner page headers implement a standard Navigation Disclosure pattern (`aria-expanded` + `aria-controls` toggling `hidden` on `<nav>`). Adding an `Escape` key listener to close the disclosure improves keyboard usability.
- **Source Evidence:** `ContactPage.tsx` L73–82 (`<button className="nav-toggle" aria-expanded={mobileNavOpen} aria-controls="primary-navigation">`).
- **Recommendation:** Add Escape key listener to navigation disclosure toggle
- **Effort:** S | **Dependencies:** None

---

### FINDING-02 [P2 Medium] — Top-Level Form Submission Error Alert Summary
- **ID:** FINDING-02
- **Severity:** P2 Medium
- **Confidence:** Medium
- **Route:** `/quote-process/, /complaints/`
- **Component:** `QuoteRequestForm.tsx`
- **Category:** `Forms / Accessibility`
- **Analysis:** Form fields associate error messages via `aria-describedby` and set `aria-invalid`, while JS moves focus to the first invalid field. Adding a top-level form submission error summary container with `role="alert"` provides optimal submission feedback.
- **Source Evidence:** `QuoteRequestForm.tsx` L504–507 (`aria-describedby={errors.fullName ? "quote-name-error" : undefined}`).
- **Recommendation:** Add top-level form submission alert summary with role=alert
- **Effort:** S | **Dependencies:** None

---

### FINDING-03 [P2 Medium] — Mobile Product Tab Bar Scroll Affordance
- **ID:** FINDING-03
- **Severity:** P2 Medium
- **Confidence:** Medium
- **Route:** `/, /rebar/, Category Pages`
- **Component:** `App.tsx`
- **Category:** `Mobile UX Discoverability`
- **Analysis:** The horizontal scroll container `.product-tabs-viewport` holds 8 product category tabs. On mobile devices where scrollbars are hidden by default, users lack visual cues that additional tabs exist off-screen.
- **Source Evidence:** `globals/header.css` (`.product-tabs-viewport { overflow-x: auto; scrollbar-width: none; }`).
- **Recommendation:** Add CSS linear gradient mask indicator on tab scroll edges
- **Effort:** S | **Dependencies:** None

---

### FINDING-05 [P3 Low] — Optional Sticky Title Column Proposal for Mobile Price Tables
- **ID:** FINDING-05
- **Severity:** P3 Low
- **Confidence:** Low
- **Route:** `/rebar/, /beam/, Category Pages`
- **Component:** `RebarPrices.tsx`
- **Category:** `Mobile Table Usability (Proposal)`
- **Analysis:** Proposal to evaluate `position: sticky; right: 0` for the product title column in dense price tables during horizontal scroll on mobile viewports.
- **Source Evidence:** `RebarPrices.tsx` L600–750.
- **Recommendation:** Evaluate sticky title column for mobile price tables
- **Effort:** M | **Dependencies:** Browser testing required.

---

### FINDING-06 [P2 Medium] — Focus Management on Dynamic Line Item Removal
- **ID:** FINDING-06
- **Severity:** P2 Medium
- **Confidence:** Medium
- **Route:** `/quote-process/`
- **Component:** `QuoteRequestForm.tsx`
- **Category:** `Forms / Keyboard Focus`
- **Analysis:** Removing a line item fieldset from DOM without explicitly reassigning focus may cause loss of predictable focus order in some browsers.
- **Source Evidence:** `QuoteRequestForm.tsx` L318–325.
- **Recommendation:** Shift focus to Add Item button upon line item deletion
- **Effort:** S | **Dependencies:** None

---

### FINDING-07 [P3 Low] — Product Prices Bundle Size & Chunk Optimization
- **ID:** FINDING-07
- **Severity:** P3 Low
- **Confidence:** High
- **Route:** `Category Landing Pages (sheet, profile, pipe, angle, channel, wire)`
- **Component:** `ProductPrices.tsx`
- **Category:** `Build & Performance`
- **Measured Metrics:**
  - Raw Bundle Size: **750.67 kB** (750,668 bytes)
  - gzip Compressed: **34.99 kB** (35,825 bytes)
  - Brotli Compressed: **19.46 kB** (19,927 bytes)
- **Import Evidence:** `product-price-data.ts` line 32 (`import("./data/product-prices.json")`). Called dynamically in `App.tsx` via `loadCatalogSearchGroups` during search submission and when viewing 6 product catalog tabs. Real network transfer, parse, and execution cost remain unverified without Chrome Performance trace.
- **Recommendation:** Code-split product-prices payload per catalog via dynamic import
- **Effort:** M | **Dependencies:** None

---

### FINDING-08 [P2 Medium] — Customer-Facing Phrasing for Unset Owner Data Placeholders
- **ID:** FINDING-08
- **Severity:** P2 Medium
- **Confidence:** High
- **Route:** `/contact/, /about/`
- **Component:** `ContactPage.tsx`
- **Category:** `Content & Brand Trust`
- **Analysis:** `officialEmail` and `workingHours` display internal developer text (`"پس از اعلام و تأیید مالک سایت درج می‌شود."`).
- **Source Evidence:** `ContactPage.tsx` L152–168.
- **Recommendation:** Replace developer placeholder text with customer-facing text
- **Effort:** S | **Dependencies:** None

---

### FINDING-09 [P3 Low] — Footer Touch Target Padding Enhancement
- **ID:** FINDING-09
- **Severity:** P3 Low
- **Confidence:** Medium
- **Route:** `All Pages (Footer)`
- **Component:** `SiteFooter.tsx`
- **Category:** `Usability Best Practice (SC 2.5.8)`
- **Analysis:** Estimated from declared CSS: footer link touch targets have ~30px height, passing WCAG 2.2 SC 2.5.8 AA minimum (24px) but benefiting from additional padding for 44/48px usability guidelines.
- **Source Evidence:** `globals/footer.css` L40–90.
- **Recommendation:** Add vertical padding padding:0.5rem 0 to footer links
- **Effort:** S | **Dependencies:** None

---

### FINDING-10 [P3 Low] — Compound Field Border Alignment in RTL (Unverified Inspection Item)
- **ID:** FINDING-10
- **Severity:** P3 Low
- **Confidence:** Low
- **Route:** `/quote-process/`
- **Component:** `QuoteRequestForm.tsx`
- **Category:** `Visual Alignment (Unverified)`
- **Analysis:** Source code review indicates potential subtle border-radius overlap alignment in RTL compound fields under zoom. Listed as an unverified visual inspection item requiring live browser verification.
- **Source Evidence:** `globals/forms.css` L80–130.
- **Recommendation:** Use CSS flex layout with logical border-radius properties
- **Effort:** S | **Dependencies:** WebKit browser visual verification required.

---

## 6. Matrix Parity Table (Markdown vs CSV 1-to-1 Match)

| Finding ID | Severity | Confidence | Route | Component | Category | Recommendation | Effort |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| **FINDING-01** | P2 | Medium | `/contact/, /about/` | `ContactPage.tsx` | Navigation / Accessibility | Add Escape key listener to navigation disclosure toggle | S |
| **FINDING-02** | P2 | Medium | `/quote-process/, /complaints/` | `QuoteRequestForm.tsx` | Forms / Accessibility | Add top-level form submission alert summary with role=alert | S |
| **FINDING-03** | P2 | Medium | `/, /rebar/, Category Pages` | `App.tsx` | Mobile UX Discoverability | Add CSS linear gradient mask indicator on tab scroll edges | S |
| **FINDING-05** | P3 | Low | `/rebar/, /beam/, Category Pages` | `RebarPrices.tsx` | Mobile Table Usability (Proposal) | Evaluate sticky title column for mobile price tables | M |
| **FINDING-06** | P2 | Medium | `/quote-process/` | `QuoteRequestForm.tsx` | Forms / Keyboard Focus | Shift focus to Add Item button upon line item deletion | S |
| **FINDING-07** | P3 | High | `Category Landing Pages (sheet, profile, pipe, angle, channel, wire)` | `ProductPrices.tsx` | Build & Performance | Code-split product-prices payload per catalog via dynamic import | M |
| **FINDING-08** | P2 | High | `/contact/, /about/` | `ContactPage.tsx` | Content & Brand Trust | Replace developer placeholder text with customer-facing text | S |
| **FINDING-09** | P3 | Medium | `All Pages (Footer)` | `SiteFooter.tsx` | Usability Best Practice (SC 2.5.8) | Add vertical padding padding:0.5rem 0 to footer links | S |
| **FINDING-10** | P3 | Low | `/quote-process/` | `QuoteRequestForm.tsx` | Visual Alignment (Unverified) | Use CSS flex layout with logical border-radius properties | S |

---

## 7. Verification & Unverified Areas Log

1. **Verified Statically / Build Output:** All 16 static HTML routes (`dist/<route>/index.html`), standalone static 404 HTML (`dist/404.html`), sitemap generation, structured JSON-LD data, React form validation logic, and measured bundle compression sizes (Gzip & Brotli).
2. **Unverified Areas (Requires Live Browser / DevTools):** Preview HTTP 200 responses per route, real Playwright browser automation trace, live WebKit zoom visual rendering, VoiceOver/NVDA screen reader auditory announcements, and actual touch target interactions on mobile devices.
