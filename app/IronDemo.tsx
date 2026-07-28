import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { filterProductGroups } from "./site-logic.mjs";
import { buildCatalogSearchGroups } from "./catalog-search.mjs";
import { createRetryableLoader } from "./catalog-cache";
import { loadBeamPriceData, loadRebarPriceData } from "./catalog-data";
import RebarPrices, { type RebarViewRequest } from "./RebarPrices";
import BeamPrices, { type BeamViewRequest } from "./BeamPrices";
import ProductPrices from "./ProductPrices";
import { localizeCatalogValue } from "./catalog-utils";
import {
  loadProductPriceCatalog,
  loadProductPricePayload,
  type ProductCatalogId,
  type ProductPriceCatalog,
  type ProductViewRequest,
} from "./product-price-data";
import {
  getInitialCategory,
  isProductCatalogId,
  productGroups,
  type ProductGroup,
  type ProductGroupId,
} from "./category-meta";

const phones = [
  { label: "021-88888280", href: "tel:+982188888280" },
  { label: "021-88888780", href: "tel:+982188888780" },
  { label: "021-88888122", href: "tel:+982188888122" },
  { label: "021-88889005", href: "tel:+982188889005" },
  { label: "021-88889006", href: "tel:+982188889006" },
  { label: "09123300815", href: "tel:+989123300815", name: "علی اسماعیل‌پور" },
];

const address =
  "آجودانیه پورابتهاج نبش لشکری ساختمان سرو واحد ۳۰۳";

const heroSlides = productGroups.slice(0, 3);
const HERO_SLIDE_INTERVAL_MS = 1_700;

const loadCatalogSearchGroups = createRetryableLoader<ProductGroup[]>(() =>
  Promise.all([
    loadRebarPriceData(),
    loadBeamPriceData(),
    loadProductPricePayload(),
  ]).then(([rebar, beam, products]) =>
    buildCatalogSearchGroups(productGroups, { rebar, beam, products }),
  ),
);

const rebarTypeLinks: Array<{
  id: NonNullable<RebarViewRequest["categoryId"]>;
  label: string;
}> = [
  { id: "ribbed", label: "قیمت میلگرد آجدار" },
  { id: "simple", label: "قیمت میلگرد ساده" },
  { id: "stainless", label: "قیمت میلگرد استیل" },
  { id: "alloy", label: "قیمت میلگرد آلیاژی" },
];

const rebarFactories = [
  "ذوب آهن",
  "میانه",
  "شاهین بناب",
  "نیشابور",
  "راد همدان",
  "ظفر بناب",
  "زاگرس",
  "ابهر",
  "ابرکوه",
  "آناهیتا گیلان",
  "شاهرود",
  "کوثر اهواز",
  "امیرکبیر",
  "فایکو",
  "کویر کاشان",
  "اروند",
];

const rebarSizes = [
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "25",
  "28",
  "32",
  "36",
  "40",
];

const beamTypeLinks: Array<{
  id: NonNullable<BeamViewRequest["categoryId"]>;
  label: string;
}> = [
  { id: "beam", label: "قیمت تیرآهن" },
  { id: "hash", label: "قیمت هاش" },
];

const beamFactories = [
  "ذوب آهن",
  "یزد",
  "فایکو",
  "ناب تبریز",
  "شاهین بناب",
  "کرمانشاه",
  "ماهان",
  "اهواز",
];

const beamSizes = ["12", "14", "16", "18", "20", "22", "24", "27", "30"];

