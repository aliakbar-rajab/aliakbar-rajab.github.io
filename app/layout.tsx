import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  const protocol =
    incomingHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = host ? new URL(`${protocol}://${host}`) : new URL("https://example.com");
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "فولادینو | بازار آنلاین آهن و فولاد",
      template: "%s | فولادینو",
    },
    description:
      "مرجع سریع استعلام و خرید آهن‌آلات ساختمانی و صنعتی با مشاوره تخصصی.",
    openGraph: {
      title: "فولادینو | خرید حرفه‌ای آهن‌آلات",
      description: "قیمت شفاف، مشاوره تخصصی و ارسال مطمئن به سراسر ایران.",
      locale: "fa_IR",
      type: "website",
      images: [{ url: socialImage, width: 1200, height: 630, alt: "فولادینو؛ بازار حرفه‌ای آهن" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "فولادینو | خرید حرفه‌ای آهن‌آلات",
      description: "قیمت شفاف، مشاوره تخصصی و ارسال مطمئن.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
