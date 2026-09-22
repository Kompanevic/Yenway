"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StoredReview {
  id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-accent">
      {"★".repeat(rating)}
      <span className="text-white/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loading, setLoading] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/reviews");
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setAuthed(true);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError(data.error ?? "Ошибка входа");
      return;
    }
    setPassword("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setReviews([]);
  }

  async function approve(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setActionError(data?.error ?? "Не удалось опубликовать");
      return;
    }
    setActionError(null);
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setActionError(data?.error ?? "Не удалось удалить");
      return;
    }
    setActionError(null);
    load();
  }

  async function publishNew(e: React.FormEvent) {
    e.preventDefault();
    setPublishError(null);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, rating: newRating, text: newText })
    });
    const data = await res.json();
    if (!res.ok) {
      setPublishError(data.error ?? "Ошибка");
      return;
    }
    setNewUsername("");
    setNewRating(5);
    setNewText("");
    load();
  }

  if (authed === null) {
    return <main className="max-w-lg mx-auto px-6 py-24 text-white/40">Загрузка...</main>;
  }

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto px-6 py-24">
        <h1 className="font-display text-2xl font-bold">Вход в админку</h1>
        <form onSubmit={login} className="mt-6 space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full rounded-2xl bg-panel border border-line px-4 py-3 outline-none focus:border-accent"
          />
          {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
          <button
            type="submit"
            className="font-display w-full rounded-2xl bg-accent text-ink py-3 font-semibold hover:bg-accent2 transition-colors"
          >
            Войти
          </button>
        </form>
      </main>
    );
  }

  const pending = reviews.filter((r) => r.status === "pending");
  const published = reviews.filter((r) => r.status === "published");

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Отзывы — админка</h1>
        <button onClick={logout} className="text-sm text-white/40 hover:text-white/70">
          Выйти
        </button>
      </div>

      {loading && <p className="mt-4 text-white/40 text-sm">Обновляем...</p>}
      {actionError && <p className="mt-4 text-red-400 text-sm">{actionError}</p>}

      <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
        <h2 className="font-display font-semibold mb-4">Опубликовать напрямую</h2>
        <form onSubmit={publishNew} className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setNewRating(n)}
                className="text-2xl leading-none"
              >
                <span className={newRating >= n ? "text-accent" : "text-white/20"}>★</span>
              </button>
            ))}
          </div>
          <input
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="ник в Telegram"
            className="w-full rounded-xl bg-ink border border-line px-4 py-2.5 outline-none focus:border-accent"
          />
          <textarea
            required
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="текст отзыва"
            className="w-full rounded-xl bg-ink border border-line px-4 py-2.5 outline-none focus:border-accent resize-none"
          />
          {publishError && <p className="text-red-400 text-sm">{publishError}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="font-display rounded-xl bg-accent text-ink px-5 py-2.5 font-semibold hover:bg-accent2 transition-colors"
          >
            Опубликовать
          </motion.button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display font-semibold mb-4">На модерации ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-white/40 text-sm">Пусто.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl bg-panel border border-line p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">@{r.username}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-1.5 text-sm text-white/60">{r.text}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(r.id)}
                    className="font-display text-sm rounded-xl bg-accent text-ink px-3 py-1.5 font-semibold hover:bg-accent2"
                  >
                    Опубликовать
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="font-display text-sm rounded-xl border border-line px-3 py-1.5 hover:border-red-400 hover:text-red-400"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display font-semibold mb-4">Опубликованные ({published.length})</h2>
        {published.length === 0 ? (
          <p className="text-white/40 text-sm">Пусто.</p>
        ) : (
          <div className="space-y-3">
            {published.map((r) => (
              <div key={r.id} className="rounded-2xl bg-panel border border-line p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">@{r.username}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-1.5 text-sm text-white/60">{r.text}</p>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="font-display text-sm rounded-xl border border-line px-3 py-1.5 hover:border-red-400 hover:text-red-400 shrink-0"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
