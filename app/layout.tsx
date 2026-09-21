import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YenWay — заказ вещей из Японии, Европы, США, Китая и Кореи",
  description:
    "YenWay помогает заказать вещи с зарубежных площадок Японии, Европы, США, Китая и Кореи: расчёт стоимости, страховка и доставка."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-white antialiased">{children}</body>
    </html>
  );
}
