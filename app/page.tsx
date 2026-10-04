"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { REGION_LIST } from "@/lib/regions";
import { MANAGER_TELEGRAM } from "@/lib/pricing";
import Flag from "@/components/Flag";
import BoughtStrip from "@/components/BoughtStrip";
import { plural } from "@/lib/plural";
import type { RegionKey } from "@/lib/regions";

interface LatestItem {
  id: string;
  title: string;
  size: string;
  price: number;
  region?: RegionKey;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }
};

// Заголовок проявляется по словам: из размытия и снизу.
const words = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const word = {
  hidden: { opacity: 0, y: 30, filter: "blur(12px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } }
};
const Words = ({ text }: { text: string }) => (
  <>
    {text.split(" ").map((w, i) => (
      <span key={i}>
        {i > 0 && " "}
        <motion.span variants={word} className="inline-block">
          {w}
        </motion.span>
      </span>
    ))}
  </>
);

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

export default function Home() {
  // Параллакс: видео уходит медленнее страницы, текст — чуть быстрее и гаснет.
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const [reviews, setReviews] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

  // Последние 6 вещей «под заказ» — обновляются вместе с лентой.
  const [latest, setLatest] = useState<LatestItem[]>([]);
  useEffect(() => {
    fetch("/api/preorder")
      .then((res) => res.json())
      .then((data) => setLatest(data.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews({ average: data.average ?? 0, count: data.count ?? 0 }))
      .catch(() => {});
  }, []);

  return (
    <main>
      <section ref={heroRef} className="relative overflow-hidden min-h-[94vh] flex items-center">
        <motion.div className="absolute inset-0 -z-10" style={reduceMotion ? undefined : { y: videoY }}>
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
        </motion.div>

        <motion.div
          className="max-w-7xl mx-auto px-6 py-16 text-center w-full"
          style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.h1
              variants={words}
              className="font-display text-4xl sm:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight break-words"
            >
              <Words text="Оригинальные бренды" />
              <br />
              <span className="text-white/50">
                <Words text="со всего мира" />
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-8 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto"
            >
              Вставьте ссылку на товар из Японии, Европы, США, Китая или Кореи — покажем фото,
              посчитаем стоимость с доставкой и страховкой.
            </motion.p>
            <motion.div variants={fadeUp}>
              <div className="mt-10 inline-block">
                <Link
                  href="/order"
                  className="font-display inline-block rounded-full btn-fx bg-accent text-ink px-10 py-4 font-semibold text-lg hover:bg-accent2 transition-colors"
                >
                  Сделать заказ
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
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

      <BoughtStrip />

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
                className="group relative isolate overflow-hidden h-full rounded-3xl bg-panel border border-line p-7 transition-colors hover:border-accent/50"
              >
                {/* При наведении фон карточки — сильно размытый флаг страны */}
                <Flag
                  region={r.key}
                  cover
                  className="pointer-events-none absolute inset-0 -z-10 w-full h-full scale-150 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                />
                <Link href={`/order?region=${r.key}`} className="block">
                  <Flag region={r.key} className="w-[1.35em] h-[0.9em] rounded-[2px] shrink-0 text-4xl grayscale group-hover:grayscale-0 transition-[filter] duration-500" />
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

        {latest.length > 0 && (
          <section className="py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="flex items-end justify-between gap-6 flex-wrap"
            >
              <div>
                <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">Под заказ</div>
                <h2 className="font-display text-2xl sm:text-4xl font-bold break-words mt-3 max-w-xl">
                  Свежие поступления
                </h2>
                <p className="mt-3 text-white/50 max-w-xl">
                  Последние вещи, которые можно заказать. Цена указана под ключ — с доставкой и страховкой.
                </p>
              </div>
              <Link href="/preorder" className="font-display text-sm font-semibold text-white/70 hover:text-white transition-colors">
                Смотреть все →
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5"
            >
              {latest.map((item) => (
                <motion.div key={item.id} variants={fadeUp}>
                  <Link href={`/preorder/${item.id}`} className="group block">
                    <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border border-line bg-panel transition-[border-color,box-shadow] duration-300 group-hover:border-white/30 group-hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.18)]">
                      {item.region && (
                        <Flag region={item.region} className="absolute top-2.5 left-2.5 z-10 w-7 h-[18.67px] rounded-[3px] shadow-md ring-1 ring-black/20" />
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/stock-photo/${item.id}/0`}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />
                    </div>
                    <div className="mt-2.5 font-display text-sm leading-snug line-clamp-2 break-words">
                      {item.title}
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 align-middle" />
                      <span className="text-white/70 whitespace-nowrap">{item.size}</span>
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold">{item.price.toLocaleString("ru-RU")} ₽</div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

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
