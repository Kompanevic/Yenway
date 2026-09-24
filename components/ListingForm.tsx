"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { downscaleImage } from "@/lib/image";
import { warmUpBgRemoval } from "@/lib/bg-removal";
import { cutoutOnBlack } from "@/lib/card-image";
import type { ItemInfo } from "@/lib/item-info";
import { LISTING_CONDITIONS, MAX_LISTING_PHOTOS, type ListingKind } from "@/lib/listing-constants";
import { CHINA_DELIVERY_TIERS, MANAGER_TELEGRAM, calculatePrice, type Currency } from "@/lib/pricing";
import { REGIONS, REGION_LIST, type RegionKey } from "@/lib/regions";

const PREORDER_DESCRIPTION = `Подробнее в личные сообщения к менеджеру.
Вес указан приблизительно, для точного расчёта обратитесь к менеджеру @${MANAGER_TELEGRAM}.`;
const CURRENCY_REGION: Record<Currency, RegionKey> = { JPY: "japan", CNY: "china", KRW: "korea", USD: "usa", EUR: "europe" };

const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";

// Состояние со страницы площадки → ближайший вариант из списка формы.
function mapCondition(c: string | null): string | null {
  if (!c) return null;
  const s = c.toLowerCase();
  if (/новое|new/.test(s) && !/почти/.test(s)) return /бирк|tag/.test(s) ? "Новое с биркой" : "Новое без бирки";
  if (/почти новое|без заметных|отличн/.test(s)) return "Отличное";
  if (/бережно|gently|небольшие|хорош/.test(s)) return "Хорошее";
  if (/след|б\/у|ношен|плох|used|worn/.test(s)) return "Есть следы носки";
  return null;
}

