import type { ProductCatalogId } from "./product-price-data";

export type ProductRow = {
  product: string;
  origin: string;
  unit: string;
  categoryId?: string;
  factory?: string;
  size?: string;
  searchText?: string;
};

export type ProductGroupId = "rebar" | "beam" | ProductCatalogId;

export type ProductGroup = {
  id: ProductGroupId;
  label: string;
  shortLabel: string;
  image: string;
  heroImage?: string;
  description: string;
  rows: ProductRow[];
  /** <title> for this category's landing page (scripts/generate-category-pages.mjs). */
  seoTitle: string;
  /** <meta name="description"> for this category's landing page. */
  seoDescription: string;
};

const liveProductCatalogIds: ProductCatalogId[] = [
  "sheet",
  "profile",
  "pipe",
  "angle",
  "channel",
  "wire",
];

export function isProductCatalogId(value: string): value is ProductCatalogId {
  return liveProductCatalogIds.includes(value as ProductCatalogId);
}

// rows is filled in by buildCatalogSearchGroups from the live catalogs. It is
// deliberately empty here: search only ever runs once those have loaded, so any
// placeholder listed at this level would be unreachable.
//
// This module has no React exports, so it also doubles as the source of truth
// for build-time tooling (see scripts/generate-category-pages.mjs) that needs
// each category's slug, label, and description without pulling in the app.
export const productGroups: ProductGroup[] = [
  {
    id: "rebar",
    label: "میلگرد",
    shortLabel: "میلگرد",
    image: "/categories/01-rebar.jpg",
    heroImage: "/categories/hero-rebar-1680.jpg",
    description: "میلگرد آجدار و ساده برای پروژه‌های ساختمانی و صنعتی",
    rows: [],
    seoTitle: "قیمت میلگرد آجدار و ساده امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز میلگرد آجدار، ساده، استیل و آلیاژی از کارخانه‌های معتبر. استعلام قیمت و درخواست پیش‌فاکتور میلگرد با مشاوره تلفنی.",
  },
  {
    id: "beam",
    label: "تیرآهن",
    shortLabel: "تیرآهن",
    image: "/categories/02-ibeam.jpg",
    heroImage: "/categories/hero-beam-1680.jpg",
    description: "تیرآهن IPE، هاش و مقاطع سازه‌ای",
    rows: [],
    seoTitle: "قیمت تیرآهن IPE و هاش امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز تیرآهن IPE و هاش از کارخانه‌های معتبر. استعلام قیمت و درخواست پیش‌فاکتور تیرآهن با مشاوره تلفنی.",
  },
  {
    id: "sheet",
    label: "ورق فولادی",
    shortLabel: "ورق",
    image: "/categories/03-sheet-coil.jpg",
    heroImage: "/categories/hero-sheet-1680.jpg",
    description: "ورق سیاه، گالوانیزه، روغنی و رنگی",
    rows: [],
    seoTitle: "قیمت ورق سیاه، گالوانیزه و رنگی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز ورق فولادی سیاه، گالوانیزه، روغنی و رنگی. استعلام قیمت و درخواست پیش‌فاکتور ورق با مشاوره تلفنی.",
  },
  {
    id: "profile",
    label: "قوطی و پروفیل",
    shortLabel: "پروفیل",
    image: "/categories/04-profile.jpg",
    description: "پروفیل ساختمانی و صنعتی در ابعاد گوناگون",
    rows: [],
    seoTitle: "قیمت پروفیل و قوطی ساختمانی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز قوطی و پروفیل ساختمانی و صنعتی در ابعاد گوناگون. استعلام قیمت و درخواست پیش‌فاکتور پروفیل با مشاوره تلفنی.",
  },
  {
    id: "pipe",
    label: "لوله فولادی",
    shortLabel: "لوله",
    image: "/categories/05-pipe.jpg",
    description: "لوله صنعتی، گازی و داربستی",
    rows: [],
    seoTitle: "قیمت لوله فولادی صنعتی و گازی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز لوله فولادی صنعتی، گازی و داربستی. استعلام قیمت و درخواست پیش‌فاکتور لوله با مشاوره تلفنی.",
  },
  {
    id: "angle",
    label: "نبشی",
    shortLabel: "نبشی",
    image: "/categories/06-angle.jpg",
    description: "نبشی بال مساوی و بال نامساوی",
    rows: [],
    seoTitle: "قیمت نبشی فولادی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز نبشی بال مساوی و بال نامساوی. استعلام قیمت و درخواست پیش‌فاکتور نبشی با مشاوره تلفنی.",
  },
  {
    id: "channel",
    label: "ناودانی",
    shortLabel: "ناودانی",
    image: "/categories/07-channel.jpg",
    description: "ناودانی سبک و سنگین برای مصارف سازه‌ای",
    rows: [],
    seoTitle: "قیمت ناودانی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز ناودانی سبک و سنگین برای مصارف سازه‌ای. استعلام قیمت و درخواست پیش‌فاکتور ناودانی با مشاوره تلفنی.",
  },
  {
    id: "wire",
    label: "مفتول و سیم",
    shortLabel: "مفتول",
    image: "/categories/08-wire.jpg",
    description: "مفتول سیاه، گالوانیزه و محصولات سیمی",
    rows: [],
    seoTitle: "قیمت مفتول و سیم فولادی امروز | بنیان فولاد داریا",
    seoDescription:
      "قیمت روز مفتول سیاه، گالوانیزه و محصولات سیمی. استعلام قیمت و درخواست پیش‌فاکتور مفتول با مشاوره تلفنی.",
  },
];

/**
 * Category landing pages (e.g. /rebar/) stamp this as a plain data attribute
 * on the root element so the price section opens on that category instead of
 * the default tab. It has to be a static attribute rather than an inline
 * script: the site's CSP is script-src 'self', which silently drops any
 * inline <script> with no matching nonce/hash.
 */
export function getInitialCategory(): ProductGroupId {
  const requested = document.getElementById("root")?.dataset.initialCategory;
  const match = requested && productGroups.find((group) => group.id === requested);
  return match ? match.id : productGroups[0].id;
}
