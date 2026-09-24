"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { downscaleImage } from "@/lib/image";
import ItemCardTool from "@/components/ItemCardTool";
import AdminStock from "@/components/AdminStock";

interface StoredReview {
  id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published";
  hasPhoto?: boolean;
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
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"cards" | "stock" | "preorder" | "reviews">("cards");

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
    if (!confirm("Удалить отзыв?")) return;
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
    const body = new FormData();
    body.append("username", newUsername);
    body.append("rating", String(newRating));
    body.append("text", newText);
    if (newPhoto) body.append("photo", newPhoto);
    const res = await fetch("/api/admin/reviews", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setPublishError(data.error ?? "Ошибка");
      return;
    }
    setNewUsername("");
    setNewRating(5);
    setNewText("");
    setNewPhoto(null);
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
      <div aria-hidden className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/admin/wallpaper" alt="" className="w-full h-full object-cover object-[50%_30%]" />
        <div className="absolute inset-0 bg-ink/70" />
      </div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Админка</h1>
        <button onClick={logout} className="text-sm text-white/40 hover:text-white/70">
          Выйти
        </button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto">
        {(
          [
            ["cards", "Карточки"],
            ["stock", "В наличии"],
            ["preorder", "Под заказ"],
            ["reviews", "Отзывы"]
          ] as const
        ).map(([key, name]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-display text-sm rounded-full px-4 py-2 border shrink-0 ${
              tab === key ? "bg-accent text-ink border-accent font-semibold" : "border-line text-white/60 hover:text-white"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "cards" && <ItemCardTool />}
      {tab === "stock" && <AdminStock key="stock" kind="stock" />}
      {tab === "preorder" && <AdminStock key="preorder" kind="preorder" />}
      {tab === "reviews" && (
        <>
      {loading && <p className="mt-4 text-white/40 text-sm">Обновляем...</p>}
      {actionError && <p className="mt-4 text-red-400 text-sm">{actionError}</p>}

      <section className="mt-10 rounded-3xl bg-panel border border-line p-6">
        <h2 className="font-display font-semibold mb-4">Опубликовать отзыв напрямую</h2>
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
          <label className="flex items-center gap-3 text-sm text-white/50 cursor-pointer">
            <span className="rounded-xl border border-line px-3 py-2 hover:border-accent">
              {newPhoto ? "Фото выбрано ✓" : "Прикрепить фото (по желанию)"}
            </span>
            {newPhoto && (
              <button type="button" onClick={() => setNewPhoto(null)} className="hover:text-red-400">
                убрать
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) setNewPhoto(await downscaleImage(f, 1200, 0.8));
              }}
            />
          </label>
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
                  {r.hasPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/review-photo/${r.id}`} alt="" className="mt-2 h-24 rounded-lg object-cover" />
                  )}
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
                  {r.hasPhoto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/review-photo/${r.id}`} alt="" className="mt-2 h-24 rounded-lg object-cover" />
                  )}
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
        </>
      )}
    </main>
  );
}
