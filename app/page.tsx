"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { REGION_LIST } from "@/lib/regions";
import { MANAGER_TELEGRAM } from "@/lib/pricing";
import RegionGlobe from "@/components/RegionGlobe";
import { plural } from "@/lib/plural";

const JOURNAL_BANNERS = [
  {
    brand: "Vetements",
    text: "Деконструкция как манифест",
    render: (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #161617 0%, #161617 47%, #f3f0b8 47%, #f3f0b8 53%, #161617 53%, #161617 100%)"
          }}
        />
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
          style={{ background: "#c9e8c0", opacity: 0.45 }}
        />
      </div>
    )
  },
  {
    brand: "Balenciaga",
    text: "Дом, который переписывает правила",
    render: (
      <div className="absolute inset-0 bg-panel">
        <div
          className="absolute top-1/4 left-1/4 w-2/3 h-2/3 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, #d3c6ef, transparent 70%)", opacity: 0.55 }}
        />
        <div
          className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #bfe3e0, transparent 70%)", opacity: 0.5 }}
        />
        <div
          className="absolute top-0 left-0 w-1/3 h-1/3 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, #f7c9c9, transparent 70%)", opacity: 0.4 }}
        />
      </div>
    )
  },
  {
    brand: "Rick Owens",
    text: "Готическая эстетика на грани",
    render: (
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.08), transparent 60%)" }}
        />
        <div
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 blur-2xl"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.22), transparent)" }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
      </div>
    )
  },
  {
    brand: "Maison Margiela",
    text: "Анонимность как стиль",
    render: (
      <div className="absolute inset-0" style={{ background: "#19191a" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, transparent 42%, rgba(255,255,255,0.35) 42%, rgba(255,255,255,0.35) 43%, transparent 43%)"
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(80deg, transparent 60%, rgba(255,255,255,0.35) 60%, rgba(255,255,255,0.35) 61%, transparent 61%)"
          }}
        />
        <div
          className="absolute bottom-6 left-6 w-16 h-16 rounded-full blur-2xl"
          style={{ background: "#e8e6df", opacity: 0.12 }}
        />
      </div>
    )
  },
  {
    brand: "Comme des Garçons",
    text: "Красота в асимметрии",
    render: (
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-xl"
          style={{ background: "radial-gradient(circle, #c94b4b, transparent 70%)", opacity: 0.85 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(200deg, transparent 55%, rgba(255,255,255,0.07) 55%, rgba(255,255,255,0.07) 56.5%, transparent 56.5%)"
          }}
        />
      </div>
    )
  },
  {
    brand: "Yohji Yamamoto",
    text: "Чёрный — это тоже цвет",
    render: (
      <div className="absolute inset-0" style={{ background: "#0d0d0e" }}>
        <div
          className="absolute inset-y-0 left-1/4 w-1/4 blur-2xl"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.14), transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-1/4 w-1/3 blur-3xl"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.09), transparent)" }}
        />
      </div>
    )
  },
  {
    brand: "Alexander McQueen",
    text: "Драма на грани искусства",
    render: (
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.2), transparent 55%)" }}
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full"
          style={{
            background: "linear-gradient(160deg, transparent 48%, rgba(255,255,255,0.1) 49%, transparent 50%)"
          }}
        />
        <div
          className="absolute bottom-8 right-8 w-20 h-20 rounded-full blur-2xl"
          style={{ background: "#7c8a99", opacity: 0.35 }}
        />
      </div>
    )
  },
  {
    brand: "Junya Watanabe",
    text: "Конструктор из ткани",
    render: (
      <div className="absolute inset-0 bg-panel">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "18px 18px"
          }}
        />
        <div
          className="absolute top-6 right-6 w-20 h-20"
          style={{ background: "#f3f0b8", opacity: 0.45, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />
        <div
          className="absolute bottom-10 left-8 w-16 h-16 rounded-full blur-xl"
          style={{ background: "#bfe3e0", opacity: 0.4 }}
        />
      </div>
    )
  },
  {
    brand: "Ann Demeulemeester",
    text: "Тихий бунт в чёрном",
    render: (
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
      </div>
    )
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviews, setReviews] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews({ average: data.average ?? 0, count: data.count ?? 0 }))
      .catch(() => {});
  }, []);

  return (
    <main>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-30 max-w-7xl mx-auto px-6 flex items-center justify-between gap-6 py-7"
      >
        <motion.a
          href="https://t.me/yenwayjapan"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image src="/logo.jpg" alt="YenWay" width={48} height={48} className="rounded-full" />
          <span className="font-display text-2xl font-bold tracking-tight">YenWay</span>
        </motion.a>
        <nav className="hidden lg:flex items-center gap-6 font-display text-sm uppercase tracking-wide text-white/60 whitespace-nowrap">
          <RegionGlobe />
          <Link href="/wardrobe" className="relative group py-1 text-accent">
            Гардероб
            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link href="/search" className="relative group py-1">
            Найти вещь
            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link href="/stock" className="relative group py-1">
            В наличии
            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
          <Link href="/reviews" className="relative group py-1">
            Отзывы
            <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden lg:block shrink-0">
          <Link
            href="/order"
            className="font-display rounded-full bg-accent text-ink px-6 py-2.5 text-sm font-semibold hover:bg-accent2 transition-colors"
          >
            Сделать заказ
          </Link>
        </motion.div>

        <button
          type="button"
          aria-label="Меню"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden flex flex-col justify-center gap-1.5 w-10 h-10 shrink-0"
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-white rounded-full"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block h-0.5 w-6 bg-white rounded-full"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-white rounded-full"
          />
        </button>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-line bg-panel"
          >
            <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-1 font-display text-lg">
              {REGION_LIST.map((r) => (
                <Link
                  key={r.key}
                  href={`/order?region=${r.key}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 border-b border-line/60 text-white/80"
                >
                  <span className="text-xl">{r.flag}</span>
                  {r.name}
                </Link>
              ))}
              <Link
                href="/wardrobe"
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b border-line/60 text-accent"
              >
                Гардероб
              </Link>
              <Link
                href="/search"
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b border-line/60 text-white/80"
              >
                Найти вещь
              </Link>
              <Link
                href="/stock"
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b border-line/60 text-white/80"
              >
                В наличии
              </Link>
              <Link
                href="/reviews"
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b border-line/60 text-white/80"
              >
                Отзывы
              </Link>
              <Link
                href="/order"
                onClick={() => setMenuOpen(false)}
                className="mt-4 rounded-full bg-accent text-ink text-center py-3 font-semibold"
              >
                Сделать заказ
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden min-h-[94vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <motion.video
            className="w-full h-full object-cover opacity-60"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: "easeOut" }}
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.jpg"
          >
            <source src="/hero-bg-v2.mp4" type="video/mp4" />
          </motion.video>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/55 to-ink" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 text-center w-full">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight break-words"
            >
              Оригинальные бренды
              <br />
              <span className="text-white/50">со всего мира</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto"
            >
              Вставьте ссылку на товар из Японии, Европы, США, Китая или Кореи — покажем фото,
              посчитаем стоимость с доставкой и страховкой.
            </motion.p>
            <motion.div variants={fadeUp}>
              <motion.div
                className="mt-10 inline-block"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                <Link
                  href="/order"
                  className="font-display inline-block rounded-full bg-accent text-ink px-10 py-4 font-semibold text-lg hover:bg-accent2 transition-colors"
                >
                  Сделать заказ
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="border-y border-line overflow-hidden py-4 bg-panel/40">
        <div className="flex whitespace-nowrap animate-marquee font-display text-sm tracking-[0.3em] text-white/30 uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 pr-8">
              {["Fashion", "Sneakers", "Accessories", "Japan", "Europe", "USA", "China", "Korea"].map(
                (w) => (
                  <span key={w} className="flex items-center gap-8">
                    {w}
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </span>
                )
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <section className="py-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-2xl sm:text-4xl font-bold break-words mb-10"
          >
            Откуда заказываем
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {REGION_LIST.map((r) => (
              <motion.div
                key={r.key}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="h-full rounded-3xl bg-panel border border-line p-7 transition-colors hover:border-accent/50"
              >
                <Link href={`/order?region=${r.key}`} className="block group">
                  <div className="text-4xl grayscale">{r.flag}</div>
                  <div className="font-display mt-4 text-2xl font-semibold group-hover:text-accent transition-colors">
                    {r.name}
                  </div>
                  <p className="mt-2 text-sm text-white/50">{r.tagline}</p>
                </Link>
                <div className="mt-5 flex flex-wrap gap-2">
                  {r.platforms.map((p) => (
                    <a
                      key={p.name}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs rounded-full bg-white/5 px-3 py-1.5 text-white/60 hover:bg-accent hover:text-ink transition-colors"
                    >
                      {p.name}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="py-24 grid sm:grid-cols-3 gap-10 text-center"
        >
          {[
            ["01", "Вставляете ссылку на товар и ник в Telegram"],
            ["02", "Мы считаем стоимость с доставкой и страховкой"],
            ["03", "Пишем вам в Telegram и оформляем заказ"]
          ].map(([n, text]) => (
            <motion.div key={n} variants={fadeUp}>
              <div className="font-display text-5xl font-bold text-accent">{n}</div>
              <p className="mt-4 text-white/60 text-lg">{text}</p>
            </motion.div>
          ))}
        </motion.section>

        <section className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">
              Почему мы
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold break-words mt-3 max-w-xl">
              Мы несём ответственность за каждый заказ
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              [
                "Полная ответственность",
                "Ведём заказ лично от ссылки до посылки в ваших руках — и отвечаем за результат на каждом шаге."
              ],
              [
                "Год подготовки",
                "Прежде чем запуститься, мы месяцами выстраивали тарифы, склады и связи с площадками — чтобы у вас не было сюрпризов."
              ],
              [
                "Прямая связь",
                "Никаких ботов и очередей — вы напрямую на связи с человеком в Telegram."
              ],
              [
                "Страховка включена",
                "Каждая посылка застрахована уже в расчёте — риски на нас, а не на вас."
              ]
            ].map(([title, text]) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="rounded-3xl bg-panel border border-line p-6"
              >
                <div className="font-display text-lg font-semibold">{title}</div>
                <p className="mt-2.5 text-sm text-white/50">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/reviews"
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-accent text-ink px-7 py-5 hover:bg-accent2 transition-colors"
            >
              {reviews.count > 0 ? (
                <div className="flex items-center gap-4">
                  <span className="font-display text-3xl font-bold">{reviews.average.toFixed(1)}</span>
                  <div>
                    <div className="leading-none">
                      {"★".repeat(Math.round(reviews.average))}
                      <span className="opacity-30">
                        {"★".repeat(5 - Math.round(reviews.average))}
                      </span>
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {reviews.count} {plural(reviews.count, ["отзыв", "отзыва", "отзывов"])} от покупателей
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-display font-bold">★★★★★ Оставьте первый отзыв</div>
                  <div className="text-xs opacity-60 mt-1">Расскажите, как прошёл заказ</div>
                </div>
              )}
              <span className="font-display text-sm font-semibold shrink-0">Смотреть отзывы →</span>
            </Link>
          </motion.div>
        </section>

        <section className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between gap-6 flex-wrap"
          >
            <div>
              <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">
                YenWay Journal
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold break-words mt-3 max-w-xl">
                Следим за модой каждый день
              </h2>
              <p className="mt-3 text-white/50 max-w-xl">
                Показы, дропы и новости — но только те дома, что задают тон: Vetements, Balenciaga,
                Rick Owens и им подобные. Никакого масс-маркета.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5"
          >
            {JOURNAL_BANNERS.map((banner) => (
              <motion.div
                key={banner.brand}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl sm:rounded-3xl border border-line overflow-hidden aspect-square flex flex-col justify-end"
              >
                {banner.render}
                <div className="relative p-4 sm:p-5">
                  <div className="font-display text-base sm:text-lg font-bold leading-tight">
                    {banner.brand}
                  </div>
                  <p className="mt-1 text-xs text-white/50 leading-snug">{banner.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <footer className="py-10 text-center text-white/30 text-sm font-display space-y-2">
          <div>
            Связь:{" "}
            <a
              href={`https://t.me/${MANAGER_TELEGRAM}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-accent transition-colors"
            >
              @{MANAGER_TELEGRAM}
            </a>
          </div>
          <div className="text-xs text-white/20">
            CEO — David K. · Deputy CEO — Kirill K. · Head of Procurement — MK
          </div>
          <div>© {new Date().getFullYear()} YenWay</div>
        </footer>
      </div>
    </main>
  );
}
