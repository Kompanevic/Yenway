"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { REGION_LIST } from "@/lib/regions";
import RegionGlobe from "./RegionGlobe";
import Flag from "./Flag";

const NAV = [
  { href: "/wardrobe", label: "Гардероб" },
  { href: "/search", label: "Найти вещь" },
  { href: "/stock", label: "В наличии" },
  { href: "/preorder", label: "Под заказ" },
  { href: "/reviews", label: "Отзывы" }
];

// Общая шапка всех страниц (кроме админки): липкая, с подсветкой текущего раздела.
export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Закрываем мобильное меню при переходе на другую страницу
  useEffect(() => setMenuOpen(false), [pathname]);

  if (pathname.startsWith("/admin")) return null;
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-ink/75 backdrop-blur-md border-b border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 py-3 lg:py-4">
        <motion.a
          href="https://t.me/yenwayjapan"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src="/logo.jpg" alt="YenWay" width={40} height={40} className="rounded-full" priority />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">YenWay</span>
        </motion.a>

        <nav className="hidden lg:flex items-center gap-6 font-display text-sm uppercase tracking-wide text-white/60 whitespace-nowrap">
          <RegionGlobe />
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`relative group py-1 transition-colors hover:text-white ${active(n.href) ? "text-white" : ""}`}
            >
              {n.label}
              <span
                className={`absolute left-0 -bottom-0.5 h-px bg-accent transition-all duration-300 group-hover:w-full ${active(n.href) ? "w-full" : "w-0"}`}
              />
            </Link>
          ))}
        </nav>
        <Link
          href="/order"
          className="hidden lg:inline-block shrink-0 font-display rounded-full btn-fx bg-accent text-ink px-6 py-2.5 text-sm font-semibold hover:bg-accent2 transition-colors"
        >
          Сделать заказ
        </Link>

        <button
          type="button"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden flex flex-col justify-center items-center gap-1.5 w-10 h-10 shrink-0"
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
            className="lg:hidden overflow-hidden border-t border-line bg-panel"
          >
            {/* Длинное меню прокручивается внутри, не вылезая за экран */}
            <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col font-display text-lg">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`py-3 border-b border-line/60 ${active(n.href) ? "text-white" : "text-white/70"}`}
                >
                  {n.label}
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
                Сделать заказ
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
