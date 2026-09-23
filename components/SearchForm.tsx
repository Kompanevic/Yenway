"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { downscaleImage } from "@/lib/image";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export default function SearchForm() {
  const [username, setUsername] = useState("");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    const file = picked ? await downscaleImage(picked, 1600) : null;
    if (file && file.size > MAX_PHOTO_BYTES) {
      setError("Фото слишком большое (макс. 4 МБ)");
      setPhoto(null);
      setPreview(null);
      return;
    }
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError("Приложите фото вещи");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const body = new FormData();
      body.append("username", username);
      body.append("itemName", itemName);
      body.append("description", description);
      body.append("photo", photo);
      const res = await fetch("/api/search", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
      } else {
        setSent(true);
        setUsername("");
        setItemName("");
        setDescription("");
        setPhoto(null);
        setPreview(null);
      }
    } catch {
      setError("Не удалось отправить заявку. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-panel border border-line p-7">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Фото вещи
          </label>
          <label className="flex items-center justify-center rounded-2xl bg-ink border border-dashed border-line py-6 px-4 cursor-pointer hover:border-accent transition-colors">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Превью" className="max-h-40 rounded-xl object-contain" />
            ) : (
              <span className="text-white/40 text-sm text-center">Нажмите, чтобы выбрать фото</span>
            )}
            <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Название вещи
          </label>
          <input
            required
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="например: куртка Rick Owens"
            className="w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Описание и ваш размер
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="цвет, модель, ваш размер и т.д."
            className="w-full rounded-2xl bg-ink border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors resize-none"
          />
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

        <p className="text-xs text-white/40">
          Стоимость услуги поиска — 450 ₽. Прямо сейчас платить не нужно — мы свяжемся с вами в
          Telegram и всё обсудим.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="font-display w-full rounded-2xl bg-accent text-ink py-3.5 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {loading ? "Отправляем..." : "Отправить заявку"}
        </motion.button>
      </form>

      <AnimatePresence>
        {sent && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-accent"
          >
            Заявка отправлена! Мы посмотрим фото и напишем вам в Telegram.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
