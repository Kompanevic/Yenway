"use client";

import { useEffect, useState } from "react";
import PhotoPicker, { type PickedPhoto } from "./PhotoPicker";
import { VERDICT_LABEL, VERDICT_MAX_PHOTOS, type VerdictKind } from "@/lib/legit";
import type { Verdict } from "@/lib/legit-store";

const field = "w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent transition-colors";
const label = "block font-display text-xs uppercase tracking-wide text-white/50 mb-2";

// Админка: публикация вердиктов легит-чека и их удаление.
export default function AdminLegit() {
  const [items, setItems] = useState<Verdict[]>([]);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [title, setTitle] = useState("");
  const [verdict, setVerdict] = useState<VerdictKind>("legit");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/legit");
    const data = await res.json().catch(() => ({}));
    setItems(data.verdicts ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      photos.forEach((p) => body.append("photos", p.file));
      body.append("title", title);
      body.append("verdict", verdict);
      body.append("note", note);
      const res = await fetch("/api/admin/legit", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Не удалось опубликовать");
      setPhotos([]);
      setTitle("");
      setNote("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить вердикт?")) return;
    await fetch(`/api/admin/legit/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-3xl bg-panel/90 border border-line p-6">
        <h2 className="font-display font-semibold mb-4">Опубликовать вердикт</h2>
        <form onSubmit={publish} className="space-y-4">
          <div>
            <label className={label}>Фото · первое — обложка в сетке</label>
            <PhotoPicker photos={photos} onChange={setPhotos} max={VERDICT_MAX_PHOTOS} />
          </div>
          <div>
            <label className={label}>Модель</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rick Owens Geobasket" className={field} />
          </div>
          <div>
            <label className={label}>Вердикт</label>
            <div className="flex gap-2">
              {(["legit", "fake"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerdict(v)}
                  className={`font-display rounded-full px-5 py-2 text-sm font-bold border ${
                    verdict === v
                      ? v === "legit"
                        ? "bg-emerald-400 text-ink border-emerald-400"
                        : "bg-red-500 text-white border-red-500"
                      : "border-line text-white/60"
                  }`}
                >
                  {VERDICT_LABEL[v]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label}>Комментарий (по желанию)</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="на что смотрели: шрифт на стельке, строчка, форма носка…" className={`${field} resize-none`} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || photos.length === 0}
            className="font-display rounded-xl btn-fx bg-accent text-ink px-5 py-2.5 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
          >
            {loading ? "Публикуем..." : "Опубликовать"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display font-semibold mb-3">Опубликованные · {items.length}</h2>
        {items.length === 0 ? (
          <p className="text-white/40 text-sm">Пока пусто.</p>
        ) : (
          <div className="space-y-2">
            {items.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-2xl bg-panel/90 border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/legit-photo/${v.id}/0`} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{v.title}</div>
                  <div className="text-xs text-white/40">
                    {VERDICT_LABEL[v.verdict]} · {v.photoCount} фото · {new Date(v.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <button onClick={() => remove(v.id)} className="text-sm text-red-400/80 hover:text-red-400 shrink-0">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
