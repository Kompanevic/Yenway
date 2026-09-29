"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "./Reveal";
import { VERDICT_LABEL, type VerdictKind } from "@/lib/legit";

export interface VerdictItem {
  id: string;
  title: string;
  verdict: VerdictKind;
  note: string;
  photoCount: number;
  date: string;
}

const badge = (v: VerdictKind) =>
  `font-display font-bold tracking-wider rounded-full ${v === "legit" ? "bg-emerald-400 text-ink" : "bg-red-500 text-white"}`;

// Вердикты сеткой по 3 в ряд; по нажатию — фото крупно и комментарий.
export default function VerdictGrid({ items }: { items: VerdictItem[] }) {
  const [open, setOpen] = useState<VerdictItem | null>(null);
  const [n, setN] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setN((i) => (i + 1) % open.photoCount);
      if (e.key === "ArrowLeft") setN((i) => (i - 1 + open.photoCount) % open.photoCount);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) {
    return <div className="mt-8 rounded-3xl bg-panel border border-line p-10 text-center text-white/50">Вердикты скоро появятся.</div>;
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-3 gap-1.5 sm:gap-4">
        {items.map((v, i) => (
          <Reveal key={v.id} index={i % 3}>
            <button
              type="button"
              onClick={() => {
                setN(0);
                setOpen(v);
              }}
              className="group relative block w-full aspect-square rounded-lg sm:rounded-2xl overflow-hidden border border-line bg-panel text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/legit-photo/${v.id}/0`}
                alt={v.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
              <span className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs ${badge(v.verdict)}`}>
                {VERDICT_LABEL[v.verdict]}
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 sm:px-3 sm:pb-3 font-display text-[10px] sm:text-sm leading-tight line-clamp-2">
                {v.title}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-modal
                aria-label={open.title}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(null)}
              >
                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-full overflow-y-auto rounded-3xl bg-panel border border-line">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/legit-photo/${open.id}/${n}`} alt={open.title} className="w-full max-h-[60vh] object-contain bg-black" />
                    {open.photoCount > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Предыдущее фото"
                          onClick={() => setN((i) => (i - 1 + open.photoCount) % open.photoCount)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-2xl leading-none"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          aria-label="Следующее фото"
                          onClick={() => setN((i) => (i + 1) % open.photoCount)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-2xl leading-none"
                        >
                          ›
                        </button>
                        <span className="absolute bottom-2 right-3 text-xs text-white/70 tabular-nums">
                          {n + 1} / {open.photoCount}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display font-semibold">{open.title}</span>
                      <span className={`shrink-0 px-3 py-1 text-xs ${badge(open.verdict)}`}>{VERDICT_LABEL[open.verdict]}</span>
                    </div>
                    {open.note && <p className="mt-3 text-sm text-white/60 whitespace-pre-line">{open.note}</p>}
                    <div className="mt-3 text-xs text-white/30">{open.date}</div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Закрыть"
                  onClick={() => setOpen(null)}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-2xl leading-none"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
