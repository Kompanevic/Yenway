"use client";

import { useEffect, useState } from "react";
import ListingForm from "./ListingForm";
import type { Listing, ListingStatus } from "@/lib/listings-store";

const btn = "font-display text-sm rounded-xl px-3 py-1.5";
const btnMain = `${btn} bg-accent text-ink font-semibold hover:bg-accent2`;
const btnGhost = `${btn} border border-line hover:border-red-400 hover:text-red-400`;

export default function AdminStock() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/stock");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setListings(data.listings ?? []);
    else setError(data.error ?? "Не удалось загрузить объявления");
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, method: "PATCH" | "DELETE", status?: ListingStatus) {
    if (method === "DELETE" && !confirm("Удалить объявление вместе с фото?")) return;
    const res = await fetch(`/api/admin/stock/${id}`, {
      method,
      headers: status ? { "Content-Type": "application/json" } : undefined,
      body: status ? JSON.stringify({ status }) : undefined
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Действие не выполнено");
      return;
    }
    setError(null);
    load();
  }

  const groups: { title: string; status: ListingStatus }[] = [
    { title: "На модерации", status: "pending" },
    { title: "В ленте", status: "published" },
    { title: "Проданные", status: "sold" }
  ];

  return (
    <div>
      <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
        <h2 className="font-display font-semibold mb-1">Выложить свою вещь</h2>
        <p className="text-sm text-white/40 mb-5">Публикуется сразу, пост для канала придёт в бота объявлений.</p>
        <ListingForm own onDone={load} />
      </section>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

      {groups.map((g) => {
        const items = listings.filter((l) => l.status === g.status);
        return (
          <section key={g.status} className="mt-10">
            <h2 className="font-display font-semibold mb-4">
              {g.title} ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="text-white/40 text-sm">Пусто.</p>
            ) : (
              <div className="space-y-3">
                {items.map((l) => (
                  <div key={l.id} className="rounded-2xl bg-panel border border-line p-3 flex gap-3 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/stock-photo/${l.id}/0`} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a href={`/stock/${l.id}`} target="_blank" className="font-display font-semibold truncate block hover:text-accent">
                        {l.title} • {l.size}
                      </a>
                      <div className="text-sm text-white/50">
                        {l.price.toLocaleString("ru-RU")} ₽ · {l.condition} · {l.own ? "ваша вещь" : `@${l.seller}`} · {l.photoCount} фото
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 shrink-0">
                      {l.status === "pending" && (
                        <button onClick={() => act(l.id, "PATCH", "published")} className={btnMain}>
                          Опубликовать
                        </button>
                      )}
                      {l.status === "published" && (
                        <button onClick={() => act(l.id, "PATCH", "sold")} className={btnMain}>
                          Продано
                        </button>
                      )}
                      {l.status === "sold" && (
                        <button onClick={() => act(l.id, "PATCH", "published")} className={`${btn} border border-line hover:border-accent`}>
                          Вернуть
                        </button>
                      )}
                      <button onClick={() => act(l.id, "DELETE")} className={btnGhost}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
