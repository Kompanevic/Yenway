"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { REGION_LIST } from "@/lib/regions";
import RegionGlobe from "./RegionGlobe";
import Flag from "./Flag";

const TELEGRAM = "https://t.me/yenwayjapan";

// cta — главная кнопка (выделена); match — какие разделы подсвечивают пункт;
// external — ссылка наружу. «Смотреть вещи» ведёт в «Под заказ», а «В наличии»
// и «Выкупленные» — через переключатель на той же странице.
const NAV: { href: string; label: string; cta?: boolean; match?: string[]; external?: boolean }[] = [
  { href: "/order", label: "Рассчитать", cta: true },
  { href: "/search", label: "Найти вещь" },
  { href: "/preorder", label: "Смотреть вещи", match: ["/preorder", "/stock", "/bought"] },
  { href: "/legit", label: "Легит-чек" },
  { href: "/reviews", label: "Отзывы" },
  { href: TELEGRAM, label: "ТГ", external: true },
  { href: "/wardrobe", label: "Гардероб" }
];

// Общая шапка всех страниц (кроме админки): липкая, с подсветкой текущего раздела.
export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Закрываем мобильное меню при переходе на другую страницу
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const active = (n: (typeof NAV)[number]) => !n.external && (n.match ?? [n.href]).some(isActive);

  return (
    <header className="sticky top-0 z-40 bg-ink/75 backdrop-blur-md border-b border-line/60">
      {/* Сетка: логотип слева, меню строго по центру, справа кнопка меню (телефон) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-3 xl:py-4">
        {/* Логотип — на главную */}
        <motion.div className="shrink-0 justify-self-start" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/" aria-label="YenWay — на главную" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="YenWay" width={40} height={40} className="rounded-full" priority />
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">YenWay</span>
          </Link>
        </motion.div>

        <nav className="hidden xl:flex col-start-2 translate-x-5 items-center gap-4 2xl:gap-6 font-display text-[13px] 2xl:text-sm uppercase tracking-wide text-white/60 whitespace-nowrap">
          {NAV.map((n) =>
            n.cta ? (
              <Link
                key={n.href}
                href={n.href}
                className="font-display rounded-full btn-fx bg-accent text-ink px-5 py-2 font-semibold hover:bg-accent2 transition-colors"
              >
                {n.label}
              </Link>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={`relative group py-1 transition-colors hover:text-white ${active(n) ? "text-white" : ""}`}
              >
                {n.label}
                <span
                  className={`absolute left-0 -bottom-0.5 h-px bg-accent transition-all duration-300 group-hover:w-full ${active(n) ? "w-full" : "w-0"}`}
                />
              </Link>
            )
          )}
          {/* Глобус с выбором страны — в конце строки */}
          <RegionGlobe />
        </nav>

        <button
          type="button"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="tg-hide xl:hidden col-start-3 justify-self-end flex flex-col justify-center items-center gap-1.5 w-10 h-10 shrink-0"
        >
          <motion.span animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="block h-0.5 w-6 bg-white rounded-full" />
          <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} className="block h-0.5 w-6 bg-white rounded-full" />
          <motion.span animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="block h-0.5 w-6 bg-white rounded-full" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="xl:hidden overflow-hidden border-t border-line bg-panel"
          >
            {/* Длинное меню прокручивается внутри, не вылезая за экран */}
            <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col font-display text-lg">
              {/* «Рассчитать» — большой кнопкой внизу меню */}
              {NAV.filter((n) => !n.cta).map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={`py-3 border-b border-line/60 ${active(n) ? "text-white" : "text-white/70"}`}
                >
                  {n.label}
                  {n.external && " ↗"}
                </Link>
              ))}
              <div className="mt-4 mb-1 text-xs uppercase tracking-widest text-white/40">Заказать из страны</div>
              <div className="grid grid-cols-2 gap-2">
                {REGION_LIST.map((r) => (
                  <Link
                    key={r.key}
                    href={`/order?region=${r.key}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-line/60 px-3 py-2.5 text-base text-white/80"
                  >
                    <Flag region={r.key} className="w-[1.35em] h-[0.9em] rounded-[2px] shrink-0" />
                    {r.name}
                  </Link>
                ))}
              </div>
              <Link href="/order" className="btn-fx mt-4 rounded-full bg-accent text-ink text-center py-3 font-semibold">
                Рассчитать
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
