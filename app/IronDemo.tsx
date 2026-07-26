"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const DEFAULT_PRIMARY = "#F6B500";
const DEFAULT_SECONDARY = "#3B3B3E";

const slides = [
  {
    eyebrow: "خرید مستقیم و مطمئن",
    title: "آهن پروژه‌تان را\nحرفه‌ای تهیه کنید",
    copy: "از مقایسه قیمت تا کنترل کیفیت و تحویل بار، یک کارشناس کنار شماست.",
    action: "استعلام فوری قیمت",
    image:
      "https://images.pexels.com/photos/36003978/pexels-photo-36003978.jpeg?auto=compress&cs=tinysrgb&w=1800",
    badge: "بیش از ۲,۵۰۰ قلم کالا",
  },
  {
    eyebrow: "قیمت‌های شفاف و به‌روز",
    title: "یک تصمیم دقیق،\nقبل از شروع پروژه",
    copy: "قیمت محصولات چندین کارخانه را یک‌جا ببینید و بهترین انتخاب را انجام دهید.",
    action: "مشاهده قیمت روز",
    image:
      "https://images.pexels.com/photos/36003962/pexels-photo-36003962.jpeg?auto=compress&cs=tinysrgb&w=1800",
    badge: "به‌روزرسانی روزانه",
  },
  {
    eyebrow: "تأمین سراسری آهن‌آلات",
    title: "از انبار تا کارگاه،\nسریع و قابل پیگیری",
    copy: "هماهنگی بارگیری، کنترل کیفیت و حمل، همه در یک تجربه خرید ساده.",
    action: "درخواست مشاوره",
    image:
      "https://images.pexels.com/photos/16708396/pexels-photo-16708396.jpeg?auto=compress&cs=tinysrgb&w=1800",
    badge: "ارسال به سراسر ایران",
  },
];

const categories = [
  { name: "میلگرد", mark: "////", meta: "۱۲۷ محصول" },
  { name: "تیرآهن", mark: "I I", meta: "۸۴ محصول" },
  { name: "ورق", mark: "▰", meta: "۹۶ محصول" },
  { name: "پروفیل", mark: "▣", meta: "۷۳ محصول" },
  { name: "لوله", mark: "◉", meta: "۱۱۲ محصول" },
  { name: "نبشی", mark: "L", meta: "۵۸ محصول" },
  { name: "ناودانی", mark: "∪", meta: "۴۱ محصول" },
  { name: "مفتول", mark: "≋", meta: "۳۵ محصول" },
];

