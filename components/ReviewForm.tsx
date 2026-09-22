"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewForm() {
  const [username, setUsername] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Выберите оценку");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, rating, text })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
      } else {
        setSent(true);
        setUsername("");
        setRating(0);
        setText("");
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
