import { useEffect, useRef, useState } from "react";
import { localizeCatalogValue } from "./catalog-utils";
import {
  loadProductPriceCatalog,
  type ProductCatalogId,
  type ProductPriceCatalog,
  type ProductViewRequest,
} from "./product-price-data";
import {
  isProductCatalogId,
  productGroups,
  type ProductGroupId,
} from "./category-meta";
import type { RebarViewRequest } from "./RebarPrices";
import type { BeamViewRequest } from "./BeamPrices";
import { useMediaQuery } from "./use-media-query";

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

type MegaMenuProps = {
  mobileOpen: boolean;
  onMobileToggle: () => void;
  onMobileClose: () => void;
  activeGroup: ProductGroupId;
  onSelectGroup: (groupId: ProductGroupId) => void;
  onSelectRebarView: (
    view: Omit<RebarViewRequest, "requestId">,
  ) => void;
  onSelectBeamView: (view: Omit<BeamViewRequest, "requestId">) => void;
  onSelectProductView: (
    catalogId: ProductCatalogId,
    view: Omit<ProductViewRequest, "requestId">,
  ) => void;
};

export function MegaMenu(props: MegaMenuProps) {
  const [productsOpen, setProductsOpen] = useState(false);
  const [megaProduct, setMegaProduct] = useState<ProductGroupId>("rebar");
  const [loadedMegaCatalog, setLoadedMegaCatalog] =
    useState<ProductPriceCatalog | null>(null);
  const [megaCatalogError, setMegaCatalogError] =
    useState<ProductCatalogId | null>(null);

  const isMobile = useMediaQuery("(max-width: 900px)");
  const productMenuRef = useRef<HTMLDivElement>(null);

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

  const selectRebarView = (view: Omit<RebarViewRequest, "requestId">) => {
    props.onSelectRebarView(view);
    setProductsOpen(false);
    props.onMobileClose();
  };

  const selectBeamView = (view: Omit<BeamViewRequest, "requestId">) => {
    props.onSelectBeamView(view);
    setProductsOpen(false);
    props.onMobileClose();
  };

  const selectProductView = (
    catalogId: ProductCatalogId,
    view: Omit<ProductViewRequest, "requestId">,
  ) => {
    props.onSelectProductView(catalogId, view);
    setProductsOpen(false);
    props.onMobileClose();
  };

  return (
    <div className="nav-wrap">
      <nav
        className="shell primary-nav"
        id="primary-navigation"
        aria-label="فهرست اصلی"
        hidden={isMobile && !props.mobileOpen}
      >
        <a href="#top" onClick={props.onMobileClose}>
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
                setMegaProduct(props.activeGroup);
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
                    <p className="mega-group-label">انواع میلگرد</p>
                    {rebarTypeLinks.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          selectRebarView({ categoryId: item.id })
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </section>

                  <section className="mega-rebar-factories">
                    <p className="mega-group-label">کارخانه‌های میلگرد</p>
                    <div>
                      {rebarFactories.map((factory) => (
                        <button
                          type="button"
                          key={factory}
                          onClick={() =>
                            selectRebarView({
                              categoryId: "ribbed",
                              factory:
                                factory === "ابهر" ? "سیادن ابهر" : factory,
                            })
                          }
                        >
                          میلگرد {factory}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="mega-rebar-sizes">
                    <p className="mega-group-label">سایزهای میلگرد</p>
                    <div>
                      {rebarSizes.map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() =>
                            selectRebarView({
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
                    <p className="mega-group-label">انواع تیرآهن</p>
                    {beamTypeLinks.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          selectBeamView({ categoryId: item.id })
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </section>

                  <section className="mega-rebar-factories">
                    <p className="mega-group-label">کارخانه‌های تیرآهن</p>
                    <div>
                      {beamFactories.map((factory) => (
                        <button
                          type="button"
                          key={factory}
                          onClick={() =>
                            selectBeamView({
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
                    <p className="mega-group-label">سایزهای تیرآهن</p>
                    <div>
                      {beamSizes.map((size) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() =>
                            selectBeamView({
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
                    <p className="mega-group-label">انواع {megaCatalog.label}</p>
                    {megaCatalog.categories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        onClick={() =>
                          selectProductView(megaProduct, {
                            categoryId: category.id,
                          })
                        }
                      >
                        قیمت {category.label}
                      </button>
                    ))}
                  </section>

                  <section className="mega-rebar-factories">
                    <p className="mega-group-label">
                      {megaInitialCategory.groupingLabel}‌های{" "}
                      {megaCatalog.label}
                    </p>
                    <div>
                      {megaInitialCategory.filters.factories
                        .slice(0, 16)
                        .map((factory) => (
                          <button
                            type="button"
                            key={factory}
                            onClick={() =>
                              selectProductView(megaProduct, {
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
                    <p className="mega-group-label">
                      سایزهای {megaCatalog.label}
                    </p>
                    <div>
                      {megaInitialCategory.filters.sizes
                        .slice(0, 16)
                        .map((size) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() =>
                              selectProductView(megaProduct, {
                                categoryId: megaCatalog.initialCategoryId,
                                size,
                              })
                            }
                          >
                            {megaCatalog.label} {localizeCatalogValue(size)}
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
                <p className="mega-group-label">گروه محصولات</p>
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
        <a href="#prices" onClick={props.onMobileClose}>
          راهنمای استعلام
        </a>
        <a href="/about/" onClick={props.onMobileClose}>
          درباره ما
        </a>
        <a href="/contact/" onClick={props.onMobileClose}>
          تماس با ما
        </a>
        <a className="nav-quote" href="/quote-process/#quote-form">
          درخواست پیش‌فاکتور
        </a>
      </nav>
    </div>
  );
}
