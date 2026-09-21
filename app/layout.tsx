import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yenway — заказ вещей из Японии, Кореи, Китая, США и Европы",
  description:
    "Yenway помогает заказать вещи с зарубежных площадок Японии, Кореи, Китая, США и Европы: расчёт стоимости, страховка и доставка."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-ink text-white antialiased">{children}</body>
    </html>
  );
}
