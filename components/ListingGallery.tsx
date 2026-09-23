"use client";

import { useState } from "react";

export default function ListingGallery({ id, count, title }: { id: string; count: number; title: string }) {
  const [active, setActive] = useState(0);
  const src = (n: number) => `/api/stock-photo/${id}/${n}`;
  return (
    <div>
      <div className="aspect-square rounded-3xl overflow-hidden border border-line bg-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(active)} alt={title} className="w-full h-full object-cover" />
      </div>
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {Array.from({ length: count }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setActive(n)}
              className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border ${n === active ? "border-accent" : "border-line opacity-60"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(n)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
