import { Fragment } from "react";
import { WhatsAppIcon } from "./icons";
import {
  managementContacts,
  officialEmail,
  phones,
  shortAddress,
  whatsappCommunityUrl,
} from "./contact-data";
import { Brand } from "./site-ui";

const quickAccessLinks = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/#products", label: "محصولات" },
  { href: "/#prices", label: "قیمت‌ها" },
  { href: "/quote-process/", label: "درخواست پیش‌فاکتور" },
  { href: "/contact/", label: "تماس با ما" },
] as const;

const infoPageLinks = [
  { href: "/about/", label: "درباره ما" },
  { href: "/shipping-delivery/", label: "ارسال و تحویل" },
  { href: "/terms/", label: "شرایط استفاده" },
  { href: "/privacy/", label: "حریم خصوصی" },
  { href: "/complaints/", label: "ثبت شکایت و پیگیری" },
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
        <div className="footer-col-brand">
          <Brand headerLogo href={homeHref} />
          <p>
            معرفی و استعلام مقاطع فولادی برای پروژه‌های ساختمانی و صنعتی.
          </p>
          <a
            className="footer-whatsapp-cta"
            href={whatsappCommunityUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon />
            عضویت در کامیونیتی واتساپ
          </a>
        </div>
        <div className="footer-col-quick">
          <h2>دسترسی سریع</h2>
          {quickAccessLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="footer-col-info">
          <h2>اطلاعات و راهنما</h2>
          {infoPageLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div id="phone-numbers">
          <h2>تماس</h2>
          {phones.map((phone) => (
            <a href={phone.href} key={phone.href} dir="ltr">
              {phone.label}
            </a>
          ))}
          {officialEmail ? (
            <a href={`mailto:${officialEmail}`} dir="ltr">
              {officialEmail}
            </a>
          ) : null}
          <address>{shortAddress}</address>
          <a href="/contact/">مشاهده صفحه کامل تماس</a>
          <div className="footer-management">
            <span className="footer-management-label">تماس با مدیریت</span>
            {managementContacts.map((contact) => (
              <Fragment key={contact.href}>
                <strong className="footer-contact-name">
                  {contact.name}
                </strong>
                <a href={contact.href} dir="ltr">
                  {contact.label}
                </a>
              </Fragment>
            ))}
          </div>
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
