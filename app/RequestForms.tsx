import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  FieldErrors,
  validateFullName,
  validateMinimumText,
  validatePhone,
  validateRequired,
} from "./form-validation";
import { phones } from "./contact-data";
import {
  calculateApproximateTotal,
  loadQuotePriceEstimates,
  type QuotePriceEstimate,
  type QuoteProductName,
} from "./quote-pricing";
import { siteConfig } from "./site-config";

const quoteDisclaimer =
  "ثبت این درخواست به معنی ثبت سفارش، انعقاد قرارداد، تضمین موجودی یا قطعی‌شدن قیمت نیست. قیمت و شرایط نهایی پس از بررسی واحد فروش در پیش‌فاکتور دارای مدت اعتبار اعلام می‌شود.";

const productOptions = [
  "میلگرد",
  "تیرآهن",
  "هاش",
  "ورق فولادی",
  "پروفیل و قوطی",
  "لوله فولادی",
  "نبشی",
  "ناودانی",
  "مفتول و سیم",
  "سایر محصولات فولادی",
] as const satisfies readonly QuoteProductName[];

const MAX_QUOTE_ITEMS = 100;

type QuoteItem = {
  id: number;
  product: QuoteProductName | "";
  quantity: string;
  unit: "تن" | "کیلوگرم" | "شاخه" | "عدد";
  dimensions: string;
};

type QuotePriceEstimates = Partial<
  Record<QuoteProductName, QuotePriceEstimate>
>;

type GeneratedQuoteItem = {
  product: QuoteProductName;
  quantity: string;
  unit: QuoteItem["unit"];
  dimensions: string;
  unitPriceRial: number | null;
  totalRial: number | null;
};

type GeneratedQuote = {
  number: string;
  date: string;
  fullName: string;
  phone: string;
  destination: string;
  notes: string;
  items: GeneratedQuoteItem[];
  totalRial: number;
};

const createQuoteItem = (id: number): QuoteItem => ({
  id,
  product: "",
  quantity: "",
  unit: "تن",
  dimensions: "",
});

const formatToman = (value: number) =>
  `${value.toLocaleString("fa-IR")} تومان`;

const formatRial = (value: number) =>
  `${value.toLocaleString("fa-IR")} ریال`;

const persianDate = () =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const ones = [
  "", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه",
  "ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده",
  "هفده", "هجده", "نوزده",
];
const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

function threeDigitsToWords(value: number) {
  const parts: string[] = [];
  if (value >= 100) parts.push(hundreds[Math.floor(value / 100)]);
  const remainder = value % 100;
  if (remainder < 20) {
    if (remainder) parts.push(ones[remainder]);
  } else {
    parts.push(tens[Math.floor(remainder / 10)]);
    if (remainder % 10) parts.push(ones[remainder % 10]);
  }
  return parts.join(" و ");
}

