# AGENTS.md — بنیان فولاد داریا (fouladbonyan.com)

## نقشه‌ی سریع
- ورودی اصلی: `index.html` → `static-entry/main.tsx`. بدون router واقعی؛ مسیر
  از `window.location.pathname` خوانده می‌شود (`about`, `contact`,
  `terms`, `privacy`, `quote-process`, `complaints`, `shipping-delivery` →
  `InfoPage`/`ContactPage`؛ هر مسیر دیگر → `App` که صفحه‌ی اصلی است).
- صفحه‌ی اصلی: `app/App.tsx` (۱۰۰۸ خط — هدر، مگامنو، هیرو/کاروسل، گرید
  دسته‌بندی، بخش قیمت، فرم تماس). قبل از ادیت، اول با grep بخش موردنظر را
  پیدا کن؛ کل فایل را برای یک تغییر کوچک لازم نیست بخوانی.
- صفحه‌ی تماس: `app/ContactPage.tsx`. صفحات اطلاعاتی: `app/InfoPage.tsx` +
  `app/info-page-data.ts`.
- فرم‌ها: `app/RequestForms.tsx` (۱۲۴۸ خط — `QuoteRequestForm` و
  `ComplaintForm` در یک فایل). فرم‌ها هیچ داده‌ای به سرور ارسال نمی‌کنند؛
  فقط متن آماده برای کپی/تماس/ایمیل می‌سازند.
- جدول قیمت مشترک: `app/RebarPrices.tsx` (`PriceCatalog`، ۸۲۶ خط)، مصرف‌شده
  توسط `BeamPrices.tsx` و `ProductPrices.tsx`.
- برند/تماس/آدرس: تنها منبع درست `app/site-config.ts` است. رشته‌های تماس یا
  آدرس را جای دیگری hardcode نکن؛ `docs/enamad-required-info.md` فهرست
  اطلاعاتی است که هنوز از مالک سایت دریافت نشده (مثلاً شناسه ملی، ایمیل
  رسمی) — این فیلدها عمداً `null` هستند.

## دیتای قیمت — قانون سخت
- `app/data/{rebar,beam,product}-prices.json` جمعاً حدود ۲.۲ مگابایت و
  ~۶۵ هزار خط JSON تولیدشده‌ی خودکارند. **هرگز این فایل‌ها را کامل نخوان.**
  برای فهمیدن schema، فقط چند خط اول (`Read` با `limit` کوچک، یا
  `head -c 2000`) کافی است.
- این فایل‌ها هر ۴ ساعت توسط `scripts/fetch-{rebar,beam,product}-prices.mjs`
  از منبع بازار رفرش و مستقیم روی `main` کامیت می‌شوند
  (`.github/workflows/pages.yml`، job با نام `refresh`). یعنی `main` بدون
  دخالت انسانی جلو می‌رود — قبل از شروع کار همیشه
  `git fetch origin main` بزن و وضعیت لوکال را با `origin/main` مقایسه کن،
  و از `origin/main`، نه از یک checkout قدیمی، برنچ بساز.
- `scripts/validate-price-data.mjs` گیت اعتبارسنجی ساختاری/معنایی این
  فایل‌هاست و در `npm run build` قبل از `vite build` اجرا می‌شود.

## Pipeline ساخت
- `npm run build` این مراحل را پشت‌سرهم اجرا می‌کند:
  `prices:validate` → `vite build` → `scripts/generate-category-pages.mjs`
  → `scripts/generate-contact-page.mjs`.
- دو اسکریپت آخر بعد از build، `dist/<route>/index.html` را برای هر مسیر
  ثابت (۸ صفحه‌ی دسته‌بندی محصول + `/contact/` + ۶ صفحه‌ی اطلاعاتی) از
  `dist/index.html` کلون می‌کنند و **`dist/sitemap.xml` را هم در همین مرحله
  با تمام مسیرها بازتولید می‌کنند** — فایل `public/sitemap.xml` در گیت فقط
  یک seed تک‌URL است؛ سایت زنده و `dist/` کامل‌اند. اگر بحث sitemap پیش
  آمد، این نکته را نادیده نگیر.
- قبل از تغییر ساختار مسیرها یا افزودن یک صفحه‌ی ثابت جدید، این دو اسکریپت
  و `app/info-page-data.ts` را با هم چک کن.

## قواعد ویرایش
- `eslint.config.mjs` روی `**/*.{ts,tsx,mjs}` اعمال می‌شود — همه‌ی
  اسکریپرها/فایل‌های `.mjs` هم لینت می‌شوند؛ `checkJs` در `tsconfig.json`
  همچنان `false` است، پس این فایل‌ها typecheck نمی‌شوند.
- تست‌ها: `npm run verify` (lint → typecheck → test → build → test:build).
  قبل از هر push اجرا کن؛ **هر push به `main` بلافاصله روی Cloudflare
  Pages دیپلوی می‌شود.**
- `npm run dev` دیگر CSP را نمی‌شکند (پلاگین `allowViteDevelopmentStyles`
  در `vite.config.ts` فقط در حالت dev متای CSP را حذف می‌کند).
- **`main` روی گیت‌هاب branch protection دارد.** `git push origin main`
  مستقیم رد می‌شود (`GH013: Changes must be made through a pull request`)
  و چک وضعیت `build` اجباری است. مسیر همیشه: برنچ → PR → سبزشدن `build`
  → squash-merge. کامیت خودکار رفرش قیمت (job `refresh`) از این قانون
  مستثناست؛ push انسانی/ایجنت نیست.

## هشدار محیط لوکال
این ریپو به‌خاطر کامیت خودکار دیتای قیمت هر ۴ ساعت و کار روی برنچ‌های
موقت (`agent/*`) به‌سرعت stale می‌شود. قبل از هر ادعا درباره‌ی «وضعیت
فعلی کد»:
```bash
git fetch origin main
git rev-parse main origin/main   # باید یکسان باشند
```
اگر یکسان نبودند، برنچ جدید را از `origin/main` بساز، نه از `main` لوکال.

- **مخزن گیت‌هاب private است.** برای از‌بین‌بردن نسخه‌ی duplicate سایت روی
  `aliakbar-rajab.github.io` (که با وجود حذف job دیپلوی از ورک‌فلو، همچنان
  زنده و ایندکس‌پذیر مانده بود) عمداً private شد؛ نام مخزن عوض نشده و اتصال
  Cloudflare Pages سالم است. **پیامد:** دقیقه‌های GitHub Actions اکنون
  شمارش می‌شوند (سقف رایگان ماهانه‌ی مخازن private، نه نامحدود مثل public)،
  و ورک‌فلوی رفرش قیمت روزی ۶ بار اجرا می‌شود — اگر رفتار CI/بودجه‌ی Actions
  موضوع کار بود، این را در نظر بگیر.
