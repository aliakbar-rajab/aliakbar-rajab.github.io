import { Fragment } from "react";
import { localizeCatalogValue } from "./catalog-utils";
import { address, managementContacts, phones, postalCode } from "./contact-data";
import { Brand } from "./site-ui";

const essentialPageLinks = [
  { href: "/about/", label: "درباره ما" },
  { href: "/contact/", label: "تماس با ما" },
  { href: "/terms/", label: "شرایط استفاده" },
  { href: "/privacy/", label: "حریم خصوصی" },
  { href: "/quote-process/", label: "درخواست پیش‌فاکتور" },
  { href: "/complaints/", label: "ثبت شکایت و پیگیری" },
  { href: "/shipping-delivery/", label: "شرایط ارسال و تحویل" },
] as const;

type SiteFooterProps = {
  homeHref?: string;
  topHref?: string;
};

export function SiteFooter({
  homeHref = "/",
  topHref = "#top",
}: SiteFooterProps) {
  return (
    <footer className="site-footer" id="contact">
      <div className="shell footer-grid">
        <div>
          <Brand headerLogo href={homeHref} />
          <p>
            معرفی و استعلام مقاطع فولادی برای پروژه‌های ساختمانی و صنعتی؛ بدون
            فروش آنلاین یا ثبت سفارش قطعی.
          </p>
        </div>
        <div>
          <h2>دسترسی سریع</h2>
          <a href="/">صفحه اصلی</a>
          <a href="/#products">محصولات</a>
          <a href="/#prices">قیمت‌های اطلاع‌رسانی</a>
          <a href="/contact/">تماس با واحد فروش</a>
        </div>
        <div>
          <h2>اطلاعات و قوانین</h2>
          {essentialPageLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
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
          <h2>تماس با مدیریت</h2>
          {managementContacts.map((contact) => (
            <Fragment key={contact.href}>
              <strong className="footer-contact-name">{contact.name}</strong>
              <a href={contact.href} dir="ltr">
                {contact.label}
              </a>
            </Fragment>
          ))}
        </div>
        <div>
          <h2>نشانی دفتر</h2>
          <address>
            {address}
            <br />
            کد پستی {localizeCatalogValue(postalCode)}
          </address>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© ۲۰۲۰ بنیان فولاد داریا</span>
        <span className="footer-bottom-links">
          <a href="/privacy/">حریم خصوصی</a>
          <a href="/terms/">شرایط استفاده</a>
          <a href={topHref}>بازگشت به بالا ↑</a>
        </span>
      </div>
    </footer>
  );
}