const priceGroups = [
  {
    name: "میلگرد",
    rows: [
      ["میلگرد ۱۴ آجدار A3 ذوب‌آهن", "شاخه ۱۲ متری", "۳۹,۸۵۰", "up"],
      ["میلگرد ۱۶ آجدار A3 میانه", "شاخه ۱۲ متری", "۳۹,۴۲۰", "down"],
      ["میلگرد ۱۸ آجدار A3 بناب", "شاخه ۱۲ متری", "۴۰,۱۰۰", "up"],
      ["میلگرد ۲۰ آجدار A3 نیشابور", "شاخه ۱۲ متری", "۳۹,۷۶۰", "same"],
    ],
  },
  {
    name: "تیرآهن",
    rows: [
      ["تیرآهن ۱۴ ذوب‌آهن اصفهان", "شاخه ۱۲ متری", "۵,۹۸۰,۰۰۰", "up"],
      ["تیرآهن ۱۶ فایکو", "شاخه ۱۲ متری", "۷,۴۲۰,۰۰۰", "down"],
      ["تیرآهن ۱۸ یزد", "شاخه ۱۲ متری", "۹,۱۰۰,۰۰۰", "same"],
      ["هاش سبک ۲۰ ترک", "شاخه ۱۲ متری", "استعلام", "same"],
    ],
  },
  {
    name: "ورق",
    rows: [
      ["ورق سیاه ۲ میل مبارکه", "رول ۱.۲۵ متر", "۴۷,۳۰۰", "down"],
      ["ورق سیاه ۱۰ میل اکسین", "شیت ۶×۲", "۵۱,۷۰۰", "up"],
      ["ورق گالوانیزه ۰.۵ کاشان", "رول ۱ متر", "۶۸,۹۰۰", "same"],
      ["ورق روغنی ۱ میل هفت‌الماس", "رول ۱ متر", "۷۲,۴۰۰", "up"],
    ],
  },
  {
    name: "پروفیل",
    rows: [
      ["پروفیل ۴۰×۴۰ ضخامت ۲", "شاخه ۶ متری", "۵۲,۲۰۰", "up"],
      ["قوطی ۸۰×۸۰ ضخامت ۳", "شاخه ۶ متری", "۵۱,۸۵۰", "same"],
      ["پروفیل صنعتی ۱۰۰×۱۰۰", "شاخه ۶ متری", "۵۴,۲۰۰", "down"],
      ["پروفیل زد ۱۸", "شاخه ۶ متری", "۵۰,۹۰۰", "same"],
    ],
  },
  {
    name: "لوله",
    rows: [
      ["لوله داربستی ۱.۵ اینچ", "شاخه ۶ متری", "۴۹,۶۰۰", "up"],
      ["لوله مانیسمان رده ۴۰", "شاخه ۶ متری", "استعلام", "same"],
      ["لوله صنعتی ۲ اینچ", "شاخه ۶ متری", "۵۲,۷۰۰", "down"],
      ["لوله گالوانیزه سبک", "شاخه ۶ متری", "۶۱,۲۰۰", "same"],
    ],
  },
];

const steps = [
  ["۰۱", "ثبت درخواست", "محصول، مقدار و مقصد را برای ما ارسال کنید."],
  ["۰۲", "دریافت پیش‌فاکتور", "کارشناس فروش بهترین پیشنهاد را آماده می‌کند."],
  ["۰۳", "تأیید و تسویه", "پس از تأیید شما، سفارش قطعی و آماده‌سازی می‌شود."],
  ["۰۴", "کنترل و ارسال", "بار کنترل کیفی شده و تا مقصد رهگیری می‌شود."],
];