function rialToWords(value: number) {
  if (!value) return "صفر ریال";
  const groups: string[] = [];
  let remaining = Math.round(value);
  let scaleIndex = 0;

  while (remaining > 0 && scaleIndex < scales.length) {
    const group = remaining % 1000;
    if (group) {
      groups.unshift(
        `${threeDigitsToWords(group)}${scales[scaleIndex] ? ` ${scales[scaleIndex]}` : ""}`,
      );
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return `${groups.join(" و ")} ریال`;
}

function QuoteDocument({ quote }: { quote: GeneratedQuote }) {
  const calculableItems = quote.items.filter((item) => item.totalRial !== null);
  const emptyRowCount = Math.max(0, 8 - quote.items.length);

  return (
    <section className="quote-document" aria-label="پیش‌فاکتور آماده چاپ">
      <div className="quote-document-actions">
        <strong>پیش‌فاکتور آماده است.</strong>
        <button type="button" onClick={() => window.print()}>
          چاپ یا ذخیره PDF
        </button>
      </div>
      <article className="quote-print-sheet" dir="rtl">
        <header className="quote-print-header">
          <img src="/brand/bonyan-foulad-daria-logo.png" alt="بنیان فولاد داریا" />
          <div className="quote-print-company">
            <p>پیش‌فاکتور فروش</p>
            <h2>{siteConfig.brand.name}</h2>
            <span>تامین و استعلام محصولات فولادی</span>
          </div>
          <dl>
            <div><dt>شماره:</dt><dd dir="ltr">{quote.number}</dd></div>
            <div><dt>تاریخ:</dt><dd>{quote.date}</dd></div>
            <div><dt>وضعیت:</dt><dd>غیرقطعی</dd></div>
          </dl>
        </header>

        <section className="quote-customer-details" aria-label="مشخصات خریدار">
          <p><strong>نام خریدار:</strong> {quote.fullName}</p>
          <p><strong>شماره تماس:</strong> <b dir="ltr">{quote.phone}</b></p>
          <p><strong>شهر مقصد:</strong> {quote.destination}</p>
        </section>

        <table className="quote-print-table">
          <thead>
            <tr>
              <th>ردیف</th>
              <th>شرح کالا</th>
              <th>تعداد</th>
              <th>واحد</th>
              <th>مبلغ واحد (ریال)</th>
              <th>مبلغ کل (ریال)</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={`${item.product}-${index}`}>
                <td>{(index + 1).toLocaleString("fa-IR")}</td>
                <td>{item.product}</td>
                <td>{Number(item.quantity).toLocaleString("fa-IR")}</td>
                <td>{item.unit}</td>
                <td>{item.unitPriceRial ? item.unitPriceRial.toLocaleString("fa-IR") : "استعلام فروش"}</td>
                <td>{item.totalRial ? item.totalRial.toLocaleString("fa-IR") : "استعلام فروش"}</td>
                <td>{item.dimensions || "-"}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRowCount }, (_, index) => (
              <tr className="quote-print-empty-row" key={`empty-${index}`}>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <section className="quote-print-summary">
          <div className="quote-total-box">
            <div>
              <span>جمع ردیف‌های قابل محاسبه</span>
              <strong>{formatRial(quote.totalRial)}</strong>
            </div>
            <div>
              <span>تعداد ردیف‌های برآوردشده</span>
              <strong>
                {calculableItems.length.toLocaleString("fa-IR")} از {quote.items.length.toLocaleString("fa-IR")}
              </strong>
            </div>
            <div className="quote-total-final">
              <span>جمع برآوردی پیش‌فاکتور</span>
              <strong>{formatRial(quote.totalRial)}</strong>
            </div>
          </div>
          <div className="quote-print-notes">
            <p><strong>مبلغ به حروف:</strong> {rialToWords(quote.totalRial)}</p>
            <p><strong>توضیحات خریدار:</strong> {quote.notes || "ندارد"}</p>
            <p>{quoteDisclaimer}</p>
          </div>
        </section>

        <footer className="quote-print-footer">
          <address>
            <strong>نشانی:</strong> {siteConfig.business.address}، {siteConfig.business.city}<br />
            <strong>تلفن:</strong> <span dir="ltr">{phones.map((phone) => phone.label).join(" - ")}</span>
          </address>
          <div><span>امضای فروشنده</span><span>امضای خریدار</span></div>
        </footer>
      </article>
    </section>
  );
}

function ErrorMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id} role="alert">
      {message}
    </span>
  );
}

function usePreparedRequest() {
  const [preparedText, setPreparedText] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const prepare = (text: string) => {
    setPreparedText(text);
    setCopyMessage("");
    window.requestAnimationFrame(() => resultRef.current?.focus());
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preparedText);
      setCopyMessage("متن درخواست کپی شد.");
    } catch {
      setCopyMessage(
        "کپی خودکار ممکن نشد؛ متن را انتخاب و به‌صورت دستی کپی کنید.",
      );
    }
  };

  const clear = () => {
    setPreparedText("");
    setCopyMessage("");
  };

  return { preparedText, copyMessage, resultRef, prepare, copy, clear };
}

