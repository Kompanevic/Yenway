"use client";

import Link from "next/link";
import { useList } from "@/lib/tg-webapp";
import { ItemRow, usePublicItems } from "@/components/ListingPreviewList";

export default function FavoritesPage() {
  const fav = useList("favorites");
  const items = usePublicItems(fav.ids, fav.ready);
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-28">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Избранное</h1>
      <div className="mt-8 space-y-2">
        {items === null ? (
          <div className="h-20 rounded-2xl shimmer" />
        ) : items.length === 0 ? (
          <p className="text-white/50">
            Пока пусто. Добавляйте вещи кнопкой «В избранное» — <Link href="/preorder" className="underline">в ленту</Link>.
          </p>
        ) : (
          items.map((i) => <ItemRow key={i.id} item={i} onRemove={() => fav.remove(i.id)} removeLabel="Убрать из избранного" />)
        )}
      </div>
    </main>
  );
}