const articles = [
  {
    tag: "راهنمای خرید",
    title: "چطور میلگرد مناسب پروژه را انتخاب کنیم؟",
    image:
      "https://images.pexels.com/photos/36003962/pexels-photo-36003962.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    tag: "تحلیل بازار",
    title: "۵ عامل مهم در تغییر قیمت روز آهن",
    image:
      "https://images.pexels.com/photos/16708396/pexels-photo-16708396.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    tag: "دانشنامه",
    title: "تفاوت تیرآهن IPE، INP و IPB چیست؟",
    image:
      "https://images.pexels.com/photos/36003978/pexels-photo-36003978.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
];

function isHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export default function IronDemo() {
  const [slide, setSlide] = useState(0);
  const [activePrices, setActivePrices] = useState(0);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [themeOpen, setThemeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const savedPrimary = window.localStorage.getItem("fooladino-primary");
    const savedSecondary = window.localStorage.getItem("fooladino-secondary");
    if (savedPrimary && isHex(savedPrimary)) setPrimary(savedPrimary);
    if (savedSecondary && isHex(savedSecondary)) setSecondary(savedSecondary);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const themeStyle = useMemo(
    () =>
      ({
        "--primary": primary,
        "--secondary": secondary,
      }) as React.CSSProperties,
    [primary, secondary],
  );

  const updateColor = (kind: "primary" | "secondary", value: string) => {
    if (kind === "primary") setPrimary(value);
    else setSecondary(value);
    if (isHex(value)) {
      window.localStorage.setItem(`fooladino-${kind}`, value);
    }
  };

  const resetTheme = () => {
    setPrimary(DEFAULT_PRIMARY);
    setSecondary(DEFAULT_SECONDARY);
    window.localStorage.removeItem("fooladino-primary");
    window.localStorage.removeItem("fooladino-secondary");
  };

  const submitQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  const activeSlide = slides[slide];
  const activeGroup = priceGroups[activePrices];

  return (
    <main className="site-shell" style={themeStyle}>
      <div className="demo-ribbon">نسخه نمایشی برای ارائه به مشتری</div>

      <header className="site-header">
        <div className="topline">
          <div className="container topline-inner">
            <span>
              <i className="live-dot" /> قیمت‌ها امروز به‌روزرسانی شده‌اند
            </span>
            <div className="top-links">
              <a href="#about">درباره ما</a>
              <a href="#articles">مجله فولاد</a>
              <a href="#footer">تماس با ما</a>
            </div>
          </div>
        </div>

        <div className="container main-head">
          <a className="brand" href="#" aria-label="صفحه نخست فولادینو">
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span>
              <strong>فولادینو</strong>
              <small>بازار حرفه‌ای آهن</small>
            </span>
          </a>

          <label className="searchbox">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="جستجوی محصول، کارخانه یا سایز..."
              aria-label="جستجو در محصولات"
            />
            <kbd>جستجو</kbd>
          </label>

          <a className="phone-block" href="tel:+982188880000">
            <span className="phone-icon" aria-hidden="true">
              ☎
            </span>
            <span>
              <small>مشاوره و خرید</small>
              <strong dir="ltr">۰۲۱ - ۸۸۸۸ ۰۰۰۰</strong>
            </span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label="نمایش منو"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <div className="container nav-inner">
            <a className="products-menu" href="#prices">
              <span>☰</span> قیمت روز محصولات
            </a>
            <a href="#categories">دسته‌بندی کالا</a>
            <a href="#prices">قیمت لحظه‌ای</a>
            <a href="#process">نحوه خرید</a>
            <a href="#articles">راهنمای بازار</a>
            <a href="#footer">درباره فولادینو</a>
            <button
              className="nav-quote"
              type="button"
              onClick={() => setQuoteOpen(true)}
            >
              استعلام آنلاین
            </button>
          </div>
        </nav>
      </header>

      <section className="hero" aria-roledescription="carousel">
        {slides.map((item, index) => (
          <div
            key={item.title}
            className={`hero-bg ${index === slide ? "is-active" : ""}`}
            style={{ backgroundImage: `url("${item.image}")` }}
            aria-hidden={index !== slide}
          />
        ))}
        <div className="hero-shade" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-copy" key={activeSlide.title}>
            <span className="eyebrow">
              <i /> {activeSlide.eyebrow}
            </span>
            <h1>
              {activeSlide.title.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p>{activeSlide.copy}</p>
            <div className="hero-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() => setQuoteOpen(true)}
              >
                {activeSlide.action} <span>←</span>
              </button>
              <a className="button button-ghost" href="#prices">
                لیست قیمت‌ها
              </a>
            </div>
          </div>

          <div className="hero-side">
            <div className="hero-stat">
              <span>شبکه تأمین</span>
              <strong>۴۲ کارخانه</strong>
              <small>از برندهای معتبر کشور</small>
            </div>
            <div className="hero-badge">{activeSlide.badge}</div>
          </div>
        </div>

        <div className="container slider-controls">
          <button
            type="button"
            onClick={() =>
              setSlide((current) => (current - 1 + slides.length) % slides.length)
            }
            aria-label="اسلاید قبلی"
          >
            →
          </button>
          <div className="slider-dots">
            {slides.map((item, index) => (
              <button
                key={item.title}
                className={index === slide ? "is-active" : ""}
                type="button"
                onClick={() => setSlide(index)}
                aria-label={`نمایش اسلاید ${index + 1}`}
                aria-current={index === slide}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSlide((current) => (current + 1) % slides.length)}
            aria-label="اسلاید بعدی"
          >
            ←
          </button>
        </div>
      </section>

      <section className="quick-features">
        <div className="container feature-row">
          <div>
            <span className="feature-icon">✓</span>
            <p>
              <strong>تضمین اصالت کالا</strong>
              <small>فاکتور معتبر و کنترل کیفی</small>
            </p>
          </div>
          <div>
            <span className="feature-icon">◫</span>
            <p>
              <strong>قیمت شفاف و رقابتی</strong>
              <small>مقایسه چندین تأمین‌کننده</small>
            </p>
          </div>
          <div>
            <span className="feature-icon">◇</span>
            <p>
              <strong>ارسال سراسری</strong>
              <small>هماهنگی بار تا محل پروژه</small>
            </p>
          </div>
          <div>
            <span className="feature-icon">◎</span>
            <p>
              <strong>مشاوره تخصصی</strong>
              <small>پاسخ‌گویی کارشناسان فروش</small>
            </p>
          </div>
        </div>
      </section>

      <section className="section categories-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">دسترسی سریع</span>
              <h2>چه محصولی نیاز دارید؟</h2>
            </div>
            <a href="#prices">مشاهده همه محصولات <span>←</span></a>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <a className="category-card" href="#prices" key={category.name}>
                <span className={`category-art art-${index + 1}`}>
                  {category.mark}
                </span>
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.meta}</small>
                </span>
                <i>←</i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section prices-section" id="prices">
        <div className="container">
          <div className="price-head">
            <div>
              <span className="section-kicker light">تابلوی بازار</span>
              <h2>قیمت روز آهن‌آلات</h2>
              <p>قیمت‌ها برای دموی رابط کاربری هستند و ارزش معاملاتی ندارند.</p>
            </div>
            <div className="price-update">
              <i className="live-dot" />
              آخرین بروزرسانی: امروز، ساعت ۱۱:۴۵
            </div>
          </div>

          <div className="price-panel">
            <div className="price-tabs" role="tablist" aria-label="گروه محصولات">
              {priceGroups.map((group, index) => (
                <button
                  key={group.name}
                  type="button"
                  role="tab"
                  aria-selected={index === activePrices}
                  className={index === activePrices ? "is-active" : ""}
                  onClick={() => setActivePrices(index)}
                >
                  {group.name}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>نام محصول</th>
                    <th>واحد فروش</th>
                    <th>قیمت (تومان)</th>
                    <th>نوسان</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {activeGroup.rows.map((row) => (
                    <tr key={row[0]}>
                      <td>
                        <span className="product-dot" />
                        <strong>{row[0]}</strong>
                      </td>
                      <td>{row[1]}</td>
                      <td className="price-number">{row[2]}</td>
                      <td>
                        <span className={`trend trend-${row[3]}`}>
                          {row[3] === "up" ? "↑ ۰.۴٪" : row[3] === "down" ? "↓ ۰.۲٪" : "—"}
                        </span>
                      </td>
                      <td>
                        <button type="button" onClick={() => setQuoteOpen(true)}>
                          خرید
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="price-footer">
              <p>
                قیمت نهایی با توجه به وزن باسکول، مقصد و شرایط بارگیری محاسبه می‌شود.
              </p>
              <button
                className="button button-dark"
                type="button"
                onClick={() => setQuoteOpen(true)}
              >
                دریافت پیش‌فاکتور <span>←</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="container about-grid">
          <div className="about-visual">
            <div className="about-photo" />
            <div className="experience-card">
              <strong>+۱۵</strong>
              <span>سال تجربه در بازار فولاد</span>
            </div>
            <div className="steel-stamp">FOOLADINO / QC</div>
          </div>
          <div className="about-copy">
            <span className="section-kicker">خرید مطمئن، بدون پیچیدگی</span>
            <h2>فقط آهن نمی‌فروشیم؛ خیال شما را از تأمین راحت می‌کنیم.</h2>
            <p>
              فولادینو یک تجربه ساده و حرفه‌ای برای استعلام، مقایسه و خرید
              آهن‌آلات است. از انتخاب برند و سایز تا بارگیری و تحویل، تمام
              جزئیات سفارش با یک کارشناس ثابت پیگیری می‌شود.
            </p>
            <div className="about-points">
              <div><b>۲,۵۰۰+</b><span>تن ظرفیت تأمین روزانه</span></div>
              <div><b>۹۸٪</b><span>رضایت از تحویل سفارش</span></div>
              <div><b>۳۱</b><span>استان تحت پوشش</span></div>
            </div>
            <button
              className="text-link"
              type="button"
              onClick={() => setQuoteOpen(true)}
            >
              گفتگو با کارشناس فروش <span>←</span>
            </button>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="container">
          <div className="process-heading">
            <div>
              <span className="section-kicker">مسیر یک خرید مطمئن</span>
              <h2>از درخواست شما تا تحویل بار</h2>
            </div>
            <p>چهار قدم روشن؛ بدون سردرگمی و تماس‌های پراکنده.</p>
          </div>
          <div className="steps-grid">
            {steps.map((item, index) => (
              <div className="step-card" key={item[1]}>
                <span className="step-number">{item[0]}</span>
                <div className="step-symbol">
                  {index === 0 ? "✎" : index === 1 ? "▤" : index === 2 ? "✓" : "↦"}
                </div>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
                {index < steps.length - 1 && <i className="step-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="quote-banner">
        <div className="container quote-banner-inner">
          <div className="quote-metal" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span>برای پروژه‌تان قیمت می‌خواهید؟</span>
            <h2>فهرست خرید را بفرستید؛ سریع برآورد می‌کنیم.</h2>
            <p>پاسخ اولیه در کمتر از ۳۰ دقیقه کاری</p>
          </div>
          <button
            className="button button-white"
            type="button"
            onClick={() => setQuoteOpen(true)}
          >
            ثبت درخواست خرید <span>←</span>
          </button>
        </div>
      </section>

      <section className="section articles-section" id="articles">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">دانش و تحلیل بازار</span>
              <h2>مجله فولادینو</h2>
            </div>
            <a href="#articles">مشاهده همه مطالب <span>←</span></a>
          </div>
          <div className="article-grid">
            {articles.map((article) => (
              <article className="article-card" key={article.title}>
                <div
                  className="article-image"
                  style={{ backgroundImage: `url("${article.image}")` }}
                >
                  <span>{article.tag}</span>
                </div>
                <div className="article-copy">
                  <small>۸ دقیقه مطالعه</small>
                  <h3>{article.title}</h3>
                  <a href="#articles">ادامه مطلب <span>←</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <a className="brand brand-light" href="#">
              <span className="brand-mark">F</span>
              <span><strong>فولادینو</strong><small>بازار حرفه‌ای آهن</small></span>
            </a>
            <p>
              تجربه‌ای شفاف، سریع و قابل اعتماد برای تأمین آهن‌آلات ساختمانی و
              صنعتی.
            </p>
            <a className="footer-phone" href="tel:+982188880000">
              <small>مرکز تماس و فروش</small>
              <strong dir="ltr">۰۲۱ - ۸۸۸۸ ۰۰۰۰</strong>
            </a>
          </div>
          <div className="footer-column">
            <h4>محصولات</h4>
            <a href="#prices">میلگرد</a>
            <a href="#prices">تیرآهن و هاش</a>
            <a href="#prices">انواع ورق</a>
            <a href="#prices">پروفیل و قوطی</a>
            <a href="#prices">لوله و اتصالات</a>
          </div>
          <div className="footer-column">
            <h4>خدمات مشتریان</h4>
            <a href="#process">راهنمای خرید</a>
            <a href="#prices">استعلام قیمت</a>
            <a href="#about">کنترل کیفیت</a>
            <a href="#footer">شرایط ارسال</a>
            <a href="#footer">پرسش‌های متداول</a>
          </div>
          <div className="footer-column footer-address">
            <h4>با ما در ارتباط باشید</h4>
            <p>تهران، خیابان مطهری، خیابان سرافراز، پلاک ۲۱</p>
            <p>شنبه تا چهارشنبه، ۸:۳۰ تا ۱۷:۳۰</p>
            <a href="mailto:sales@fooladino.demo">sales@fooladino.demo</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <span>© ۱۴۰۵ فولادینو — نسخه نمایشی</span>
            <span>طراحی‌شده برای یک خرید حرفه‌ای</span>
          </div>
        </div>
      </footer>

      <button
        className={`theme-trigger ${themeOpen ? "is-open" : ""}`}
        type="button"
        onClick={() => setThemeOpen((value) => !value)}
        aria-label="تنظیم رنگ‌های قالب"
        aria-expanded={themeOpen}
      >
        <span className="palette-icon">◐</span>
        <span>رنگ قالب</span>
      </button>

      <aside className={`theme-panel ${themeOpen ? "is-open" : ""}`}>
        <div className="theme-panel-head">
          <div>
            <small>شخصی‌سازی زنده</small>
            <strong>رنگ‌های قالب</strong>
          </div>
          <button
            type="button"
            onClick={() => setThemeOpen(false)}
            aria-label="بستن تنظیمات رنگ"
          >
            ×
          </button>
        </div>
        <p>دو رنگ اصلی برند را تغییر دهید؛ نتیجه همان لحظه دیده می‌شود.</p>
        <label className="color-control">
          <span>
            <b>رنگ اصلی</b>
            <small>دکمه‌ها و تأکیدها</small>
          </span>
          <span className="color-input">
            <input
              type="color"
              value={isHex(primary) ? primary : DEFAULT_PRIMARY}
              onChange={(event) => updateColor("primary", event.target.value.toUpperCase())}
              aria-label="انتخاب رنگ اصلی"
            />
            <input
              type="text"
              value={primary}
              maxLength={7}
              dir="ltr"
              onChange={(event) => updateColor("primary", event.target.value)}
              aria-label="کد رنگ اصلی"
            />
          </span>
        </label>
        <label className="color-control">
          <span>
            <b>رنگ ثانویه</b>
            <small>پس‌زمینه‌های تیره</small>
          </span>
          <span className="color-input">
            <input
              type="color"
              value={isHex(secondary) ? secondary : DEFAULT_SECONDARY}
              onChange={(event) => updateColor("secondary", event.target.value.toUpperCase())}
              aria-label="انتخاب رنگ ثانویه"
            />
            <input
              type="text"
              value={secondary}
              maxLength={7}
              dir="ltr"
              onChange={(event) => updateColor("secondary", event.target.value)}
              aria-label="کد رنگ ثانویه"
            />
          </span>
        </label>
        <button className="reset-theme" type="button" onClick={resetTheme}>
          بازگشت به رنگ‌های پیش‌فرض
        </button>
      </aside>

      {quoteOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setQuoteOpen(false);
          }}
        >
          <section
            className="quote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setQuoteOpen(false)}
              aria-label="بستن پنجره"
            >
              ×
            </button>
            {submitted ? (
              <div className="success-state">
                <span>✓</span>
                <h2>درخواست نمایشی ثبت شد</h2>
                <p>در نسخه واقعی، کارشناس فروش با مشتری تماس می‌گیرد.</p>
                <button
                  className="button button-dark"
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    setSubmitted(false);
                  }}
                >
                  بستن
                </button>
              </div>
            ) : (
              <>
                <span className="section-kicker">پاسخ‌گویی سریع</span>
                <h2 id="quote-title">استعلام قیمت و ثبت درخواست خرید</h2>
                <p>اطلاعات اولیه را وارد کنید تا برآورد مناسب‌تری دریافت کنید.</p>
                <form onSubmit={submitQuote}>
                  <label>
                    نام و نام خانوادگی
                    <input required placeholder="مثلاً علی رضایی" />
                  </label>
                  <label>
                    شماره تماس
                    <input required inputMode="tel" placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷" />
                  </label>
                  <label className="full-field">
                    شرح درخواست
                    <textarea
                      required
                      rows={4}
                      placeholder="نوع محصول، سایز، مقدار و شهر مقصد..."
                    />
                  </label>
                  <button className="button button-dark full-field" type="submit">
                    ثبت درخواست نمایشی <span>←</span>
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      <div className="mobile-actions">
        <a href="tel:+982188880000">☎ تماس با فروش</a>
        <button type="button" onClick={() => setQuoteOpen(true)}>
          استعلام قیمت
        </button>
      </div>
    </main>
  );
}
