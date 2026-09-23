"use client";

import { useState } from "react";
import { downscaleImage } from "@/lib/image";
import { LISTING_CONDITIONS, MAX_LISTING_PHOTOS } from "@/lib/listing-constants";

const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";

export default function ListingForm({ own = false, onDone }: { own?: boolean; onDone?: () => void }) {
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(LISTING_CONDITIONS[2]);
  const [description, setDescription] = useState("");
  const [seller, setSeller] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, j) => j !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Добавьте фото для превью");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      photos.forEach((p) => body.append("photos", p.file));
      body.append("title", title);
      body.append("size", size);
      body.append("price", price);
      body.append("condition", condition);
      body.append("description", description);
      if (!own) body.append("seller", seller);
      const res = await fetch(own ? "/api/admin/stock" : "/api/stock", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось отправить");
      setDone(true);
      setPhotos([]);
      setTitle("");
      setSize("");
      setPrice("");
      setDescription("");
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <span className={label}>Фото</span>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full rounded-xl object-cover border border-line" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-ink/80 rounded px-1">превью</span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Убрать фото"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink border border-line text-white/70 text-sm hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_LISTING_PHOTOS && (
            <label className="w-20 h-20 rounded-xl border border-dashed border-line flex items-center justify-center text-center text-[11px] leading-tight text-white/40 cursor-pointer hover:border-accent px-1">
              {photos.length === 0 ? "Фото для превью" : "+ ещё фото"}
              <input
                type="file"
                accept="image/*"
                multiple={photos.length > 0}
                className="hidden"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-white/30">
          Первое фото — превью в ленте, остальные видны на странице вещи. До {MAX_LISTING_PHOTOS} фото.
        </p>
      </div>

      <div>
        <label className={label}>Название модели</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rick Owens Geobasket" className={field} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Размер</label>
          <input required value={size} onChange={(e) => setSize(e.target.value)} placeholder="42" className={field} />
        </div>
        <div>
          <label className={label}>Цена, ₽</label>
          <input required inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="35000" className={field} />
        </div>
      </div>

      <div>
        <label className={label}>Состояние</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className={field}>
          {LISTING_CONDITIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Описание <span className="normal-case tracking-normal text-white/30">(по желанию)</span></label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Сезон, замеры, комплект..." className={`${field} resize-none`} />
      </div>

      {!own && (
        <div>
          <label className={label}>Ваш ник в Telegram</label>
          <input required value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="ivan_petrov" className={field} />
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {done && (
        <p className="text-accent text-sm">
          {own ? "Опубликовано ✓ Пост отправлен в бота объявлений." : "Объявление отправлено на модерацию — после проверки оно появится в ленте."}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="font-display w-full rounded-2xl bg-accent text-ink py-3.5 px-4 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
      >
        {loading ? "Отправляем..." : own ? "Опубликовать" : "Отправить на модерацию"}
      </button>
    </form>
  );
}
