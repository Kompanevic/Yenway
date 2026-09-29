"use client";

import { downscaleImage } from "@/lib/image";

export interface PickedPhoto {
  file: File;
  url: string;
}

// Несколько фото: превью плиткой, удаление, ужатие в браузере перед отправкой.
export default function PhotoPicker({
  photos,
  onChange,
  max
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  max: number;
}) {
  async function add(files: FileList | null) {
    if (!files?.length) return;
    const picked = await Promise.all(
      Array.from(files)
        .slice(0, max - photos.length)
        .map(async (f) => {
          const file = await downscaleImage(f, 1200, 0.75);
          return { file, url: URL.createObjectURL(file) };
        })
    );
    onChange([...photos, ...picked].slice(0, max));
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {photos.map((p, i) => (
        <div key={p.url} className="relative aspect-square rounded-xl overflow-hidden border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            aria-label="Убрать фото"
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-sm leading-none"
          >
            ×
          </button>
        </div>
      ))}
      {photos.length < max && (
        <label className="aspect-square rounded-xl border border-dashed border-line flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent transition-colors text-white/40 text-xs text-center px-1">
          <span className="text-2xl leading-none">+</span>
          Добавить
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
