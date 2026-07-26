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
  return {
    metadataBase,
    title: {
      default: "فولاد بنیان | بازار آنلاین آهن و فولاد",
      template: "%s | فولاد بنیان",
    },
    description:
      "مرجع سریع استعلام و خرید آهن‌آلات ساختمانی و صنعتی با مشاوره تخصصی.",
    openGraph: {
      title: "فولاد بنیان | خرید حرفه‌ای آهن‌آلات",
      description: "قیمت شفاف، مشاوره تخصصی و ارسال مطمئن به سراسر ایران.",
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "فولاد بنیان | خرید حرفه‌ای آهن‌آلات",
      description: "قیمت شفاف، مشاوره تخصصی و ارسال مطمئن.",
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
