"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Flag from "./Flag";
import type { RegionKey } from "@/lib/regions";

interface BoughtItem {
  id: string;
  title: string;
  region?: RegionKey;
}

// Лента «Уже выкупили» на главной: одна строка фото, медленно плывёт,
// на наведении замирает. Заметно, но не мешает. Пустая — не показывается.
export default function BoughtStrip() {
  const [items, setItems] = useState<BoughtItem[]>([]);
  useEffect(() => {
    fetch("/api/bought")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;
  // Повторяем, чтобы лента была длиннее экрана, и удваиваем для бесшовного круга.
  const half = Array.from({ length: Math.ceil(8 / items.length) }, () => items).flat();
  const track = [...half, ...half];

  return (
    <section className="pt-14 sm:pt-16">
      <div className="max-w-7xl mx-auto px-6 flex items-end justify-between gap-4">
        <div>
          <div className="font-display text-xs uppercase tracking-[0.3em] text-emerald-300">✓ Уже выкупили</div>
          <h2 className="font-display text-lg sm:text-2xl font-bold mt-2">Вещи, которые мы привезли клиентам</h2>
        </div>
        <Link href="/bought" className="shrink-0 font-display text-sm font-semibold text-white/70 hover:text-white transition-colors">
          Смотреть все →
        </Link>
      </div>

      <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div
          className="flex w-max gap-3 animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: `${half.length * 4}s` }}
        >
          {track.map((it, i) => (
            <Link
              key={`${it.id}-${i}`}
              href={`/bought/${it.id}`}
              aria-hidden={i >= half.length}
              tabIndex={i >= half.length ? -1 : undefined}
              className="group relative block w-32 sm:w-44 aspect-square shrink-0 rounded-2xl overflow-hidden border border-line bg-panel"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/stock-photo/${it.id}/0`}
                alt={it.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              {it.region && (
                <Flag region={it.region} className="absolute top-2 left-2 w-6 h-4 rounded-[2px] shadow ring-1 ring-black/20" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-6 font-display text-[11px] sm:text-xs leading-tight line-clamp-2">
                {it.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