export default function ListingForm({
  own = false,
  kind = "stock",
  onDone
}: {
  own?: boolean;
  kind?: ListingKind;
  onDone?: () => void;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(LISTING_CONDITIONS[2]);
  const [description, setDescription] = useState(kind === "preorder" ? PREORDER_DESCRIPTION : "");
  const [seller, setSeller] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [autoStatus, setAutoStatus] = useState<string | null>(null);
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const autoPhotoUrl = useRef<string | null>(null);
  // Расчёт «под ключ» для «под заказ»: цена товара в валюте площадки + вес/страна.
  const [region, setRegion] = useState<RegionKey>("japan");
  const [weight, setWeight] = useState("");
  const [localPrice, setLocalPrice] = useState("");
  const [chinaTier, setChinaTier] = useState(CHINA_DELIVERY_TIERS[0].id);

  const breakdown = useMemo(() => {
    if (kind !== "preorder") return null;
    const lp = parseFloat(localPrice.replace(",", "."));
    if (!Number.isFinite(lp) || lp <= 0) return null;
    const w = parseFloat(weight.replace(",", "."));
    return calculatePrice(lp, region, sourceUrl, Number.isFinite(w) && w > 0 ? w : null, chinaTier);
  }, [kind, localPrice, weight, region, sourceUrl, chinaTier]);

  useEffect(() => {
    if (breakdown?.totalRUB) setPrice(String(breakdown.totalRUB));
  }, [breakdown?.totalRUB]);

  // «Под заказ»: по ссылке заполняем поля, цену по курсу и превью с вырезанным фоном.
  async function fillFromLink(url: string) {
    if (!/^https?:\/\/\S+$/.test(url)) return;
    warmUpBgRemoval();
    setAutoNote(null);
    setAutoStatus("Смотрим страницу вещи…");
    const notes: string[] = [];
    try {
      const res = await fetch("/api/admin/item-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const info = (await res.json()) as ItemInfo & { error?: string };
      if (!res.ok) throw new Error(info.error ?? "Не удалось получить данные");
      if (info.title) setTitle(info.title.slice(0, 120));
      if (info.size) setSize(info.size.slice(0, 20));
      const cond = mapCondition(info.condition);
      if (cond) setCondition(cond);
      if (info.currency) setRegion(CURRENCY_REGION[info.currency]);
      if (info.price) setLocalPrice(String(info.price));
      if (!info.title && !info.image) {
        notes.push(`Площадка не отдала данные${info.fetchError ? ` (${info.fetchError})` : ""} — заполните поля вручную.`);
      }
      if (info.image) {
        setAutoStatus("Вырезаем фон… (первый раз дольше — качается модель)");
        const img = await fetch(`/api/admin/image-proxy?url=${encodeURIComponent(info.image)}`);
        if (!img.ok) {
          notes.push("Фото со страницы не загрузилось — добавьте его вручную.");
        } else {
          const { card, note } = await cutoutOnBlack(await img.blob());
          if (note) notes.push(note);
          if (card) {
            const file = await downscaleImage(new File([card], "cover.jpg", { type: "image/jpeg" }), 1200, 0.85);
            const url = URL.createObjectURL(file);
            const previous = autoPhotoUrl.current;
            autoPhotoUrl.current = url;
            setPhotos((prev) => [{ file, url }, ...prev.filter((p) => p.url !== previous)].slice(0, MAX_LISTING_PHOTOS));
          }
        }
      }
    } catch (e) {
      notes.push(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAutoStatus(null);
      setAutoNote(notes.length ? notes.join(" ") : null);
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
      body.append("kind", kind);
      if (kind === "preorder") {
        body.append("sourceUrl", sourceUrl);
        body.append("weightKg", weight);
      }
      const res = await fetch(own ? "/api/admin/stock" : "/api/stock", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось отправить");
      setDone(true);
      setPhotos([]);
      setTitle("");
      setSize("");
      setPrice("");
      setDescription(kind === "preorder" ? PREORDER_DESCRIPTION : "");
      setSourceUrl("");
      setLocalPrice("");
      setWeight("");
      setAutoNote(null);
      autoPhotoUrl.current = null;
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {kind === "preorder" && (
        <div>
          <label className={label}>
            Ссылка на товар <span className="normal-case tracking-normal text-white/30">(видите только вы)</span>
          </label>
          <div className="flex gap-2">
            <input
              required
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              onFocus={warmUpBgRemoval}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text").trim();
                if (pasted) setTimeout(() => fillFromLink(pasted), 0);
              }}
              placeholder="https://jp.mercari.com/item/..."
              className={field}
            />
            <button
              type="button"
              onClick={() => fillFromLink(sourceUrl.trim())}
              disabled={!!autoStatus}
              className="font-display shrink-0 rounded-2xl border border-line px-4 text-sm hover:border-accent disabled:opacity-50"
            >
              Заполнить
            </button>
          </div>
          {autoStatus && <p className="mt-2 text-sm text-white/50">{autoStatus}</p>}
          {autoNote && <p className="mt-2 text-sm text-amber-300/80">{autoNote}</p>}
          {!autoStatus && !autoNote && (
            <p className="mt-2 text-xs text-white/30">
              Вставьте ссылку — заполним поля, цену по курсу и превью с вырезанным фоном. Всё можно поправить.
            </p>
          )}
        </div>
      )}

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

      {kind === "preorder" && (
        <div className="rounded-2xl border border-line p-4 space-y-3">
          <span className={label}>Расчёт под ключ</span>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="block text-[11px] text-white/40 mb-1">Страна</span>
              <select value={region} onChange={(e) => setRegion(e.target.value as RegionKey)} className={field}>
                {REGION_LIST.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-[11px] text-white/40 mb-1">Вес, кг</span>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                placeholder="1.2"
                className={field}
              />
            </label>
          </div>
          {region === "china" && (
            <select value={chinaTier} onChange={(e) => setChinaTier(e.target.value)} className={field}>
              {CHINA_DELIVERY_TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.ratePerKg} ₽/кг, {t.days}
                </option>
              ))}
            </select>
          )}
          <label className="block">
            <span className="block text-[11px] text-white/40 mb-1">Цена товара, {REGIONS[region].currency}</span>
            <input
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              inputMode="decimal"
              placeholder="45000"
              className={field}
            />
          </label>
          <p className="text-xs text-white/50 leading-relaxed">
            {!breakdown
              ? "Укажите цену товара — посчитаем итог с комиссией, страховкой и доставкой."
              : breakdown.itemPriceRUB == null
                ? "США и Европа считаются вручную — впишите итоговую цену в рублях ниже."
                : [
                    `Товар ${breakdown.itemPriceRUB.toLocaleString("ru-RU")} ₽`,
                    breakdown.commissionRUB != null ? `комиссия ${breakdown.commissionRUB} ₽` : null,
                    breakdown.insuranceRUB != null ? `страховка ${breakdown.insuranceRUB} ₽` : null,
                    breakdown.serviceFeeRUB != null ? `сервис ${breakdown.serviceFeeRUB} ₽` : null,
                    breakdown.deliveryRUB != null ? `доставка ${breakdown.deliveryRUB.toLocaleString("ru-RU")} ₽` : "доставка — укажите вес"
                  ]
                    .filter(Boolean)
                    .join(" + ") + ` = ${breakdown.totalRUB?.toLocaleString("ru-RU")} ₽ → подставлено в «Цена, ₽»`}
          </p>
        </div>
      )}

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

      {!own && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100/90 leading-relaxed">
          <span className="font-display font-semibold text-amber-200">Внимание!</span> Фото вещи обязательно
          должны быть на вырезанном чёрном фоне. Если такой возможности нет — напишите{" "}
          <a
            href={`https://t.me/${MANAGER_TELEGRAM}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-amber-200"
          >
            @{MANAGER_TELEGRAM}
          </a>
          : мы вырежем фон за вас, после чего выложите объявление заново.
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
        disabled={loading || !!autoStatus}
        className="font-display w-full rounded-2xl bg-accent text-ink py-3.5 px-4 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
      >
        {loading ? "Отправляем..." : own ? "Опубликовать" : "Отправить на модерацию"}
      </button>
    </form>
  );
}
