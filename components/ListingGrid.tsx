"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface GridItem {
  id: string;
  title: string;
  size: string;
  price: number;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export default function ListingGrid({ items, basePath, emptyText }: { items: GridItem[]; basePath: string; emptyText: string }) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return items;
    return items.filter((i) => {
      const title = norm(i.title);
      return words.every((w) => title.includes(w));
    });
  }, [items, query]);

  if (items.length === 0) {
    return <div className="mt-12 rounded-3xl bg-panel border border-line p-10 text-center text-white/50">{emptyText}</div>;
  }

  return (
    <>
      <div className="mt-10 relative max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
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

      {shown.length === 0 ? (
        <p className="mt-10 text-white/50">Ничего не нашлось по запросу «{query.trim()}».</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {shown.map((l) => (
            <Link key={l.id} href={`${basePath}/${l.id}`} className="group block">
              <div className="aspect-square rounded-2xl overflow-hidden border border-line bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/stock-photo/${l.id}/0`}
                  alt={l.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-2.5 font-display text-sm leading-snug line-clamp-2 break-words">
                {l.title}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 align-middle" />
                <span className="text-white/70 whitespace-nowrap">{l.size}</span>
              </div>
              <div className="mt-1 font-display text-sm font-semibold">{l.price.toLocaleString("ru-RU")} ₽</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
