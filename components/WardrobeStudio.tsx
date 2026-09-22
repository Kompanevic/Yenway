"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORIES,
  ItemCategory,
  WardrobeItem,
  buildOutfit,
  extractDominantColor,
  nearestColorFamily,
  Outfit
} from "@/lib/wardrobe";

async function cutoutToDataUrl(file: File): Promise<{ dataUrl: string; color: string }> {
  // Библиотека тяжёлая (WASM/ONNX) и нужна только в браузере — грузим её как
  // настоящий ESM-модуль с CDN в рантайме, а не через сборку Next.js/webpack.
  const cdnUrl = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";
  // @ts-ignore — динамический импорт по URL, TypeScript не резолвит типы CDN-модуля
  const mod = (await import(/* webpackIgnore: true */ cdnUrl)) as {
    removeBackground: (file: File) => Promise<Blob>;
  };
  const blob = await mod.removeBackground(file);
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  const img = await new Promise<HTMLImageElement>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const color = extractDominantColor(ctx.getImageData(0, 0, canvas.width, canvas.height));

  return { dataUrl, color };
}

export default function WardrobeStudio() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setProcessing(true);
    setOutfit(null);
    setNoMatch(false);
    for (const file of Array.from(files)) {
      try {
        const { dataUrl, color } = await cutoutToDataUrl(file);
        const family = nearestColorFamily(color);
        setItems((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            category: "top",
            image: dataUrl,
            color,
            colorFamily: family.name
          }
        ]);
      } catch {
        // одно фото не обработалось — пропускаем, остальные продолжаем
      }
    }
    setProcessing(false);
  }

  function setCategory(id: string, category: ItemCategory) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, category } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setOutfit(null);
  }

  function generateOutfit() {
    const result = buildOutfit(items);
    setOutfit(result);
    setNoMatch(!result);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="font-display rounded-2xl bg-accent text-ink px-6 py-3 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {processing ? "Обрабатываем..." : "Добавить вещи"}
        </motion.button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        {items.length > 0 && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={generateOutfit}
            className="font-display rounded-2xl border border-line px-6 py-3 font-semibold hover:border-accent transition-colors"
          >
            Собрать образ
          </motion.button>
        )}
        <span className="text-sm text-white/40">
          Фото обрабатываются прямо в браузере — никуда не отправляются.
        </span>
      </div>

      {items.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xs uppercase tracking-wide text-white/40 mb-4">
            Ваш гардероб
          </h2>
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-panel border border-line overflow-hidden"
              >
                <div className="relative aspect-square bg-[conic-gradient(#1a1a1a_0_90deg,#151515_90deg_180deg,#1a1a1a_180deg_270deg,#151515_270deg_360deg)] bg-[length:16px_16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="Вещь" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/70 text-white/70 text-xs hover:bg-ink"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.colorFamily}
                  </div>
                  <select
                    value={item.category}
                    onChange={(e) => setCategory(item.id, e.target.value as ItemCategory)}
                    className="w-full text-xs rounded-lg bg-ink border border-line px-2 py-1.5 outline-none focus:border-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {outfit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl bg-panel border border-accent/40 p-7"
          >
            <div className="font-display text-xs uppercase tracking-wide text-accent mb-4">
              Ваш образ
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {outfit.items.map((item) => (
                <div key={item.id} className="rounded-2xl bg-ink border border-line overflow-hidden">
                  <div className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="Вещь" className="absolute inset-0 w-full h-full object-contain p-2" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {noMatch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-sm text-white/50"
          >
            Не хватает сочетающихся по цвету вещей — добавьте ещё верх или низ и попробуйте снова.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