function PreparedRequest({
  title,
  preparedText,
  copyMessage,
  resultRef,
  onCopy,
}: {
  title: string;
  preparedText: string;
  copyMessage: string;
  resultRef: React.RefObject<HTMLDivElement | null>;
  onCopy: () => void;
}) {
  if (!preparedText) return null;

  return (
    <div className="prepared-request" ref={resultRef} tabIndex={-1}>
      <h3>{title}</h3>
      <p>
        این متن هنوز برای واحد فروش یا مدیریت ارسال نشده است. آن را کپی کنید و
        هنگام تماس در اختیار پاسخ‌گو بگذارید.
      </p>
      <textarea readOnly value={preparedText} aria-label="متن آماده‌شده درخواست" />
      <div className="prepared-actions">
        <button type="button" onClick={onCopy}>
          کپی متن درخواست
        </button>
        <a href={phones[0].href}>تماس با واحد فروش</a>
        {siteConfig.contact.officialEmail ? (
          <a
            href={`mailto:${siteConfig.contact.officialEmail}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(preparedText)}`}
          >
            ارسال با ایمیل رسمی
          </a>
        ) : null}
      </div>
      <p className="copy-status" role="status" aria-live="polite">
        {copyMessage}
      </p>
    </div>
  );
}

export function QuoteRequestForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [items, setItems] = useState<QuoteItem[]>([createQuoteItem(1)]);
  const [targetItemCount, setTargetItemCount] = useState(1);
  const [priceEstimates, setPriceEstimates] =
    useState<QuotePriceEstimates | null>(null);
  const [priceLoadError, setPriceLoadError] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<GeneratedQuote | null>(
    null,
  );
  const nextItemId = useRef(2);
  const prepared = usePreparedRequest();

  useEffect(() => {
    let active = true;

    loadQuotePriceEstimates()
      .then((estimates) => {
        if (!active) return;
        setPriceEstimates(estimates);
        setPriceLoadError(false);
      })
      .catch(() => {
        if (!active) return;
        setPriceLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const pricedItems = useMemo(
    () =>
      items.map((item) => {
        const estimate =
          item.product && priceEstimates
            ? priceEstimates[item.product]
            : undefined;
        const approximateTotal = estimate
          ? calculateApproximateTotal(
              estimate.unitPriceTomanPerKg,
              Number(item.quantity),
              item.unit,
            )
          : null;

        return { item, estimate, approximateTotal };
      }),
    [items, priceEstimates],
  );

  const approximateGrandTotal = useMemo(
    () =>
      pricedItems.reduce(
        (sum, pricedItem) => sum + (pricedItem.approximateTotal ?? 0),
        0,
      ),
    [pricedItems],
  );
  const pricedItemCount = pricedItems.filter(
    (pricedItem) => pricedItem.approximateTotal !== null,
  ).length;

  const updateItem = (itemId: number, patch: Partial<QuoteItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
    prepared.clear();
    setGeneratedQuote(null);
  };

  const appendItems = (count: number) => {
    const available = MAX_QUOTE_ITEMS - items.length;
    const amount = Math.min(Math.max(count, 0), available);
    if (!amount) return;

    const additions = Array.from({ length: amount }, () =>
      createQuoteItem(nextItemId.current++),
    );
    setItems((current) => [...current, ...additions]);
    setTargetItemCount(items.length + amount);
    setErrors({});
    prepared.clear();
    setGeneratedQuote(null);
    window.requestAnimationFrame(() => {
      const firstNewProduct = document.querySelector<HTMLElement>(
        `[name="itemProduct-${additions[0].id}"]`,
      );
      firstNewProduct?.focus();
    });
  };

  const applyTargetItemCount = () => {
    const requested = Math.min(
      Math.max(Math.trunc(targetItemCount || 1), 1),
      MAX_QUOTE_ITEMS,
    );
    setTargetItemCount(requested);

    if (requested > items.length) {
      appendItems(requested - items.length);
      return;
    }
    if (requested < items.length) {
      setItems((current) => current.slice(0, requested));
      setErrors({});
      prepared.clear();
      setGeneratedQuote(null);
    }
  };

  const removeItem = (itemId: number) => {
    if (items.length === 1) return;
    setItems((current) => current.filter((item) => item.id !== itemId));
    setTargetItemCount(items.length - 1);
    setErrors({});
    prepared.clear();
    setGeneratedQuote(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "");
    const phone = String(form.get("phone") ?? "");
    const destination = String(form.get("destination") ?? "");
    const notes = String(form.get("notes") ?? "");
    const accepted = form.get("acceptDisclaimer") === "on";

    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
    };

    const quoteItems = items.map((item, index) => {
      const productField = `itemProduct-${item.id}`;
      const quantityField = `itemQuantity-${item.id}`;
      const { product, quantity, unit, dimensions } = item;
      const itemNumber = (index + 1).toLocaleString("fa-IR");

      nextErrors[productField] = validateRequired(
        product,
        `نوع کالای ${itemNumber}`,
      );
      nextErrors[quantityField] = validateRequired(
        quantity,
        `مقدار تقریبی کالای ${itemNumber}`,
      );

      const numericQuantity = Number(quantity);
      if (
        !nextErrors[quantityField] &&
        (!Number.isFinite(numericQuantity) || numericQuantity <= 0)
      ) {
        nextErrors[quantityField] =
          `مقدار تقریبی کالای ${itemNumber} باید عددی بزرگ‌تر از صفر باشد.`;
      }

      const estimate =
        product && priceEstimates ? priceEstimates[product] : undefined;
      const approximateTotal = estimate
        ? calculateApproximateTotal(
            estimate.unitPriceTomanPerKg,
            numericQuantity,
            unit,
          )
        : null;

      return {
        product,
        quantity,
        unit,
        dimensions,
        estimate,
        approximateTotal,
      };
    });

    nextErrors.destination = validateRequired(destination, "شهر مقصد");
    nextErrors.acceptDisclaimer = accepted
      ? ""
      : "برای آماده‌سازی درخواست باید متن غیرقطعی‌بودن درخواست را تأیید کنید.";

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      const firstErrorField = Object.entries(nextErrors).find(
        ([, message]) => Boolean(message),
      )?.[0];
      const firstInvalid = firstErrorField
        ? event.currentTarget.elements.namedItem(firstErrorField)
        : null;
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    prepared.prepare(
      [
        "درخواست پیش‌فاکتور غیرقطعی",
        `نام: ${fullName.trim()}`,
        `شماره تماس: ${phone.trim()}`,
        "",
        `کالاهای درخواست (${quoteItems.length.toLocaleString("fa-IR")} کالا):`,
        ...quoteItems.map((item, index) => {
          const priceDescription =
            item.approximateTotal !== null && item.estimate
              ? ` | قیمت تقریبی: ${formatToman(item.approximateTotal)} (مبنای محاسبه: ${formatToman(item.estimate.unitPriceTomanPerKg)} برای هر کیلوگرم)`
              : " | قیمت تقریبی: نیازمند بررسی واحد فروش";
          return `${(index + 1).toLocaleString("fa-IR")}) ${item.product.trim()} | ${item.quantity.trim()} ${item.unit} | ابعاد/استاندارد: ${item.dimensions.trim() || "اعلام نشده"}${priceDescription}`;
        }),
        "",
        `جمع تقریبی: ${
          quoteItems.some((item) => item.approximateTotal !== null)
            ? formatToman(
                quoteItems.reduce(
                  (sum, item) => sum + (item.approximateTotal ?? 0),
                  0,
                ),
              )
            : "محاسبه نشده"
        }`,
        "قیمت‌های تقریبی بالا صرفاً اطلاع‌رسانی هستند و ممکن است همه کالاها را پوشش ندهند.",
        "",
        `شهر مقصد: ${destination.trim()}`,
        `توضیحات: ${notes.trim() || "ندارد"}`,
        "",
        quoteDisclaimer,
      ].join("\n"),
    );
    setGeneratedQuote({
      number: `PF-${String(Date.now()).slice(-8)}`,
      date: persianDate(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      destination: destination.trim(),
      notes: notes.trim(),
      items: quoteItems.map((item) => ({
        product: item.product as QuoteProductName,
        quantity: item.quantity,
        unit: item.unit,
        dimensions: item.dimensions,
        unitPriceRial: item.estimate
          ? item.estimate.unitPriceTomanPerKg * 10
          : null,
        totalRial:
          item.approximateTotal === null ? null : item.approximateTotal * 10,
      })),
      totalRial: quoteItems.reduce(
        (sum, item) => sum + (item.approximateTotal ?? 0) * 10,
        0,
      ),
    });
  };

  return (
    <form
      className="request-form"
      id="quote-form"
      noValidate
      onSubmit={submit}
      onChange={() => {
        prepared.clear();
        setGeneratedQuote(null);
      }}
    >
      <div className="form-heading">
        <span>فرم محلی</span>
        <h2>آماده‌سازی درخواست پیش‌فاکتور غیرقطعی</h2>
        <p>
          اطلاعات این فرم در مرورگر شما آماده می‌شود و تا زمان تماس یا ارسال
          از طریق ایمیل رسمی، به واحد فروش تحویل نمی‌شود.
        </p>
      </div>
      <div className="form-grid">
        <label>
          نام و نام خانوادگی
          <input
            name="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "quote-name-error" : undefined}
          />
          <ErrorMessage id="quote-name-error" message={errors.fullName} />
        </label>
        <label>
          شماره تماس
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            placeholder="09121234567"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "quote-phone-error" : undefined}
          />
          <ErrorMessage id="quote-phone-error" message={errors.phone} />
        </label>
        <label>
          شهر مقصد
          <input
            name="destination"
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={
              errors.destination ? "quote-destination-error" : undefined
            }
          />
          <ErrorMessage
            id="quote-destination-error"
            message={errors.destination}
          />
        </label>
        <label className="form-wide">
          توضیحات تکمیلی
          <textarea name="notes" rows={4} maxLength={1000} />
        </label>
      </div>
      <section className="quote-items" aria-labelledby="quote-items-heading">
        <div className="quote-items-heading">
          <div>
            <span>کالاهای پیش‌فاکتور</span>
            <h3 id="quote-items-heading">
              محصولات موردنیاز را در یک درخواست وارد کنید
            </h3>
            <p>
              می‌توانید تا {MAX_QUOTE_ITEMS.toLocaleString("fa-IR")} کالا را
              داخل همین پیش‌فاکتور وارد کنید.
            </p>
          </div>
          <div className="quote-item-count">
            <label htmlFor="quote-item-count">تعداد کالاها</label>
            <input
              id="quote-item-count"
              type="number"
              min="1"
              max={MAX_QUOTE_ITEMS}
              value={targetItemCount}
              onChange={(event) =>
                setTargetItemCount(Number(event.currentTarget.value))
              }
            />
            <button type="button" onClick={applyTargetItemCount}>
              ساخت ردیف‌ها
            </button>
          </div>
        </div>
        <div className="quote-items-list">
          {items.map((item, index) => {
            const itemNumber = (index + 1).toLocaleString("fa-IR");
            const productField = `itemProduct-${item.id}`;
            const quantityField = `itemQuantity-${item.id}`;
            const productErrorId = `quote-product-${item.id}-error`;
            const quantityErrorId = `quote-quantity-${item.id}-error`;
            const pricedItem = pricedItems[index];

            return (
              <fieldset className="quote-item-card" key={item.id}>
                <legend>کالای {itemNumber}</legend>
                {items.length > 1 ? (
                  <button
                    className="remove-quote-item"
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`حذف کالای ${itemNumber}`}
                  >
                    حذف این کالا
                  </button>
                ) : null}
                <div className="quote-item-grid">
                  <label>
                    نوع محصول
                    <select
                      name={productField}
                      value={item.product}
                      onChange={(event) =>
                        updateItem(item.id, {
                          product: event.currentTarget
                            .value as QuoteItem["product"],
                        })
                      }
                      aria-invalid={Boolean(errors[productField])}
                      aria-describedby={
                        errors[productField] ? productErrorId : undefined
                      }
                    >
                      <option value="" disabled>
                        انتخاب کنید
                      </option>
                      {productOptions.map((product) => (
                        <option key={product}>{product}</option>
                      ))}
                    </select>
                    <ErrorMessage
                      id={productErrorId}
                      message={errors[productField]}
                    />
                  </label>
                  <label>
                    مقدار تقریبی
                    <span className="compound-field">
                      <input
                        name={quantityField}
                        type="number"
                        min="0.01"
                        step="any"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, {
                            quantity: event.currentTarget.value,
                          })
                        }
                        aria-invalid={Boolean(errors[quantityField])}
                        aria-describedby={
                          errors[quantityField]
                            ? quantityErrorId
                            : undefined
                        }
                      />
                      <select
                        name={`itemUnit-${item.id}`}
                        aria-label={`واحد مقدار کالای ${itemNumber}`}
                        value={item.unit}
                        onChange={(event) =>
                          updateItem(item.id, {
                            unit: event.currentTarget.value as QuoteItem["unit"],
                          })
                        }
                      >
                        <option>تن</option>
                        <option>کیلوگرم</option>
                        <option>شاخه</option>
                        <option>عدد</option>
                      </select>
                    </span>
                    <ErrorMessage
                      id={quantityErrorId}
                      message={errors[quantityField]}
                    />
                  </label>
                  <label>
                    ابعاد، گرید یا استاندارد
                    <input
                      name={`itemDimensions-${item.id}`}
                      placeholder="مثلاً میلگرد A3 سایز 16"
                      value={item.dimensions}
                      onChange={(event) =>
                        updateItem(item.id, {
                          dimensions: event.currentTarget.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="quote-item-price" aria-live="polite">
                  {!priceEstimates && !priceLoadError ? (
                    <span>در حال دریافت قیمت تقریبی از داده‌های سایت…</span>
                  ) : priceLoadError ? (
                    <span>
                      دریافت قیمت تقریبی ممکن نشد؛ برای قیمت روز با واحد فروش
                      تماس بگیرید.
                    </span>
                  ) : !item.product ? (
                    <span>
                      پس از انتخاب کالا و واردکردن مقدار، قیمت تقریبی نمایش داده
                      می‌شود.
                    </span>
                  ) : !pricedItem.estimate ? (
                    <span>
                      برای این کالا قیمت وزنی قابل محاسبه نیست؛ با واحد فروش
                      تماس بگیرید.
                    </span>
                  ) : item.unit === "شاخه" || item.unit === "عدد" ? (
                    <span>
                      داده قیمت سایت بر حسب کیلوگرم است؛ برای محاسبه بر اساس{" "}
                      {item.unit} وزن یا مشخصات دقیق را با واحد فروش هماهنگ کنید.
                    </span>
                  ) : pricedItem.approximateTotal === null ? (
                    <span>
                      برای مشاهده برآورد، مقدار معتبر بزرگ‌تر از صفر وارد کنید.
                    </span>
                  ) : (
                    <>
                      <span>
                        میانگین داده قیمت سایت:{" "}
                        <strong>
                          {formatToman(
                            pricedItem.estimate.unitPriceTomanPerKg,
                          )}
                        </strong>{" "}
                        برای هر کیلوگرم
                      </span>
                      <span>
                        قیمت تقریبی این کالا:{" "}
                        <strong>
                          {formatToman(pricedItem.approximateTotal)}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </fieldset>
            );
          })}
        </div>
        <button
          className="add-quote-item"
          type="button"
          onClick={() => appendItems(1)}
          disabled={items.length >= MAX_QUOTE_ITEMS}
        >
          + افزودن کالای جدید
        </button>
      </section>
      <section className="quote-price-summary" aria-live="polite">
        <span>جمع تقریبی پیش‌فاکتور</span>
        <strong>
          {pricedItemCount
            ? formatToman(approximateGrandTotal)
            : "هنوز قابل محاسبه نیست"}
        </strong>
        <p>
          {pricedItemCount
            ? `جمع ${pricedItemCount.toLocaleString("fa-IR")} از ${items.length.toLocaleString("fa-IR")} کالا محاسبه شده است. `
            : ""}
          این مبلغ از داده‌های قیمت فعلی سایت و فقط برای واحد تن یا کیلوگرم
          محاسبه می‌شود، نهایی نیست و برای تأیید قیمت و موجودی باید با واحد فروش
          تماس بگیرید.
        </p>
      </section>
      <div className="legal-confirmation">
        <p>{quoteDisclaimer}</p>
        <label>
          <input
            name="acceptDisclaimer"
            type="checkbox"
            aria-invalid={Boolean(errors.acceptDisclaimer)}
            aria-describedby={
              errors.acceptDisclaimer ? "quote-disclaimer-error" : undefined
            }
          />
          متن بالا را خواندم و می‌پذیرم.
        </label>
        <ErrorMessage
          id="quote-disclaimer-error"
          message={errors.acceptDisclaimer}
        />
      </div>
      <button className="form-submit" type="submit">
        بررسی و آماده‌سازی درخواست
      </button>
      {generatedQuote ? (
        <QuoteDocument quote={generatedQuote} />
      ) : (
        <PreparedRequest
          title="پیش‌نویس درخواست پیش‌فاکتور"
          preparedText={prepared.preparedText}
          copyMessage={prepared.copyMessage}
          resultRef={prepared.resultRef}
          onCopy={prepared.copy}
        />
      )}
    </form>
  );
}

export function ComplaintForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const prepared = usePreparedRequest();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const requestType = String(form.get("requestType") ?? "ثبت شکایت جدید");
    const fullName = String(form.get("fullName") ?? "");
    const phone = String(form.get("phone") ?? "");
    const reference = String(form.get("reference") ?? "");
    const subject = String(form.get("subject") ?? "");
    const description = String(form.get("description") ?? "");

    const nextErrors: FieldErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      reference:
        requestType === "پیگیری شکایت" && !reference.trim()
          ? "برای پیگیری، کد یا مرجع قبلی را وارد کنید."
          : "",
      subject: validateRequired(subject, "موضوع"),
      description: validateMinimumText(description, "شرح موضوع", 20),
    };

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      const firstErrorField = Object.entries(nextErrors).find(
        ([, message]) => Boolean(message),
      )?.[0];
      const firstInvalid = firstErrorField
        ? event.currentTarget.elements.namedItem(firstErrorField)
        : null;
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      return;
    }

    prepared.prepare(
      [
        requestType,
        `نام: ${fullName.trim()}`,
        `شماره تماس: ${phone.trim()}`,
        `کد یا مرجع قبلی: ${reference.trim() || "ندارد"}`,
        `موضوع: ${subject.trim()}`,
        `شرح: ${description.trim()}`,
      ].join("\n"),
    );
  };

  return (
    <form className="request-form" id="complaint-form" noValidate onSubmit={submit}>
      <div className="form-heading">
        <span>ثبت و پیگیری</span>
        <h2>آماده‌سازی متن شکایت یا درخواست پیگیری</h2>
        <p>
          تا پیش از اعلام ایمیل رسمی یا سامانه ثبت، این فرم فقط متن شما را
          آماده می‌کند. ثبت نهایی از طریق تماس با مدیریت انجام می‌شود.
        </p>
      </div>
      <div className="form-grid">
        <label>
          نوع درخواست
          <select name="requestType">
            <option>ثبت شکایت جدید</option>
            <option>پیگیری شکایت</option>
          </select>
        </label>
        <label>
          نام و نام خانوادگی
          <input
            name="fullName"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={
              errors.fullName ? "complaint-name-error" : undefined
            }
          />
          <ErrorMessage id="complaint-name-error" message={errors.fullName} />
        </label>
        <label>
          شماره تماس
          <input
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? "complaint-phone-error" : undefined
            }
          />
          <ErrorMessage id="complaint-phone-error" message={errors.phone} />
        </label>
        <label>
          کد یا مرجع قبلی
          <input
            name="reference"
            dir="ltr"
            aria-invalid={Boolean(errors.reference)}
            aria-describedby={
              errors.reference ? "complaint-reference-error" : undefined
            }
          />
          <ErrorMessage
            id="complaint-reference-error"
            message={errors.reference}
          />
        </label>
        <label className="form-wide">
          موضوع
          <input
            name="subject"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={
              errors.subject ? "complaint-subject-error" : undefined
            }
          />
          <ErrorMessage id="complaint-subject-error" message={errors.subject} />
        </label>
        <label className="form-wide">
          شرح موضوع
          <textarea
            name="description"
            rows={6}
            maxLength={2000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "complaint-description-error" : undefined
            }
          />
          <ErrorMessage
            id="complaint-description-error"
            message={errors.description}
          />
        </label>
      </div>
      <button className="form-submit" type="submit">
        بررسی و آماده‌سازی متن
      </button>
      <PreparedRequest
        title="پیش‌نویس شکایت یا پیگیری"
        preparedText={prepared.preparedText}
        copyMessage={prepared.copyMessage}
        resultRef={prepared.resultRef}
        onCopy={prepared.copy}
      />
    </form>
  );
}
