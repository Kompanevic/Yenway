"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface PublicItem {
  id: string;
  title: string;
  size: string;
  price: number;
  href: string;
  unavailable: boolean;
}

// Карточки вещей по списку id (избранное, корзина).
export function usePublicItems(ids: string[], ready: boolean) {
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setItems([]);
      return;
    }
    fetch(`/api/listings/public?ids=${key}`)
      .then((r) => r.json())
      .then((d) => {
        const byId = new Map((d.items ?? []).map((i: PublicItem) => [i.id, i]));
        setItems(key.split(",").map((id) => byId.get(id)).filter((x): x is PublicItem => !!x));
      })
      .catch(() => setItems([]));
  }, [key, ready]);
  return items;
}

export function ItemRow({ item, onRemove, removeLabel }: { item: PublicItem; onRemove: () => void; removeLabel: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel/80 p-2.5">
      <Link href={item.href} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/stock-photo/${item.id}/0`} alt="" className={`w-16 h-16 rounded-xl object-cover ${item.unavailable ? "opacity-40" : ""}`} />
      </Link>
      <Link href={item.href} className="min-w-0 flex-1">
        <div className="font-display text-sm font-semibold truncate">{item.title}</div>
        <div className="text-xs text-white/50 mt-0.5">
          {item.size} · {item.unavailable ? "недоступна" : `${item.price.toLocaleString("ru-RU")} ₽`}
        </div>
      </Link>
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="shrink-0 w-9 h-9 rounded-full text-white/40 hover:text-white hover:bg-white/10">
        ×
      </button>
    </div>
  );
}
