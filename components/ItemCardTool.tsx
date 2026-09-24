"use client";

import { useState } from "react";
import { warmUpBgRemoval } from "@/lib/bg-removal";
import { cutoutOnBlack } from "@/lib/card-image";
import { CURRENCIES, Currency, convertToRub } from "@/lib/pricing";

const input = "w-full rounded-xl bg-ink border border-line px-4 py-2.5 outline-none focus:border-accent";

export default function ItemCardTool() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("JPY");
  const [card, setCard] = useState<Blob | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function setCardBlob(b: Blob | null) {
    if (cardUrl) URL.revokeObjectURL(cardUrl);
    setCard(b);
    setCardUrl(b ? URL.createObjectURL(b) : null);
  }

  async function processImage(source: Blob) {
    setNote(null);
    setStatus("Вырезаем фон… (первый раз дольше — качается модель)");
    const { card, note } = await cutoutOnBlack(source);
    setCardBlob(card);
    setNote(note);
    setStatus(null);
  }

  async function fetchInfo(e: React.FormEvent) {
    e.preventDefault();
    warmUpBgRemoval();
    setError(null);
    setNote(null);
    setSent(false);
    setCardBlob(null);
    setBusy(true);
    setStatus("Смотрим страницу вещи…");
    try {
      const res = await fetch("/api/admin/item-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не удалось получить данные");
      setTitle(data.title ?? "");
      setSize(data.size ?? "");
      setCondition(data.condition ?? "");
      setPrice(data.price != null ? String(data.price) : "");
      if (data.currency) setCurrency(data.currency);
      if (!data.title && !data.image) {
        setNote(
          `Площадка не отдала данные${data.fetchError ? ` (${data.fetchError})` : ""} — заполните поля и загрузите фото вручную.`
        );
      }
      if (data.image) {
        const img = await fetch(`/api/admin/image-proxy?url=${encodeURIComponent(data.image)}`);
        if (img.ok) await processImage(await img.blob());
        else setNote("Фото со страницы не загрузилось — загрузите его вручную.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setStatus(null);
      setBusy(false);
    }
  }

  async function send() {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("url", url);
      body.append("title", title);
      body.append("size", size);
      body.append("condition", condition);
      body.append("price", price);
      body.append("currency", currency);
      if (card) body.append("photo", card, "item.jpg");
      const res = await fetch("/api/admin/item-card", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось отправить");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const priceNum = parseFloat(price.replace(/[^\d.]/g, ""));
  const rub = Number.isFinite(priceNum) && priceNum > 0 ? convertToRub(priceNum, currency) : null;

  return (
    <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
      <h2 className="font-display font-semibold">Карточка вещи → Telegram</h2>
      <p className="mt-1 text-sm text-white/40">
        Вставьте ссылку — бот карточек пришлёт фото на чёрном фоне, описание, цену по курсу и ссылку.
      </p>

      <form onSubmit={fetchInfo} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          required
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={warmUpBgRemoval}
          placeholder="https://jp.mercari.com/item/..."
          className={input}
        />
        <button
          type="submit"
          disabled={busy}
          className="font-display rounded-xl bg-accent text-ink px-5 py-2.5 font-semibold hover:bg-accent2 disabled:opacity-50 shrink-0"
        >
          Получить
        </button>
      </form>

      {status && <p className="mt-3 text-sm text-white/50">{status}</p>}
      {note && <p className="mt-3 text-sm text-amber-300/80">{note}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-5 grid sm:grid-cols-[220px,1fr] gap-5">
        <div>
          <div className="aspect-square rounded-2xl bg-black border border-line overflow-hidden flex items-center justify-center">
            {cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cardUrl} alt="Карточка" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-white/30">превью</span>
            )}
          </div>
          <label className="mt-2 block text-center text-xs text-white/50 cursor-pointer hover:text-white/80">
            Загрузить фото вручную
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) {
                  setBusy(true);
                  await processImage(f);
                  setBusy(false);
                }
              }}
            />
          </label>
        </div>

        <div className="space-y-2.5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Полное название" className={input} />
          <div className="grid grid-cols-[90px,1fr] gap-2.5">
            <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Размер" className={input} />
            <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Состояние" className={input} />
          </div>
          <div className="grid grid-cols-[1fr,auto] gap-2.5">
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Цена" inputMode="decimal" className={input} />
            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={input}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-white/50">
            {rub != null
              ? `≈ ${rub.toLocaleString("ru-RU")} ₽ по курсу (без доставки и комиссии)`
              : Number.isFinite(priceNum) && priceNum > 0
                ? "Курс для этой валюты не задан в lib/pricing.ts"
                : " "}
          </p>
          <button
            type="button"
            onClick={send}
            disabled={busy || !url || !!status}
            className="font-display w-full rounded-xl bg-accent text-ink py-2.5 font-semibold hover:bg-accent2 disabled:opacity-50"
          >
            Отправить в Telegram
          </button>
          {sent && <p className="text-sm text-accent">Отправлено ✓</p>}
        </div>
      </div>
    </section>
  );
}
