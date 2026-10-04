"use client";

import { useEffect, useState } from "react";
import ListingForm from "./ListingForm";
import type { Listing, ListingStatus } from "@/lib/listings-store";
import { kindOf, LISTING_PATH, type ListingKind } from "@/lib/listing-constants";

const btn = "font-display text-sm rounded-xl px-3 py-1.5";
const btnMain = `${btn} btn-fx bg-accent text-ink font-semibold hover:bg-accent2`;
const btnGhost = `${btn} border border-line hover:border-red-400 hover:text-red-400`;

const HEADINGS: Record<ListingKind, { title: string; note: string }> = {
  stock: { title: "Выложить свою вещь", note: "Публикуется сразу, пост для канала придёт в бота объявлений." },
  preorder: { title: "Выложить вещь под заказ", note: "Публикуется сразу, пост уходит в канал и в бота карточек." },
  bought: { title: "Добавить выкупленную вещь", note: "Появится в разделе «Выкупленные» на сайте. В боты и канал не отправляется." }
};

export default function AdminStock({ kind }: { kind: ListingKind }) {
  const preorder = kind === "preorder";
  const bought = kind === "bought";
  const [all, setAll] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const listings = all.filter((l) => kindOf(l) === kind);
  // Для «Выкупленных»: вещи из «Под заказ», которые можно отметить выкупленными.
  const preorders = bought
    ? all.filter((l) => kindOf(l) === "preorder").sort((a, b) => Number(a.status !== "published") - Number(b.status !== "published"))
    : [];

  async function load() {
    const res = await fetch("/api/admin/stock");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setAll(data.listings ?? []);
    else setError(data.error ?? "Не удалось загрузить объявления");
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, method: "PATCH" | "DELETE", status?: ListingStatus, moveTo?: "bought" | "preorder") {
    if (method === "DELETE" && !confirm("Удалить объявление вместе с фото?")) return;
    if (moveTo === "bought" && !confirm("Отметить вещь выкупленной? Она уйдёт из «Под заказ» в «Выкупленные».")) return;
    const payload = moveTo ? { kind: moveTo } : status ? { status } : null;
    const res = await fetch(`/api/admin/stock/${id}`, {
      method,
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Действие не выполнено");
      return;
    }
    setError(null);
    load();
  }

  const groups: { title: string; status: ListingStatus }[] = bought
    ? [
        { title: "В разделе «Выкупленные»", status: "published" },
        { title: "Скрытые", status: "sold" }
      ]
    : preorder
    ? [
        { title: "В ленте", status: "published" },
        { title: "Снятые", status: "sold" }
      ]
    : [
        { title: "На модерации", status: "pending" },
        { title: "В ленте", status: "published" },
        { title: "Проданные", status: "sold" }
      ];

  return (
    <div>
      {bought && (
        <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
          <h2 className="font-display font-semibold mb-1">Отметить вещь из «Под заказ»</h2>
          <p className="text-sm text-white/40 mb-5">Нажмите «Выкуплено» — вещь уйдёт из «Под заказ» и сразу появится в «Выкупленных».</p>
          {preorders.length === 0 ? (
            <p className="text-white/40 text-sm">В «Под заказ» нет вещей.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {preorders.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/stock-photo/${l.id}/0`} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-semibold truncate">
                      {l.title} • {l.size}
                    </div>
                    <div className="text-xs text-white/40">
                      {l.price.toLocaleString("ru-RU")} ₽{l.status !== "published" ? " · снята с ленты" : ""}
                    </div>
                  </div>
                  <button onClick={() => act(l.id, "PATCH", undefined, "bought")} className={`${btnMain} shrink-0`}>
                    Выкуплено →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
        <h2 className="font-display font-semibold mb-1">{HEADINGS[kind].title}</h2>
        <p className="text-sm text-white/40 mb-5">{HEADINGS[kind].note}</p>
        <ListingForm own kind={kind} onDone={load} />
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
                      <a href={`${LISTING_PATH[kind]}/${l.id}`} target="_blank" className="font-display font-semibold truncate block hover:text-accent">
                        {l.title} • {l.size}
                      </a>
                      <div className="text-sm text-white/50">
                        {l.price.toLocaleString("ru-RU")} ₽ · {l.condition} · {l.own ? "ваша вещь" : `@${l.seller}`} · {l.photoCount} фото
                      </div>
                      {l.sourceUrl && (
                        <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-white/40 underline underline-offset-2 hover:text-white/70">
                          {l.sourceUrl}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 shrink-0">
                      {l.status === "pending" && (
                        <button onClick={() => act(l.id, "PATCH", "published")} className={btnMain}>
                          Опубликовать
                        </button>
                      )}
                      {l.status === "published" && (
                        <button onClick={() => act(l.id, "PATCH", "sold")} className={btnMain}>
                          {bought ? "Скрыть" : preorder ? "Снять" : "Продано"}
                        </button>
                      )}
                      {bought && (
                        <button onClick={() => act(l.id, "PATCH", undefined, "preorder")} className={`${btn} border border-line hover:border-accent`}>
                          В «Под заказ»
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
