"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { compareSizes, isOneSize, LISTING_CATEGORIES, LISTING_CONDITIONS, sizeKey } from "@/lib/listing-constants";
import Flag from "./Flag";
import Reveal from "./Reveal";
import FadeImg from "./FadeImg";
import { EyeIcon, HeartIcon } from "./Icons";
import type { RegionKey } from "@/lib/regions";

export interface GridItem {
  id: string;
  title: string;
  size: string;
  price: number;
  photoCount: number;
  region?: RegionKey;
  category?: string;
  condition?: string;
  views?: number;
  likes?: number;
}

function Chips({ label, options, value, onChange, allLabel = "Все" }: { label?: string; options: string[]; value: string | null; onChange: (v: string | null) => void; allLabel?: string }) {
  return (
    <div>
      {label && <div className="font-display text-[11px] uppercase tracking-wide text-white/40 mb-2">{label}</div>}
      <div className="flex flex-wrap gap-2">
      {[null, ...options].map((o) => (
        <button
          key={o ?? "all"}
          type="button"
          onClick={() => onChange(o)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 font-display text-xs sm:text-sm transition-colors ${
            value === o ? "bg-accent text-ink border-accent font-semibold" : "border-line text-white/60 hover:text-white hover:border-white/30"
          }`}
        >
          {o ?? allLabel}
        </button>
      ))}
      </div>
    </div>
  );
}

// При наведении — плавно второе фото вещи (грузится только по первому наведению).
function CardPhoto({ item }: { item: GridItem }) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const zoom = "transition-transform duration-700 ease-out group-hover:scale-[1.06]";
  return (
    <div className="absolute inset-0" onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}>
      <FadeImg src={`/api/stock-photo/${item.id}/0`} alt={item.title} loading="lazy" className={`w-full h-full object-cover ${zoom}`} />
      {hovered && item.photoCount > 1 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/stock-photo/${item.id}/1`}
          alt=""
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.06] ${loaded ? "group-hover:opacity-100" : ""}`}
        />
      )}
    </div>
  );
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export default function ListingGrid({
  items,
  basePath,
  emptyText,
  badge,
  pricePrefix = ""
}: {
  items: GridItem[];
  basePath: string;
  emptyText: string;
  // Метка на каждой карточке (например, «Выкуплено») и подпись перед ценой.
  badge?: string;
  pricePrefix?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  // Все типы вещей — всегда, даже если таких сейчас нет в ленте.
  const categories = LISTING_CATEGORIES;

  // 2-й уровень: размеры — только внутри выбранного типа (обувь и одежда
  // меряются по-разному); OS/free size подходят под любой размер.
  const [size, setSize] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sizes = useMemo(() => {
    if (!category) return [];
    const set = new Set<string>();
    for (const i of items) if (i.category === category && !isOneSize(i.size)) set.add(sizeKey(i.size));
    return Array.from(set).sort(compareSizes);
  }, [items, category]);
  const conditions = useMemo(
    () => LISTING_CONDITIONS.filter((c) => items.some((i) => i.condition === c && (!category || i.category === category))),
    [items, category]
  );

  const hasFilters = categories.length > 0 || conditions.length > 1;
  const active = [category, condition, size].filter((x): x is string => !!x);
  function resetFilters() {
    setCategory(null);
    setSize(null);
    setCondition(null);
  }

  const shown = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      if (category && i.category !== category) return false;
      if (size && !isOneSize(i.size) && sizeKey(i.size) !== size) return false;
      if (condition && i.condition !== condition) return false;
      const title = norm(i.title);
      return words.every((w) => title.includes(w));
    });
  }, [items, query, category, size, condition]);

  if (items.length === 0) {
    return <div className="mt-12 rounded-3xl bg-panel border border-line p-10 text-center text-white/50">{emptyText}</div>;
  }

  return (
    <>
      <div className="mt-10 flex gap-2 max-w-xl">
      <div className="relative flex-1">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск"
          aria-label="Поиск по названию"
          className="w-full rounded-full bg-panel border border-line pl-11 pr-11 py-3 outline-none focus:border-accent transition-colors [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Очистить поиск"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ×
          </button>
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          className={`shrink-0 flex items-center gap-2 rounded-full border px-4 sm:px-5 font-display text-sm transition-colors ${
            filtersOpen || active.length ? "border-accent text-white" : "border-line text-white/70 hover:text-white hover:border-white/30"
          }`}
        >
          <span aria-hidden className="text-lg leading-none tracking-tighter">⋯</span>
          Фильтры
          {active.length > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-ink text-xs font-semibold leading-5 text-center">{active.length}</span>
          )}
        </button>
      )}
      </div>

      {/* Выбранные фильтры — короткой строкой, когда панель закрыта */}
      {!filtersOpen && active.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
          <span>{active.join(" · ")}</span>
          <button type="button" onClick={resetFilters} className="text-white/40 hover:text-white" aria-label="Сбросить фильтры">
            ✕
          </button>
        </div>
      )}

      {filtersOpen && (
        <div className="mt-4 max-w-xl rounded-3xl bg-panel border border-line p-5 space-y-5">
          {categories.length > 0 && (
            <Chips
              label="Тип вещи"
              options={categories}
              value={category}
              onChange={(c) => {
                setCategory(c);
                setSize(null);
              }}
            />
          )}
          {conditions.length > 1 && <Chips label="Состояние" options={conditions} value={condition} onChange={setCondition} allLabel="Любое" />}
          {category ? (
            sizes.length > 0 && <Chips label="Размер" options={sizes} value={size} onChange={setSize} allLabel="Любой" />
          ) : (
            <p className="text-xs text-white/40">Выберите тип вещи, чтобы выбрать размер.</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={resetFilters} className="text-sm text-white/50 hover:text-white">
              Сбросить
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="font-display rounded-full btn-fx bg-accent text-ink px-5 py-2 text-sm font-semibold hover:bg-accent2"
            >
              Показать {shown.length}
            </button>
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-10 text-white/50">{query.trim() ? `Ничего не нашлось по запросу «${query.trim()}».` : "По этим фильтрам ничего нет."}</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {shown.map((l, i) => (
            <Reveal key={l.id} index={i}>
            <Link href={`${basePath}/${l.id}`} className="group block">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-line bg-panel transition-[border-color,box-shadow] duration-300 group-hover:border-white/30 group-hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.18)]">
                {badge && (
                  <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-emerald-400 text-ink px-2.5 py-0.5 font-display text-[10px] sm:text-xs font-bold">
                    ✓ {badge}
                  </span>
                )}
                {l.region && (
                  <Flag region={l.region} className="absolute top-2.5 left-2.5 z-10 w-7 h-[18.67px] rounded-[3px] shadow-md ring-1 ring-black/20" />
                )}
                <CardPhoto item={l} />
              </div>
              <div className="mt-2.5 font-display text-sm leading-snug line-clamp-2 break-words">
                {l.title}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 align-middle" />
                <span className="text-white/70 whitespace-nowrap">{l.size}</span>
              </div>
              <div className="mt-1 font-display text-sm font-semibold">
                {pricePrefix}
                {l.price.toLocaleString("ru-RU")} ₽
              </div>
              {(l.views || l.likes) ? (
                <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
                  <span className="flex items-center gap-1"><EyeIcon className="w-3.5 h-3.5" />{l.views ?? 0}</span>
                  {l.likes ? <span className="flex items-center gap-1"><HeartIcon className="w-3.5 h-3.5" />{l.likes}</span> : null}
                </div>
              ) : null}
            </Link>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
