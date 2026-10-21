"use client";

import { useEffect, useState } from "react";
import { BagIcon, BookmarkIcon, EyeIcon, HeartIcon } from "./Icons";
import { tgInitHeaders, useList, useMiniApp } from "@/lib/tg-webapp";

// Под ценой вещи: просмотры, лайк, избранное и корзина.
export default function ListingActions({ id, canBuy }: { id: string; canBuy: boolean }) {
  const miniApp = useMiniApp();
  const fav = useList("favorites");
  const cart = useList("cart");
  const [stats, setStats] = useState({ views: 0, likes: 0, liked: false });
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    // Просмотр — один раз за сессию на вещь.
    try {
      const key = `yenway:viewed:${id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        fetch(`/api/listings/${id}/view`, { method: "POST" }).catch(() => {});
      }
    } catch {
      // без учёта
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/listings/${id}/stats`, { headers: tgInitHeaders() })
      .then((r) => r.json())
      .then((d) => setStats({ views: d.views ?? 0, likes: d.likes ?? 0, liked: !!d.liked }))
      .catch(() => {});
  }, [id, miniApp]);

  async function like() {
    if (!miniApp) {
      setHint("Лайки — в приложении YenWay в Telegram");
      return;
    }
    setStats((s) => ({ ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) }));
    const r = await fetch(`/api/listings/${id}/like`, { method: "POST", headers: tgInitHeaders() });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setStats((s) => ({ ...s, liked: d.liked, likes: d.likes }));
  }

  const chip = "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors";
  const off = "border-line text-white/70 hover:text-white hover:border-white/30";
  const on = "border-white/60 text-white bg-white/10";

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={like} className={`${chip} ${stats.liked ? on : off}`} aria-pressed={stats.liked}>
          <HeartIcon className="w-4 h-4" filled={stats.liked} />
          {stats.likes}
        </button>
        <button type="button" onClick={() => fav.toggle(id)} className={`${chip} ${fav.has(id) ? on : off}`} aria-pressed={fav.has(id)}>
          <BookmarkIcon className="w-4 h-4" filled={fav.has(id)} />
          {fav.has(id) ? "В избранном" : "В избранное"}
        </button>
        {canBuy && (
          <button type="button" onClick={() => cart.toggle(id)} className={`${chip} ${cart.has(id) ? on : off}`} aria-pressed={cart.has(id)}>
            <BagIcon className="w-4 h-4" filled={cart.has(id)} />
            {cart.has(id) ? "В корзине" : "В корзину"}
          </button>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-sm text-white/40">
          <EyeIcon className="w-4 h-4" />
          {stats.views}
        </span>
      </div>
      {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
    </div>
  );
}
