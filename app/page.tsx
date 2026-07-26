import type { Metadata } from "next";
import IronDemo from "./IronDemo";

export const metadata: Metadata = {
  title: "فولادینو | بازار آنلاین آهن و فولاد",
  description:
    "دموی فارسی و راست‌چین فروش آهن‌آلات با قیمت‌های نمایشی، استعلام سریع و مشاوره تخصصی.",
};

export default function Home() {
  return <IronDemo />;
}
