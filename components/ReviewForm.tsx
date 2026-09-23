"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { downscaleImage } from "@/lib/image";

export default function ReviewForm() {
  const [username, setUsername] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    const file = await downscaleImage(picked, 1200, 0.8);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Выберите оценку");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      body.append("username", username);
      body.append("rating", String(rating));
      body.append("text", text);
      if (photo) body.append("photo", photo);
      const res = await fetch("/api/review", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
      } else {
        setSent(true);
        setUsername("");
        setRating(0);
        setText("");
        clearPhoto();
      }
    } catch {
      setError("Не удалось отправить отзыв. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-panel border border-line p-7">
      <h2 className="font-display text-xl font-bold">Оставить отзыв</h2>
      <p className="mt-1 text-sm text-white/50">
        Отзыв уходит на модерацию — мы проверим и опубликуем его на сайте.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Оценка
          </label>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoverRating(n)}
                onClick={() => setRating(n)}
                className="text-3xl leading-none"
                aria-label={`${n} из 5`}
              >
                <span className={(hoverRating || rating) >= n ? "text-accent" : "text-white/20"}>★</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Ваш ник в Telegram
          </label>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ivan_petrov"
            className="w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Текст отзыва
          </label>
          <textarea
            required
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите, как прошёл заказ..."
            className="w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Фото вещи <span className="normal-case tracking-normal text-white/30">(по желанию)</span>
          </label>
          {preview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Фото к отзыву" className="max-h-40 rounded-xl object-contain" />
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Убрать фото"
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink border border-line text-white/70 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center rounded-2xl bg-ink border border-dashed border-line py-5 px-4 cursor-pointer hover:border-accent transition-colors">
              <span className="text-white/40 text-sm">Прикрепить фото полученной вещи</span>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="font-display w-full rounded-2xl bg-accent text-ink py-3.5 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {loading ? "Отправляем..." : "Отправить на модерацию"}
        </motion.button>
      </form>

      <AnimatePresence>
        {sent && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-accent"
          >
            Спасибо! Отзыв отправлен на модерацию — опубликуем после проверки.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
