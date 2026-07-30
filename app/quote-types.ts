import type { QuoteProductName } from "./quote-pricing";

export const quoteDisclaimer =
  "ثبت این درخواست به معنی ثبت سفارش، انعقاد قرارداد، تضمین موجودی یا قطعی‌شدن قیمت نیست. قیمت و شرایط نهایی پس از بررسی واحد فروش در پیش‌فاکتور دارای مدت اعتبار اعلام می‌شود.";

type GeneratedQuoteItem = {
  product: QuoteProductName;
  quantity: string;
  // The real, effective unit charged (may differ from the form's plain
  // واحد dropdown when a catalog pieceOption like برگ/طاقه‌ای/مترمربع applies).
  unit: string;
  dimensions: string;
  unitPriceRial: number | null;
  totalRial: number | null;
};

export type GeneratedQuote = {
  date: string;
  fullName: string;
  phone: string;
  destination: string;
  notes: string;
  items: GeneratedQuoteItem[];
  totalRial: number;
};
