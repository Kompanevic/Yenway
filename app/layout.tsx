import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "@fontsource-variable/unbounded";
import "./globals.css";

const title = "YenWay — заказ вещей из Японии, Европы, США, Китая и Кореи";
const description =
  "YenWay помогает заказать вещи с зарубежных площадок Японии, Европы, США, Китая и Кореи: расчёт стоимости, страховка и доставка.";

export const metadata: Metadata = {
  metadataBase: new URL("https://yenway.vercel.app"),
  title,
  description,
  openGraph: { title, description, siteName: "YenWay", locale: "ru_RU", type: "website" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-ink text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