function subscribeToMedia(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => subscribeToMedia(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function Brand({ headerLogo = false }: { headerLogo?: boolean }) {
  return (
    <a
      className={`brand${headerLogo ? " brand-header-logo" : ""}`}
      href="#top"
      aria-label="بنیان فولاد داریا، صفحه اصلی"
    >
      {headerLogo ? (
        <img
          src="/brand/bonyan-foulad-daria-logo.png"
          alt=""
          width="1254"
          height="1254"
          decoding="async"
          fetchPriority="high"
        />
      ) : (
        <>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-copy">
            <strong>بنیان فولاد داریا</strong>
            <span>BONYAN FOULAD DARIA</span>
          </span>
        </>
      )}
    </a>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export default function IronDemo() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [megaProduct, setMegaProduct] = useState<ProductGroupId>("rebar");
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [activeGroup, setActiveGroup] = useState(getInitialCategory);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [searchGroups, setSearchGroups] = useState<ProductGroup[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadedMegaCatalog, setLoadedMegaCatalog] =
    useState<ProductPriceCatalog | null>(null);
  const [megaCatalogError, setMegaCatalogError] =
    useState<ProductCatalogId | null>(null);
  const [rebarViewRequest, setRebarViewRequest] = useState<RebarViewRequest>({
    requestId: 0,
  });
  const [beamViewRequest, setBeamViewRequest] = useState<BeamViewRequest>({
    requestId: 0,
  });
  const [productViewRequest, setProductViewRequest] =
    useState<ProductViewRequest>({
      requestId: 0,
    });

  const isMobile = useMediaQuery("(max-width: 900px)");
  const isDirectCallDevice = useMediaQuery(
    "(max-width: 900px) and (hover: none) and (pointer: coarse)",
  );
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const contactHref = isDirectCallDevice ? phones[0].href : "#phone-numbers";
  const productMenuRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filteredGroups = useMemo(
    () => filterProductGroups(searchGroups ?? productGroups, committedSearch),
    [committedSearch, searchGroups],
  );

  const visibleGroup =
    filteredGroups.find((group) => group.id === activeGroup) ??
    filteredGroups[0] ??
    null;
  const megaCatalog =
    isProductCatalogId(megaProduct) && loadedMegaCatalog?.id === megaProduct
      ? loadedMegaCatalog
      : null;
  const megaCatalogLoading =
    isProductCatalogId(megaProduct) &&
    !megaCatalog &&
    megaCatalogError !== megaProduct;
  const megaInitialCategory = megaCatalog
    ? (megaCatalog.categories.find(
        (category) => category.id === megaCatalog.initialCategoryId,
      ) ?? megaCatalog.categories[0])
    : null;

  useEffect(() => {
    if (reduceMotion || carouselPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, HERO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [carouselPaused, reduceMotion]);

  useEffect(() => {
    if (!productsOpen) return undefined;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) {
        setProductsOpen(false);
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setProductsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [productsOpen]);

  useEffect(() => {
    if (!productsOpen || !isProductCatalogId(megaProduct)) {
      return undefined;
    }
    let active = true;
    loadProductPriceCatalog(megaProduct)
      .then((catalog) => {
        if (active) {
          setLoadedMegaCatalog(catalog);
          setMegaCatalogError(null);
        }
      })
      .catch(() => {
        if (active) setMegaCatalogError(megaProduct);
      });
    return () => {
      active = false;
    };
  }, [megaProduct, productsOpen]);

  const resetGroupView = (groupId: ProductGroupId) => {
    if (groupId === "rebar") {
      setRebarViewRequest((current) => ({
        requestId: current.requestId + 1,
        categoryId: "ribbed",
      }));
    } else if (groupId === "beam") {
      setBeamViewRequest((current) => ({
        requestId: current.requestId + 1,
        categoryId: "beam",
      }));
    } else if (isProductCatalogId(groupId)) {
      setProductViewRequest((current) => ({
        requestId: current.requestId + 1,
      }));
    }
  };

  const goToGroup = (groupId: ProductGroupId) => {
    setCommittedSearch("");
    setSearchInput("");
    setSearchMessage("");
    setActiveGroup(groupId);
    resetGroupView(groupId);
    setProductsOpen(false);
    setMobileNavOpen(false);
    document.getElementById("prices")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const goToRebarView = (
    view: Omit<RebarViewRequest, "requestId">,
  ) => {
    setCommittedSearch("");
    setSearchInput("");
    setSearchMessage("");
    setActiveGroup("rebar");
    setRebarViewRequest((current) => ({
      ...view,
      requestId: current.requestId + 1,
    }));
    setProductsOpen(false);
    setMobileNavOpen(false);
    document.getElementById("prices")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const goToBeamView = (view: Omit<BeamViewRequest, "requestId">) => {
    setCommittedSearch("");
    setSearchInput("");
    setSearchMessage("");
    setActiveGroup("beam");
    setBeamViewRequest((current) => ({
      ...view,
      requestId: current.requestId + 1,
    }));
    setProductsOpen(false);
    setMobileNavOpen(false);
    document.getElementById("prices")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const goToProductView = (
    catalogId: ProductCatalogId,
    view: Omit<ProductViewRequest, "requestId">,
  ) => {
    setCommittedSearch("");
    setSearchInput("");
    setSearchMessage("");
    setActiveGroup(catalogId);
    setProductViewRequest((current) => ({
      ...view,
      requestId: current.requestId + 1,
    }));
    setProductsOpen(false);
    setMobileNavOpen(false);
    document.getElementById("prices")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setCommittedSearch("");
      setSearchGroups(null);
      setActiveGroup(productGroups[0].id);
      resetGroupView(productGroups[0].id);
      setSearchMessage("همه محصولات نمایش داده می‌شوند.");
    } else {
      setSearchLoading(true);
      setSearchMessage(`در حال جست‌وجوی «${query}»…`);
      let groups: ProductGroup[];
      try {
        groups = await loadCatalogSearchGroups();
      } catch {
        // committedSearch is deliberately left alone: applying it while
        // searchGroups is still null filters the placeholder rows in
        // productGroups, which match nothing, so the whole price section would
        // collapse into "no products found" instead of showing this message.
        setSearchMessage(
          "دریافت فهرست زنده محصولات ممکن نشد. لطفاً دوباره تلاش کنید.",
        );
        setSearchLoading(false);
        return;
      }
      // Commit the query only now that the live rows it will be matched against
      // are available, so no render ever pairs a query with the placeholders.
      setSearchGroups(groups);
      setCommittedSearch(query);
      const results = filterProductGroups(groups, query);
      if (results.length > 0) {
      const resultGroupId = results[0].id as ProductGroupId;
      const firstRow = results[0].rows[0];
      setActiveGroup(resultGroupId);
      if (resultGroupId === "rebar") {
        setRebarViewRequest((current) => ({
          requestId: current.requestId + 1,
          categoryId: firstRow.categoryId as RebarViewRequest["categoryId"],
          factory: firstRow.factory,
          size: firstRow.size,
        }));
      } else if (resultGroupId === "beam") {
        setBeamViewRequest((current) => ({
          requestId: current.requestId + 1,
          categoryId: firstRow.categoryId as BeamViewRequest["categoryId"],
          factory: firstRow.factory,
          size: firstRow.size,
        }));
      } else {
        setProductViewRequest((current) => ({
          requestId: current.requestId + 1,
          categoryId: firstRow.categoryId,
          factory: firstRow.factory,
          size: firstRow.size,
        }));
      }
      const count = results.reduce((sum, group) => sum + group.rows.length, 0);
      setSearchMessage(`${count.toLocaleString("fa-IR")} نتیجه برای «${query}» پیدا شد.`);
      } else {
        setSearchMessage(`نتیجه‌ای برای «${query}» پیدا نشد.`);
      }
      setSearchLoading(false);
    }
    document.getElementById("prices")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const moveTabFocus = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let target: number;
    if (event.key === "ArrowLeft") target = (currentIndex + 1) % productGroups.length;
    else if (event.key === "ArrowRight") {
      target = (currentIndex - 1 + productGroups.length) % productGroups.length;
    } else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = productGroups.length - 1;
    else return;

    event.preventDefault();
    const group = productGroups[target];
    setCommittedSearch("");
    setSearchInput("");
    setActiveGroup(group.id);
    resetGroupView(group.id);
    tabRefs.current[target]?.focus();
  };

  const slide = heroSlides[activeSlide];

  return (
    <div id="fb-site">
      <a className="skip-link" href="#main-content">
        رفتن به محتوای اصلی
      </a>

      <div className="utility-bar" id="top">
        <div className="shell utility-inner">
          <p>مشاوره و استعلام تلفنی محصولات فولادی</p>
          <div aria-label="شماره‌های تماس">
            {phones.map((phone) => (
              <a
                href={phone.href}
                key={phone.href}
                dir={phone.name ? undefined : "ltr"}
              >
                {phone.name ? (
                  <>
                    {phone.name}: <span dir="ltr">{phone.label}</span>
                  </>
                ) : (
                  phone.label
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="shell header-main">
          <Brand headerLogo />

          <form className="site-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="site-search">
              جست‌وجوی محصول
            </label>
            <input
              id="site-search"
              type="search"
              placeholder="جست‌وجوی میلگرد، ورق، تیرآهن و…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button
              type="submit"
              aria-label="جست‌وجو"
              disabled={searchLoading}
            >
              {searchLoading ? "در حال جست‌وجو…" : "جست‌وجو"}
            </button>
          </form>

          <a className="header-phone" href={contactHref}>
            <span aria-hidden="true">☎</span>
            <span>
              <small>تماس با واحد فروش</small>
              <b dir="ltr">{phones[0].label}</b>
            </span>
          </a>

          <button
            className="nav-toggle"
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span>
            <span className="sr-only">فهرست اصلی</span>
          </button>
        </div>

        <div className="nav-wrap">
          <nav
            className="shell primary-nav"
            id="primary-navigation"
            aria-label="فهرست اصلی"
            hidden={isMobile && !mobileNavOpen}
          >
            <a href="#top" onClick={() => setMobileNavOpen(false)}>
              صفحه اصلی
            </a>
            <div className="products-menu" ref={productMenuRef}>
              <button
                type="button"
                aria-expanded={productsOpen}
                aria-controls="product-navigation"
                onClick={() => {
                  const nextOpen = !productsOpen;
                  if (nextOpen) {
                    setMegaProduct(activeGroup);
                  }
                  setProductsOpen(nextOpen);
                }}
              >
                قیمت روز محصولات <span aria-hidden="true">⌄</span>
              </button>
              {productsOpen ? (
                <div
                  id="product-navigation"
                  className="product-dropdown rebar-mega-menu"
                >
                  {megaProduct === "rebar" ? (
                    <>
                      <section className="mega-rebar-types">
                        <h2>انواع میلگرد</h2>
                        {rebarTypeLinks.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() =>
                              goToRebarView({ categoryId: item.id })
                            }
                          >
                            {item.label}
                          </button>
                        ))}
                      </section>

                      <section className="mega-rebar-factories">
                        <h2>کارخانه‌های میلگرد</h2>
                        <div>
                          {rebarFactories.map((factory) => (
                            <button
                              type="button"
                              key={factory}
                              onClick={() =>
                                goToRebarView({
                                  categoryId: "ribbed",
                                  factory:
                                    factory === "ابهر"
                                      ? "سیادن ابهر"
                                      : factory,
                                })
                              }
                            >
                              میلگرد {factory}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="mega-rebar-sizes">
                        <h2>سایزهای میلگرد</h2>
                        <div>
                          {rebarSizes.map((size) => (
                            <button
                              type="button"
                              key={size}
                              onClick={() =>
                                goToRebarView({
                                  categoryId: "ribbed",
                                  size,
                                })
                              }
                            >
                              میلگرد {Number(size).toLocaleString("fa-IR")}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : megaProduct === "beam" ? (
                    <>
                      <section className="mega-rebar-types">
                        <h2>انواع تیرآهن</h2>
                        {beamTypeLinks.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() =>
                              goToBeamView({ categoryId: item.id })
                            }
                          >
                            {item.label}
                          </button>
                        ))}
                      </section>

                      <section className="mega-rebar-factories">
                        <h2>کارخانه‌های تیرآهن</h2>
                        <div>
                          {beamFactories.map((factory) => (
                            <button
                              type="button"
                              key={factory}
                              onClick={() =>
                                goToBeamView({
                                  categoryId: "beam",
                                  factory,
                                })
                              }
                            >
                              تیرآهن {factory}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="mega-rebar-sizes">
                        <h2>سایزهای تیرآهن</h2>
                        <div>
                          {beamSizes.map((size) => (
                            <button
                              type="button"
                              key={size}
                              onClick={() =>
                                goToBeamView({
                                  categoryId: "beam",
                                  size,
                                })
                              }
                            >
                              تیرآهن {Number(size).toLocaleString("fa-IR")}
                            </button>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : megaCatalog && megaInitialCategory ? (
                    <>
                      <section className="mega-rebar-types">
                        <h2>انواع {megaCatalog.label}</h2>
                        {megaCatalog.categories.map((category) => (
                          <button
                            type="button"
                            key={category.id}
                            onClick={() =>
                              goToProductView(megaProduct, {
                                categoryId: category.id,
                              })
                            }
                          >
                            قیمت {category.label}
                          </button>
                        ))}
                      </section>

                      <section className="mega-rebar-factories">
                        <h2>
                          {megaInitialCategory.groupingLabel}‌های{" "}
                          {megaCatalog.label}
                        </h2>
                        <div>
                          {megaInitialCategory.filters.factories
                            .slice(0, 16)
                            .map((factory) => (
                              <button
                                type="button"
                                key={factory}
                                onClick={() =>
                                  goToProductView(megaProduct, {
                                    categoryId: megaCatalog.initialCategoryId,
                                    factory,
                                  })
                                }
                              >
                                {megaCatalog.label} {factory}
                              </button>
                            ))}
                        </div>
                      </section>

                      <section className="mega-rebar-sizes">
                        <h2>سایزهای {megaCatalog.label}</h2>
                        <div>
                          {megaInitialCategory.filters.sizes
                            .slice(0, 16)
                            .map((size) => (
                              <button
                                type="button"
                                key={size}
                                onClick={() =>
                                  goToProductView(megaProduct, {
                                    categoryId: megaCatalog.initialCategoryId,
                                    size,
                                  })
                                }
                              >
                                {megaCatalog.label}{" "}
                                {localizeCatalogValue(size)}
                              </button>
                            ))}
                        </div>
                      </section>
                    </>
                  ) : megaCatalogLoading ? (
                    <p className="catalog-load-state" role="status">
                      در حال دریافت فهرست محصولات…
                    </p>
                  ) : (
                    <p className="catalog-load-state" role="alert">
                      دریافت فهرست این گروه ممکن نشد.
                    </p>
                  )}

                  <section className="mega-other-products">
                    <h2>گروه محصولات</h2>
                    <div>
                      {productGroups.map((group) => (
                          <button
                            type="button"
                            key={group.id}
                            aria-pressed={megaProduct === group.id}
                            onClick={() => setMegaProduct(group.id)}
                          >
                            قیمت {group.label}
                          </button>
                        ))}
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
            <a href="#prices" onClick={() => setMobileNavOpen(false)}>
              راهنمای استعلام
            </a>
            <a href="#about" onClick={() => setMobileNavOpen(false)}>
              درباره ما
            </a>
            <a href={contactHref} onClick={() => setMobileNavOpen(false)}>
              تماس با ما
            </a>
            <a className="nav-quote" href={contactHref}>
              تماس برای استعلام
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <div className="hero-frame">
          <section
            className="hero"
            aria-roledescription="carousel"
            aria-label="محصولات منتخب بنیان فولاد داریا"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onFocus={() => setCarouselPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setCarouselPaused(false);
              }
            }}
          >
            {heroSlides.map((item, index) => (
              <img
                className={`hero-image${
                  index === activeSlide ? " is-active" : ""
                }`}
                src={item.heroImage ?? item.image}
                alt=""
                width="1672"
                height="941"
                decoding="async"
                fetchPriority={index === 0 ? "high" : "low"}
                key={item.id}
              />
            ))}
            <div className="hero-overlay" />
            <div className="shell hero-content">
              <p className="hero-kicker">تأمین و استعلام مقاطع فولادی</p>
              <h1>
                <span>بنیان فولاد داریا؛</span>
                <span>همراه مطمئن خرید آهن و فولاد</span>
              </h1>
              <p>{slide.description}</p>
              <div className="hero-actions">
                <a href={contactHref}>
                  استعلام {slide.label}
                </a>
                <a href="#products">مشاهده محصولات</a>
              </div>
            </div>

            <div className="shell carousel-controls">
              <button
                type="button"
                aria-label="اسلاید قبلی"
                onClick={() =>
                  setActiveSlide(
                    (current) =>
                      (current - 1 + heroSlides.length) % heroSlides.length,
                  )
                }
              >
                →
              </button>
              <div className="carousel-dots" aria-label="انتخاب اسلاید">
                {heroSlides.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={index === activeSlide ? "is-active" : ""}
                    aria-label={`اسلاید ${index + 1}: ${item.label}`}
                    aria-current={index === activeSlide ? "true" : undefined}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="اسلاید بعدی"
                onClick={() =>
                  setActiveSlide((current) => (current + 1) % heroSlides.length)
                }
              >
                ←
              </button>
              {!reduceMotion ? (
                <button
                  className="carousel-pause"
                  type="button"
                  aria-label={carouselPaused ? "ادامه پخش اسلایدها" : "توقف اسلایدها"}
                  aria-pressed={carouselPaused}
                  onClick={() => setCarouselPaused((paused) => !paused)}
                >
                  {carouselPaused ? "پخش" : "توقف"}
                </button>
              ) : null}
            </div>
          </section>
        </div>

        <section className="products section" id="products">
          <div className="shell">
            <SectionTitle
              eyebrow="گروه‌های محصول"
              title="محصول مورد نیاز خود را انتخاب کنید"
              description="برای دیدن مشخصات قابل تأمین و تماس با واحد فروش، یک گروه محصول را انتخاب کنید."
            />
            <div className="category-grid">
              {productGroups.map((group) => (
                <a
                  className="category-card"
                  href={`/${group.id}/`}
                  key={group.id}
                  onClick={(event) => {
                    event.preventDefault();
                    goToGroup(group.id);
                  }}
                >
                  <img
                    src={group.image}
                    alt=""
                    width="480"
                    height="320"
                    loading="lazy"
                    decoding="async"
                  />
                  <span>
                    <strong>{group.label}</strong>
                    <small>{group.description}</small>
                  </span>
                  <b aria-hidden="true">←</b>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="prices section" id="prices">
          <div className="shell">
            <SectionTitle
              eyebrow="قیمت روز بازار"
              title="قیمت روز آهن و فولاد"
              description="قیمت همه محصولات از مرجع بازار بروزرسانی می‌شود؛ قیمت قطعی، موجودی و زمان تحویل را با واحد فروش تأیید کنید."
            />

            <p className="search-status" role="status" aria-live="polite">
              {searchMessage}
              {committedSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setCommittedSearch("");
                    setSearchInput("");
                    setSearchGroups(null);
                    setSearchMessage("همه محصولات نمایش داده می‌شوند.");
                    setActiveGroup(productGroups[0].id);
                    resetGroupView(productGroups[0].id);
                  }}
                >
                  پاک‌کردن جست‌وجو
                </button>
              ) : null}
            </p>

            <div className="product-tabs" role="tablist" aria-label="گروه محصولات">
              {productGroups.map((group, index) => {
                const selected = visibleGroup?.id === group.id;
                // When a search leaves no group visible, every tab would
                // otherwise get tabIndex -1 and the whole tablist would drop
                // out of the tab order. Keep the first tab reachable instead.
                const focusable = selected || (!visibleGroup && index === 0);
                return (
                  <button
                    type="button"
                    role="tab"
                    id={`tab-${group.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${group.id}`}
                    tabIndex={focusable ? 0 : -1}
                    key={group.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    onKeyDown={(event) => moveTabFocus(event, index)}
                    onClick={() => {
                      goToGroup(group.id);
                    }}
                  >
                    {group.shortLabel}
                  </button>
                );
              })}
            </div>

            {visibleGroup ? (
              <div
                className="product-panel"
                role="tabpanel"
                id={`panel-${visibleGroup.id}`}
                aria-labelledby={`tab-${visibleGroup.id}`}
                tabIndex={0}
              >
                {visibleGroup.id === "rebar" ? (
                  <RebarPrices
                    key={rebarViewRequest.requestId}
                    phoneHref={contactHref}
                    requestedView={rebarViewRequest}
                  />
                ) : visibleGroup.id === "beam" ? (
                  <BeamPrices
                    key={beamViewRequest.requestId}
                    phoneHref={contactHref}
                    requestedView={beamViewRequest}
                  />
                ) : isProductCatalogId(visibleGroup.id) ? (
                  <ProductPrices
                    key={`${visibleGroup.id}-${productViewRequest.requestId}`}
                    catalogId={visibleGroup.id}
                    phoneHref={contactHref}
                    requestedView={productViewRequest}
                  />
                ) : null}
              </div>
            ) : (
              <div className="empty-state" role="status">
                <h3>محصولی پیدا نشد</h3>
                <p>عبارت دیگری جست‌وجو کنید یا با واحد فروش تماس بگیرید.</p>
                <a href={phones[0].href} dir="ltr">
                  {phones[0].label}
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="about section" id="about">
          <div className="shell about-grid">
            <div className="about-copy">
              <SectionTitle
                eyebrow="درباره بنیان فولاد داریا"
                title="از انتخاب محصول تا هماهنگی تحویل"
                description="بنیان فولاد داریا (با نام‌های فولاد بنیان داریا، بنیان فولاد و فولاد بنیان نیز شناخته می‌شود) برای استعلام موجودی، مقایسه گزینه‌های تأمین و هماهنگی سفارش در کنار خریداران ساختمانی و صنعتی است."
              />
              <ul className="feature-list">
                <li>
                  <strong>استعلام شفاف</strong>
                  <span>قیمت نهایی پس از مشخص‌شدن نوع، ابعاد، مقدار و محل تحویل اعلام می‌شود.</span>
                </li>
                <li>
                  <strong>راهنمایی پیش از خرید</strong>
                  <span>مشخصات سفارش قبل از ثبت نهایی با خریدار مرور می‌شود.</span>
                </li>
                <li>
                  <strong>پیگیری هماهنگ</strong>
                  <span>هماهنگی موجودی و تحویل از طریق واحد فروش انجام می‌شود.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="quote-section section" aria-labelledby="quote-heading">
          <div className="shell quote-inner">
            <div>
              <span>استعلام خرید</span>
              <h2 id="quote-heading">مشخصات سفارش خود را با ما در میان بگذارید</h2>
              <p>
                نوع محصول، ابعاد، مقدار و شهر مقصد را آماده کنید تا واحد فروش
                بتواند استعلام دقیق‌تری ارائه کند.
              </p>
            </div>
            <a href={contactHref}>تماس با واحد فروش</a>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="shell footer-grid">
          <div>
            <Brand headerLogo />
            <p>
              استعلام و تأمین مقاطع فولادی برای پروژه‌های ساختمانی و صنعتی.
            </p>
          </div>
          <div>
            <h2>دسترسی سریع</h2>
            <a href="#products">محصولات</a>
            <a href="#prices">راهنمای استعلام</a>
            <a href="#about">درباره ما</a>
          </div>
          <div id="phone-numbers">
            <h2>شماره‌های تماس</h2>
            {phones.map((phone) => (
              <a
                href={phone.href}
                key={phone.href}
                dir={phone.name ? undefined : "ltr"}
              >
                {phone.name ? (
                  <>
                    {phone.name}: <span dir="ltr">{phone.label}</span>
                  </>
                ) : (
                  phone.label
                )}
              </a>
            ))}
          </div>
          <div>
            <h2>نشانی دفتر</h2>
            <address>{address}</address>
          </div>
        </div>
        <div className="shell footer-bottom">
          {/*
            Year is intentionally hardcoded to ۲۰۲۰ (plain, no thousands
            separator) per an explicit request from the site owner -- this is
            NOT a bug and NOT meant to track the current year. Do not change
            it back to a dynamic new Date().getFullYear() call, and do not
            reformat it through toLocaleString or anything else that would
            reintroduce a "," grouping separator.
          */}
          <span>© ۲۰۲۰ بنیان فولاد داریا</span>
          <a href="#top">بازگشت به بالا ↑</a>
        </div>
      </footer>

      <div className="mobile-actions" aria-label="اقدام‌های سریع">
        <a href={contactHref}>
          <span aria-hidden="true">☎</span>
          تماس
        </a>
        <a href={contactHref}>استعلام خرید</a>
      </div>
    </div>
  );
}
