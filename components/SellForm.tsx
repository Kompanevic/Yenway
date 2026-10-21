"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downscaleImage } from "@/lib/image";
import type { ItemInfo } from "@/lib/item-info";
import { guessCategory, LISTING_CATEGORIES, LISTING_CONDITIONS, MAX_LISTING_PHOTOS } from "@/lib/listing-constants";
import { CHINA_DELIVERY_TIERS, CURRENCY_REGION, calculatePrice } from "@/lib/pricing";
import { REGIONS, type RegionKey } from "@/lib/regions";
import { tgInitHeaders } from "@/lib/tg-webapp";
import { mapCondition } from "./ListingForm";

const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";
const SELL_REGIONS: RegionKey[] = ["japan", "china", "korea"];

// Продавец выкладывает вещь «под заказ» по ссылке: мы выкупаем её по цене
// площадки, а разница между ценой продавца и выкупом под ключ — его заработок.
export default function SellForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState<RegionKey>("japan");
  const [localPrice, setLocalPrice] = useState("");
  const [weight, setWeight] = useState("1");
  const [chinaTier, setChinaTier] = useState(CHINA_DELIVERY_TIERS[0].id);
  const [price, setPrice] = useState("");
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const num = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const base = useMemo(() => {
    const lp = num(localPrice);
    return lp == null ? null : calculatePrice(lp, region, url, num(weight), chinaTier).totalRUB;
  }, [localPrice, region, url, weight, chinaTier]);
  const earning = base != null && num(price) != null ? Math.round(num(price)! - base) : null;

  async function fill(link: string) {
    if (!/^https?:\/\/\S+$/.test(link)) return;
    setNote(null);
    setStatus("Смотрим страницу вещи…");
    try {
      const res = await fetch("/api/miniapp/item-info", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tgInitHeaders() },
        body: JSON.stringify({ url: link })
      });
      const info = (await res.json()) as ItemInfo & { error?: string };
      if (!res.ok) throw new Error(info.error ?? "Не удалось получить данные");
      if (info.title) {
        setTitle(info.title.slice(0, 120));
        setCategory(guessCategory(info.title) ?? "");
      }
      if (info.size) setSize(info.size.slice(0, 20));
      const cond = mapCondition(info.condition);
      if (cond) setCondition(cond);
      if (info.currency && SELL_REGIONS.includes(CURRENCY_REGION[info.currency])) setRegion(CURRENCY_REGION[info.currency]);
      if (info.price) setLocalPrice(String(info.price));
      setPageImage(info.image);
      if (!info.title && !info.image) setNote("Площадка не отдала данные — заполните поля вручную.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setStatus(null);
    }
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const picked = await Promise.all(
      Array.from(files)
        .slice(0, MAX_LISTING_PHOTOS)
        .map(async (f) => {
          const file = await downscaleImage(f, 1200, 0.8);
          return { file, url: URL.createObjectURL(file) };
        })
    );
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_LISTING_PHOTOS));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length === 0 && !pageImage) return setError("Добавьте фото или возьмите его со страницы");
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      photos.forEach((p) => body.append("photos", p.file));
      if (photos.length === 0 && pageImage) body.append("pageImage", pageImage);
      body.append("title", title);
      body.append("size", size);
      body.append("price", price);
      body.append("condition", condition);
      if (category) body.append("category", category);
      body.append("description", description);
      body.append("sourceUrl", url);
      body.append("weightKg", weight);
      body.append("calcRegion", region);
      body.append("calcLocalPrice", localPrice);
      if (region === "china") body.append("calcChinaTier", chinaTier);
      const res = await fetch("/api/miniapp/listings", { method: "POST", headers: tgInitHeaders(), body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось опубликовать");
      setDoneId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  if (doneId) {
    return (
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6 text-center">
        <div className="font-display text-xl font-bold">Заявка отправлена</div>
        <p className="mt-2 text-sm text-white/60">Мы проверим вещь и опубликуем её на сайте и в канале. Статус — в профиле, в «Мои вещи».</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/profile" className="font-display rounded-full btn-fx bg-accent text-ink px-5 py-2.5 text-sm font-semibold">
            В профиль
          </Link>
          <button onClick={() => location.reload()} className="font-display rounded-full border border-line px-5 py-2.5 text-sm">
            Ещё одну
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className={label}>Ссылка на вещь</label>
        <div className="flex gap-2">
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").trim();
              if (pasted) setTimeout(() => fill(pasted), 0);
            }}
            placeholder="https://jp.mercari.com/item/..."
            className={field}
          />
          <button type="button" onClick={() => fill(url.trim())} disabled={!!status} className="font-display shrink-0 rounded-2xl border border-line px-4 text-sm disabled:opacity-50">
            Заполнить
          </button>
        </div>
        {status && <p className="mt-2 text-xs text-white/50">{status}</p>}
        {note && <p className="mt-2 text-xs text-amber-300/80">{note}</p>}
        <p className="mt-2 text-xs text-white/35">Mercari, Rakuten, Yahoo, Taobao, Poizon, Musinsa. Ссылку видит только администратор.</p>
      </div>

      <div>
        <label className={label}>Фото</label>
        <div className="flex flex-wrap gap-2">
          {photos.length === 0 && pageImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pageImage} alt="" referrerPolicy="no-referrer" className="w-24 h-24 rounded-2xl object-cover border border-accent" />
          )}
          {photos.map((p, i) => (
            <button key={p.url} type="button" onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-24 h-24 rounded-2xl object-cover border border-line" />
              <span className="absolute top-1 right-1 rounded-full bg-black/70 px-1.5 text-xs">✕</span>
            </button>
          ))}
          {photos.length < MAX_LISTING_PHOTOS && (
            <label className="w-24 h-24 rounded-2xl border border-dashed border-line flex items-center justify-center text-xs text-white/50 text-center cursor-pointer">
              Своё фото
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-white/35">
          {pageImage ? "Без своих фото возьмём первое фото со страницы." : "Вставьте ссылку — возьмём первое фото со страницы, или загрузите свои."}
        </p>
      </div>

      <div>
        <label className={label}>Название</label>
        <input required value={title} onChange={(e) => { setTitle(e.target.value); setCategory(guessCategory(e.target.value) ?? category); }} className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Размер</label>
          <input required value={size} onChange={(e) => setSize(e.target.value)} placeholder="M, 42, OS" className={field} />
        </div>
        <div>
          <label className={label}>Тип вещи</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            <option value="">—</option>
            {LISTING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Состояние</label>
        <select required value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>
          <option value="" disabled>Выберите</option>
          {LISTING_CONDITIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-line bg-panel/60 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Страна</label>
            <select value={region} onChange={(e) => setRegion(e.target.value as RegionKey)} className={field}>
              {SELL_REGIONS.map((r) => <option key={r} value={r}>{REGIONS[r].name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Цена, {REGIONS[region].currency}</label>
            <input required inputMode="decimal" value={localPrice} onChange={(e) => setLocalPrice(e.target.value)} className={field} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Вес, кг</label>
            <input required inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={field} />
          </div>
          {region === "china" && (
            <div>
              <label className={label}>Доставка</label>
              <select value={chinaTier} onChange={(e) => setChinaTier(e.target.value)} className={field}>
                {CHINA_DELIVERY_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/50">Выкуп под ключ</span>
          <span className="font-display font-semibold">{base != null ? `${base.toLocaleString("ru-RU")} ₽` : "—"}</span>
        </div>
      </div>

      <div>
        <label className={label}>Ваша цена, ₽</label>
        <input required inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder={base ? String(base) : ""} className={field} />
        {earning != null && (
          <p className={`mt-2 text-sm ${earning < 0 ? "text-red-400" : "text-emerald-300"}`}>
            {earning < 0 ? "Цена ниже стоимости выкупа" : `Ваш заработок: ${earning.toLocaleString("ru-RU")} ₽`}
          </p>
        )}
      </div>
      <div>
        <label className={label}>Описание</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={800} className={field} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button disabled={loading || (earning != null && earning < 0)} className="w-full font-display rounded-full btn-fx bg-accent text-ink py-3.5 font-semibold disabled:opacity-50">
        {loading ? "Отправляем…" : "Отправить на проверку"}
      </button>
      <p className="text-xs text-white/35 text-center">
        Заявки на покупку приходят в YenWay — мы выкупаем вещь и доставляем покупателю, а разницу выплачиваем вам.
      </p>
    </form>
  );
}
