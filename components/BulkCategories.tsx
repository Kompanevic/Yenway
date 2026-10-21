"use client";

import { useMemo, useState } from "react";
import type { Listing } from "@/lib/listings-store";
import { guessCategory, LISTING_CATEGORIES } from "@/lib/listing-constants";

const btn = "font-display text-sm rounded-xl px-3 py-1.5";

// Массовая разметка типов: выбрать тип → отметить вещи плиткой → применить.
// Плюс автоопределение по названию для вещей без типа.
export default function BulkCategories({ listings, onDone }: { listings: Listing[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [category, setCategory] = useState(LISTING_CATEGORIES[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const shown = useMemo(() => listings.filter((l) => !onlyEmpty || !l.category), [listings, onlyEmpty]);
  // Подсказки только для вещей без типа.
  const guesses = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of listings) {
      const g = !l.category ? guessCategory(l.title) : undefined;
      if (g) m.set(l.id, g);
    }
    return m;
  }, [listings]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const toApply = Array.from(guesses).filter(([id]) => !skipped.has(id));

  const untyped = listings.filter((l) => !l.category).length;

  async function send(ids: string[], cat: string) {
    const res = await fetch("/api/admin/stock/bulk-category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, category: cat })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Не удалось сохранить");
    return data.updated as number;
  }

  async function applySelected() {
    setBusy(true);
    setMessage(null);
    try {
      const n = await send(Array.from(selected), category);
      setMessage(`Готово: «${category}» — ${n} шт.`);
      setSelected(new Set());
      onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function applyGuesses() {
    setBusy(true);
    setMessage(null);
    try {
      const byCat = new Map<string, string[]>();
      for (const [id, c] of toApply) byCat.set(c, [...(byCat.get(c) ?? []), id]);
      let total = 0;
      for (const [c, ids] of Array.from(byCat)) total += await send(ids, c);
      setMessage(`Автоопределение применено: ${total} шт.`);
      setSkipped(new Set());
      onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (listings.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold">Разметить типы списком</h2>
          <p className="text-sm text-white/40 mt-1">Без типа: {untyped} из {listings.length}</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className={`${btn} border border-line hover:border-accent`}>
          {open ? "Свернуть" : "Открыть"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-6">
          {toApply.length > 0 && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/5 p-4">
              <div className="font-display text-sm font-semibold">Автоопределение по названию: {toApply.length} шт.</div>
              <p className="text-xs text-white/50 mt-1">Проверьте подсказки на плитках ниже (зелёная подпись). Неверную — нажмите на неё, чтобы пропустить.</p>
              <button onClick={applyGuesses} disabled={busy} className={`${btn} mt-3 btn-fx bg-accent text-ink font-semibold disabled:opacity-50`}>
                Применить подсказки ({toApply.length})
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl bg-ink border border-line px-3 py-2 text-sm">
              {LISTING_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button onClick={applySelected} disabled={busy || selected.size === 0} className={`${btn} btn-fx bg-accent text-ink font-semibold disabled:opacity-40`}>
              Отметить как «{category}» ({selected.size})
            </button>
            <button onClick={() => setSelected(new Set(shown.map((l) => l.id)))} className={`${btn} border border-line`}>
              Выбрать все показанные
            </button>
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className={`${btn} border border-line`}>
                Снять выделение
              </button>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm text-white/60">
              <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
              Только без типа
            </label>
          </div>

          {message && <p className="text-sm text-accent">{message}</p>}

          {shown.length === 0 ? (
            <p className="text-sm text-white/40">Все вещи размечены.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {shown.map((l) => {
                const on = selected.has(l.id);
                const guess = guesses.get(l.id);
                return (
                  <div key={l.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggle(l.id)}
                      className={`relative block w-full aspect-square rounded-xl overflow-hidden border-2 transition-colors ${on ? "border-accent" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/stock-photo/${l.id}/0`} alt="" loading="lazy" className={`w-full h-full object-cover ${on ? "opacity-70" : ""}`} />
                      {on && <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-accent text-ink text-sm leading-6 font-bold">✓</span>}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1 pt-4 text-[10px] leading-tight text-left line-clamp-2">
                        {l.title}
                      </span>
                    </button>
                    <div className="mt-1 text-[11px] leading-tight truncate">
                      {l.category ? (
                        <span className="text-white/50">{l.category}</span>
                      ) : guess ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSkipped((prev) => {
                              const next = new Set(prev);
                              if (next.has(l.id)) next.delete(l.id);
                              else next.add(l.id);
                              return next;
                            })
                          }
                          className={skipped.has(l.id) ? "text-white/30 line-through" : "text-emerald-300"}
                        >
                          → {guess}
                        </button>
                      ) : (
                        <span className="text-white/30">тип не выбран</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
