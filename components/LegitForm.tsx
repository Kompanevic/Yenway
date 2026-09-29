"use client";

import { useState } from "react";
import PhotoPicker, { type PickedPhoto } from "./PhotoPicker";
import { LEGIT_ANGLES, LEGIT_FEE_RUB, LEGIT_MAX_PHOTOS, LEGIT_MIN_PHOTOS } from "@/lib/legit";

const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";

export default function LegitForm() {
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [model, setModel] = useState("");
  const [comment, setComment] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (photos.length < LEGIT_MIN_PHOTOS) {
      setError(`Нужно минимум ${LEGIT_MIN_PHOTOS} фото со всех сторон`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      photos.forEach((p) => body.append("photos", p.file));
      body.append("model", model);
      body.append("comment", comment);
      body.append("username", username);
      const res = await fetch("/api/legit", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Что-то пошло не так");
      setSent(true);
      setPhotos([]);
      setModel("");
      setComment("");
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-panel border border-line p-6 sm:p-7">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className={label}>
            Фото со всех сторон · {photos.length}/{LEGIT_MAX_PHOTOS}
          </label>
          <div className="mb-3 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 text-sm text-white/70">
            <div className="font-semibold text-amber-200/90 mb-2">
              Пришлите минимум {LEGIT_MIN_PHOTOS} чётких фото при хорошем свете:
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {LEGIT_ANGLES.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <PhotoPicker photos={photos} onChange={setPhotos} max={LEGIT_MAX_PHOTOS} />
        </div>

        <div>
          <label className={label}>Модель</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="например: Rick Owens Geobasket" className={field} />
        </div>

        <div>
          <label className={label}>Комментарий</label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="где покупали, цена, что смущает"
            className={`${field} resize-none`}
          />
        </div>

        <div>
          <label className={label}>Ваш ник в Telegram</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ivan_petrov" className={field} />
        </div>

        <p className="text-xs text-white/40">
          Стоимость проверки — {LEGIT_FEE_RUB} ₽. Прямо сейчас платить не нужно — мы напишем вам в Telegram.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {sent && <p className="text-sm text-accent">Заявка отправлена! Посмотрим фото и напишем вам в Telegram.</p>}

        <button
          type="submit"
          disabled={loading}
          className="font-display w-full rounded-2xl btn-fx bg-accent text-ink py-3.5 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {loading ? "Отправляем..." : "Отправить на проверку"}
        </button>
      </form>
    </div>
  );
}
