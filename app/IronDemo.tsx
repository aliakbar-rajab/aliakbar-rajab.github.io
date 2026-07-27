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
import RebarPrices, { type RebarViewRequest } from "./RebarPrices";
import BeamPrices, { type BeamViewRequest } from "./BeamPrices";

type ProductRow = {
  product: string;
  origin: string;
  unit: string;
};

type ProductGroup = {
  id: string;
  label: string;
  shortLabel: string;
  image: string;
  description: string;
  rows: ProductRow[];
};

const phones = [
  { label: "021-88888180", href: "tel:+982188888180" },
  { label: "021-88888280", href: "tel:+982188888280" },
  { label: "021-88888122", href: "tel:+982188888122" },
];

const address =
  "آجودانیه پورابتهاج نبش لشکری ساختمان سرو واحد ۳۰۳";

const productGroups: ProductGroup[] = [
  {
    id: "rebar",
    label: "میلگرد",
    shortLabel: "میلگرد",
    image: "/categories/01-rebar.jpg",
    description: "میلگرد آجدار و ساده برای پروژه‌های ساختمانی و صنعتی",
    rows: [
      { product: "میلگرد آجدار", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "میلگرد ساده", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "کلاف میلگرد", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
    ],
  },
  {
    id: "beam",
    label: "تیرآهن",
    shortLabel: "تیرآهن",
    image: "/categories/02-ibeam.jpg",
    description: "تیرآهن IPE، هاش و مقاطع سازه‌ای",
    rows: [
      { product: "تیرآهن IPE", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "تیرآهن هاش سبک", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "تیرآهن هاش سنگین", origin: "کارخانه‌های معتبر", unit: "شاخه" },
    ],
  },
  {
    id: "sheet",
    label: "ورق فولادی",
    shortLabel: "ورق",
    image: "/categories/03-sheet-coil.jpg",
    description: "ورق سیاه، گالوانیزه، روغنی و رنگی",
    rows: [
      { product: "ورق سیاه", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "ورق گالوانیزه", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "ورق روغنی", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
    ],
  },
  {
    id: "profile",
    label: "قوطی و پروفیل",
    shortLabel: "پروفیل",
    image: "/categories/04-profile.jpg",
    description: "پروفیل ساختمانی و صنعتی در ابعاد گوناگون",
    rows: [
      { product: "قوطی ساختمانی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "پروفیل صنعتی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "پروفیل در و پنجره", origin: "کارخانه‌های معتبر", unit: "شاخه" },
    ],
  },
  {
    id: "pipe",
    label: "لوله فولادی",
    shortLabel: "لوله",
    image: "/categories/05-pipe.jpg",
    description: "لوله صنعتی، گازی و داربستی",
    rows: [
      { product: "لوله صنعتی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "لوله گازی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "لوله داربستی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
    ],
  },
  {
    id: "angle",
    label: "نبشی",
    shortLabel: "نبشی",
    image: "/categories/06-angle.jpg",
    description: "نبشی بال مساوی و بال نامساوی",
    rows: [
      { product: "نبشی بال مساوی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "نبشی بال نامساوی", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "نبشی لقمه", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
    ],
  },
  {
    id: "channel",
    label: "ناودانی",
    shortLabel: "ناودانی",
    image: "/categories/07-channel.jpg",
    description: "ناودانی سبک و سنگین برای مصارف سازه‌ای",
    rows: [
      { product: "ناودانی سبک", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "ناودانی سنگین", origin: "کارخانه‌های معتبر", unit: "شاخه" },
      { product: "ناودانی UPE", origin: "کارخانه‌های معتبر", unit: "شاخه" },
    ],
  },
  {
    id: "wire",
    label: "مفتول و سیم",
    shortLabel: "مفتول",
    image: "/categories/08-wire.jpg",
    description: "مفتول سیاه، گالوانیزه و محصولات سیمی",
    rows: [
      { product: "مفتول سیاه", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "مفتول گالوانیزه", origin: "کارخانه‌های معتبر", unit: "کیلوگرم" },
      { product: "توری و مش", origin: "کارخانه‌های معتبر", unit: "مترمربع" },
    ],
  },
];

const heroSlides = productGroups.slice(0, 3);

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

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="بنیان فولاد داریا، صفحه اصلی">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-copy">
        <strong>بنیان فولاد داریا</strong>
        <span>BONYAN FOULAD DARIA</span>
      </span>
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
  const [megaProduct, setMegaProduct] = useState<"rebar" | "beam">("rebar");
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [activeGroup, setActiveGroup] = useState(productGroups[0].id);
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [rebarViewRequest, setRebarViewRequest] = useState<RebarViewRequest>({
    requestId: 0,
  });
  const [beamViewRequest, setBeamViewRequest] = useState<BeamViewRequest>({
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
    () => filterProductGroups(productGroups, committedSearch),
    [committedSearch],
  );

  const visibleGroup =
    filteredGroups.find((group) => group.id === activeGroup) ??
    filteredGroups[0] ??
    null;

  useEffect(() => {
    if (reduceMotion || carouselPaused) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);
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

  const goToGroup = (groupId: string) => {
    setCommittedSearch("");
    setSearchInput("");
    setSearchMessage("");
    setActiveGroup(groupId);
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
    }
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

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    const results = filterProductGroups(productGroups, query);
    setCommittedSearch(query);
    if (!query) {
      setActiveGroup(productGroups[0].id);
      setSearchMessage("همه محصولات نمایش داده می‌شوند.");
    } else if (results.length > 0) {
      setActiveGroup(results[0].id);
      const count = results.reduce((sum, group) => sum + group.rows.length, 0);
      setSearchMessage(`${count.toLocaleString("fa-IR")} نتیجه برای «${query}» پیدا شد.`);
    } else {
      setSearchMessage(`نتیجه‌ای برای «${query}» پیدا نشد.`);
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
              <a href={phone.href} key={phone.href} dir="ltr">
                {phone.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="shell header-main">
          <Brand />

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
            <button type="submit" aria-label="جست‌وجو">
              جست‌وجو
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
                    setMegaProduct(activeGroup === "beam" ? "beam" : "rebar");
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
                  ) : (
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
                  )}

                  <section className="mega-other-products">
                    <h2>سایر محصولات</h2>
                    <div>
                      <button
                        type="button"
                        aria-pressed={megaProduct === "rebar"}
                        onClick={() => setMegaProduct("rebar")}
                      >
                        قیمت میلگرد
                      </button>
                      <button
                        type="button"
                        aria-pressed={megaProduct === "beam"}
                        onClick={() => setMegaProduct("beam")}
                      >
                        قیمت تیرآهن
                      </button>
                      {productGroups
                        .filter(
                          (group) =>
                            group.id !== "rebar" && group.id !== "beam",
                        )
                        .map((group) => (
                          <button
                            type="button"
                            key={group.id}
                            onClick={() => goToGroup(group.id)}
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
          <img
            className="hero-image"
            src={slide.image}
            alt=""
            width="1600"
            height="900"
            fetchPriority="high"
          />
          <div className="hero-overlay" />
          <div className="shell hero-content">
            <p className="hero-kicker">تأمین و استعلام مقاطع فولادی</p>
            <h1>بنیان فولاد داریا؛ همراه مطمئن خرید آهن و فولاد</h1>
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

        <section className="products section" id="products">
          <div className="shell">
            <SectionTitle
              eyebrow="گروه‌های محصول"
              title="محصول مورد نیاز خود را انتخاب کنید"
              description="برای دیدن مشخصات قابل تأمین و تماس با واحد فروش، یک گروه محصول را انتخاب کنید."
            />
            <div className="category-grid">
              {productGroups.map((group) => (
                <button
                  className="category-card"
                  type="button"
                  key={group.id}
                  onClick={() => goToGroup(group.id)}
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
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="prices section" id="prices">
          <div className="shell">
            <SectionTitle
              eyebrow="قیمت روز بازار"
              title="قیمت روز آهن و فولاد"
              description="قیمت میلگرد از مرجع بازار بروزرسانی می‌شود؛ قیمت قطعی، موجودی و زمان تحویل را با واحد فروش تأیید کنید."
            />

            <p className="search-status" role="status" aria-live="polite">
              {searchMessage}
              {committedSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setCommittedSearch("");
                    setSearchInput("");
                    setSearchMessage("همه محصولات نمایش داده می‌شوند.");
                    setActiveGroup(productGroups[0].id);
                  }}
                >
                  پاک‌کردن جست‌وجو
                </button>
              ) : null}
            </p>

            <div className="product-tabs" role="tablist" aria-label="گروه محصولات">
              {productGroups.map((group, index) => {
                const selected = visibleGroup?.id === group.id;
                return (
                  <button
                    type="button"
                    role="tab"
                    id={`tab-${group.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${group.id}`}
                    tabIndex={selected ? 0 : -1}
                    key={group.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    onKeyDown={(event) => moveTabFocus(event, index)}
                    onClick={() => {
                      setCommittedSearch("");
                      setSearchInput("");
                      setSearchMessage("");
                      setActiveGroup(group.id);
                    }}
                  >
                    {group.shortLabel}
                  </button>
                );
              })}
            </div>

            {visibleGroup?.id === "rebar" ? (
              <RebarPrices
                key={rebarViewRequest.requestId}
                phoneHref={contactHref}
                requestedView={rebarViewRequest}
              />
            ) : visibleGroup?.id === "beam" ? (
              <BeamPrices
                key={beamViewRequest.requestId}
                phoneHref={contactHref}
                requestedView={beamViewRequest}
              />
            ) : visibleGroup ? (
              <div
                className="product-panel"
                role="tabpanel"
                id={`panel-${visibleGroup.id}`}
                aria-labelledby={`tab-${visibleGroup.id}`}
                tabIndex={0}
              >
                <div className="table-scroll">
                  <table>
                    <caption className="sr-only">
                      فهرست محصولات {visibleGroup.label}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">محصول</th>
                        <th scope="col">مبدأ تأمین</th>
                        <th scope="col">واحد فروش</th>
                        <th scope="col">وضعیت قیمت</th>
                        <th scope="col">اقدام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleGroup.rows.map((row) => (
                        <tr key={`${visibleGroup.id}-${row.product}`}>
                          <th scope="row" data-label="محصول">
                            {row.product}
                          </th>
                          <td data-label="مبدأ تأمین">{row.origin}</td>
                          <td data-label="واحد فروش">{row.unit}</td>
                          <td data-label="وضعیت قیمت">
                            <span className="price-status">استعلام روز</span>
                          </td>
                          <td data-label="اقدام">
                            <a href={contactHref}>تماس برای قیمت</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                description="بنیان فولاد داریا برای استعلام موجودی، مقایسه گزینه‌های تأمین و هماهنگی سفارش در کنار خریداران ساختمانی و صنعتی است."
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
            <div className="about-visual">
              <img
                src="/categories/04-profile.jpg"
                alt="پروفیل‌های فولادی آماده تأمین"
                width="900"
                height="675"
                loading="lazy"
                decoding="async"
              />
              <div>
                <strong>برای انتخاب دقیق‌تر نیاز به راهنمایی دارید؟</strong>
                <a href={contactHref}>تماس با واحد فروش</a>
              </div>
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
            <Brand />
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
              <a href={phone.href} key={phone.href} dir="ltr">
                {phone.label}
              </a>
            ))}
          </div>
          <div>
            <h2>نشانی دفتر</h2>
            <address>{address}</address>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>
            © {new Date().getFullYear().toLocaleString("fa-IR")} بنیان فولاد داریا
          </span>
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
