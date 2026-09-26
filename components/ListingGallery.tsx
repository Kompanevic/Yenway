"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import FadeImg from "./FadeImg";

export default function ListingGallery({ id, count, title }: { id: string; count: number; title: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  // Направление листания — для анимации слайда в полноэкранном просмотре.
  const [dir, setDir] = useState(0);
  // Портал — только на клиенте после гидрации.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = (n: number) => `/api/stock-photo/${id}/${n}`;

  const go = useCallback(
    (step: number) => {
      setDir(step);
      setActive((a) => (a + step + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (count > 1 && e.key === "ArrowRight") go(1);
      if (count > 1 && e.key === "ArrowLeft") go(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, count, go]);

  const arrow = "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-2xl leading-none transition-colors";

  return (
    <div>
      <div
        className="group relative aspect-square rounded-3xl overflow-hidden border border-line bg-panel cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        {/* При наведении фото чуть плавно увеличивается */}
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <FadeImg key={active} src={src(active)} alt={title} className="w-full h-full object-cover" />
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur px-3 py-1.5 text-xs text-white/80">
          ⤢ На весь экран
        </span>
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {Array.from({ length: count }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setDir(n > active ? 1 : -1);
                setActive(n);
              }}
              className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border transition-opacity ${n === active ? "border-accent" : "border-line opacity-60 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(n)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                role="dialog"
                aria-modal
                aria-label={title}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              >
                <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                  <motion.img
                    key={active}
                    src={src(active)}
                    alt={title}
                    custom={dir}
                    variants={{
                      enter: (d: number) => ({ opacity: 0, x: d * 80, scale: d ? 1 : 0.94 }),
                      center: { opacity: 1, x: 0, scale: 1 },
                      exit: (d: number) => ({ opacity: 0, x: d * -80 })
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    // Свайп влево/вправо на телефоне
                    drag={count > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60) go(1);
                      else if (info.offset.x > 60) go(-1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                    className="max-w-[94vw] max-h-[88vh] object-contain rounded-2xl select-none touch-pan-y"
                  />
                </AnimatePresence>

                <button
                  type="button"
                  aria-label="Закрыть"
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-2xl leading-none transition-colors"
                >
                  ×
                </button>
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Предыдущее фото"
                      onClick={(e) => {
                        e.stopPropagation();
                        go(-1);
                      }}
                      className={`${arrow} left-3 sm:left-6`}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Следующее фото"
                      onClick={(e) => {
                        e.stopPropagation();
                        go(1);
                      }}
                      className={`${arrow} right-3 sm:right-6`}
                    >
                      ›
                    </button>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/60 tabular-nums">
                      {active + 1} / {count}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
