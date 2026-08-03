import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  weight: ["300", "400", "500", "700", "800", "900"],
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "صفحات هبوط عربية | معرض المواقع",
  description: "عشر صفحات هبوط عربية تفاعلية لعلامات تجارية متنوعة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
