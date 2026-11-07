"use client";

import { useEffect, useMemo, useState } from "react";
import { EXCHANGE_RATES } from "@/lib/pricing";
import { CLOTHING_SIZES, MERCARI_TYPES, SHOE_SIZES, SHOE_TYPES } from "@/lib/mercari-types";

type Item = { id: string; title: string; price: number; image: string | null; link: string; size: string | null };
type Group = { brand: string; type: string; keyword: string; items: Item[]; error?: string };

const STORE = "yenway:mercari-search";
const TYPES = Object.keys(MERCARI_TYPES);
const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";

// Потолок цены в иенах: доллары и рубли переводим по курсам из lib/pricing.
function toJPY(amount: number, cur: "JPY" | "USD" | "RUB"): number {
  const jpy = EXCHANGE_RATES.japan ?? 0.69;
  if (cur === "JPY") return amount;
  if (cur === "RUB") return amount / jpy;
  return (amount * (EXCHANGE_RATES.usa ?? 97)) / jpy;
}

// Подбор вещей для клиента: несколько брендов × несколько типов одним поиском.
export default function AdminMercariSearch() {
  const [brands, setBrands] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [cur, setCur] = useState<"JPY" | "USD" | "RUB">("USD");
  const [limit, setLimit] = useState(10);
  const [sizes, setSizes] = useState<string[]>([]);
  const [shoeSizes, setShoeSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  // Прошлый набор брендов и типов — чтобы не вбивать заново.
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (s) {
        setBrands(s.brands ?? "");
        setTypes(s.types ?? []);
        setPrice(s.price ?? "");
        setCur(s.cur ?? "USD");
        setSizes(s.sizes ?? []);
        setShoeSizes(s.shoeSizes ?? []);
      }
    } catch {
      // без сохранения
    }
  }, []);

  const brandList = useMemo(
    () => Array.from(new Set(brands.split(/[\n,;]+/).map((b) => b.trim()).filter(Boolean))),
    [brands]
  );
  const count = brandList.length * Math.max(1, types.length);
  // Размеры одежды — если ищем одежду или «любые»; обуви — если отмечена обувь.
  const showClothing = types.length === 0 || types.some((t) => !SHOE_TYPES.includes(t));
  const showShoes = types.some((t) => SHOE_TYPES.includes(t));
  const maxJPY = Number(price) > 0 ? Math.round(toJPY(Number(price), cur)) : null;

  async function run() {
    setError(null);
    setLoading(true);
    setPicked(new Set());
    try {
      localStorage.setItem(STORE, JSON.stringify({ brands, types, price, cur, sizes, shoeSizes }));
    } catch {
      // без сохранения
    }
    try {
      const res = await fetch("/api/admin/mercari-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brands: brandList,
          types,
          maxPriceJPY: maxJPY,
          limit,
          sizes: showClothing ? sizes : [],
          shoeSizes: showShoes ? shoeSizes : []
        })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Поиск не удался");
      setGroups(d.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const all = groups?.flatMap((g) => g.items) ?? [];
  function copy(items: Item[], what: string) {
    const text = items.map((i) => `${i.title} — ¥${i.price.toLocaleString("ru-RU")}\n${i.link}`).join("\n\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    });
  }
  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="mt-10 rounded-3xl bg-panel border border-line p-5 sm:p-6">
      <h2 className="font-display font-semibold mb-1">Поиск по Mercari</h2>
      <p className="text-sm text-white/40 mb-5">Бренды × типы вещей одним поиском: свежие объявления в продаже, не дороже указанной цены.</p>

      <div className="space-y-5">
        <div>
          <label className={label}>Бренды — каждый с новой строки или через запятую</label>
          <textarea value={brands} onChange={(e) => setBrands(e.target.value)} rows={4} placeholder={"Rick Owens\nJulius\nUndercover"} className={field} />
        </div>

        <div>
          <label className={label}>Типы вещей {types.length === 0 && <span className="normal-case tracking-normal text-white/30">(не выбрано — любые)</span>}</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                className={`rounded-full border px-3.5 py-1.5 font-display text-xs sm:text-sm transition-colors ${
                  types.includes(t) ? "bg-accent text-ink border-accent font-semibold" : "border-line text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {showClothing && <SizeChips label="Размер одежды" options={CLOTHING_SIZES} value={sizes} onChange={setSizes} />}
        {showShoes && <SizeChips label="Размер обуви, см" options={SHOE_SIZES} value={shoeSizes} onChange={setShoeSizes} />}

        <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
          <div>
            <label className={label}>Цена до</label>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="100" className={field} />
          </div>
          <select value={cur} onChange={(e) => setCur(e.target.value as typeof cur)} className={`${field} w-auto`}>
            <option value="USD">$</option>
            <option value="JPY">¥</option>
            <option value="RUB">₽</option>
          </select>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={`${field} w-auto`} aria-label="Сколько вещей на запрос">
            {[5, 10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                по {n}
              </option>
            ))}
            <option value={0}>все</option>
          </select>
        </div>
        {maxJPY && cur !== "JPY" && <p className="-mt-3 text-xs text-white/40">≈ до ¥{maxJPY.toLocaleString("ru-RU")}</p>}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={run}
          disabled={loading || brandList.length === 0 || count > 40}
          className="w-full font-display rounded-full btn-fx bg-accent text-ink py-3.5 font-semibold disabled:opacity-50"
        >
          {loading ? "Ищем…" : count > 40 ? `Слишком много сочетаний: ${count} (максимум 40)` : `Найти (${count} ${count === 1 ? "запрос" : "запросов"})`}
        </button>
      </div>

      {groups && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-white/50 mr-auto">Найдено: {all.length}</span>
            {picked.size > 0 && (
              <button type="button" onClick={() => copy(all.filter((i) => picked.has(i.id)), "picked")} className="rounded-full bg-accent text-ink px-4 py-2 font-display text-sm font-semibold">
                {copied === "picked" ? "Скопировано ✓" : `Скопировать выбранные (${picked.size})`}
              </button>
            )}
            {all.length > 0 && (
              <button type="button" onClick={() => copy(all, "all")} className="rounded-full border border-line px-4 py-2 font-display text-sm hover:border-accent">
                {copied === "all" ? "Скопировано ✓" : "Скопировать все"}
              </button>
            )}
          </div>
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.keyword}>
                <h3 className="font-display text-sm font-semibold mb-3">
                  {g.brand} · {g.type} <span className="text-white/40 font-normal">({g.items.length})</span>
                  <a
                    href={`https://jp.mercari.com/search?keyword=${encodeURIComponent(g.keyword)}&status=on_sale${maxJPY ? `&price_max=${maxJPY}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs font-normal text-white/40 underline underline-offset-2 hover:text-white"
                  >
                    открыть на Mercari
                  </a>
                </h3>
                {g.error ? (
                  <p className="text-sm text-red-400">{g.error}</p>
                ) : g.items.length === 0 ? (
                  <p className="text-sm text-white/40">Ничего не нашлось.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {g.items.map((i) => (
                      <div key={i.id} className={`rounded-2xl border p-2 transition-colors ${picked.has(i.id) ? "border-accent" : "border-line"}`}>
                        <a href={i.link} target="_blank" rel="noopener noreferrer" className="block">
                          {i.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={i.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full aspect-square rounded-xl object-cover bg-white/5" />
                          ) : (
                            <div className="w-full aspect-square rounded-xl bg-white/5" />
                          )}
                          <div className="mt-2 text-xs leading-snug line-clamp-2">{i.title}</div>
                          {i.size && <div className="mt-1 text-[11px] text-white/50">Размер: {i.size}</div>}
                        </a>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-semibold">
                            ¥{i.price.toLocaleString("ru-RU")}
                            <span className="block text-[11px] font-normal text-white/40">≈{Math.round(i.price * (EXCHANGE_RATES.japan ?? 0.69)).toLocaleString("ru-RU")} ₽</span>
                          </span>
                          <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} aria-label="Выбрать" className="accent-[#e9e6df] w-4 h-4 shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// Несколько размеров сразу; ничего не выбрано — любой. Свободный размер (FREE) подходит всегда.
function SizeChips({ label: title, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className={label}>
        {title} <span className="normal-case tracking-normal text-white/30">{value.length ? "(FREE подходит всегда)" : "(не выбрано — любой)"}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}
            className={`min-w-11 rounded-full border px-3 py-1.5 font-display text-xs sm:text-sm transition-colors ${
              value.includes(o) ? "bg-accent text-ink border-accent font-semibold" : "border-line text-white/60 hover:text-white"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
