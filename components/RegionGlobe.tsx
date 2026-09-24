"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { REGION_LIST } from "@/lib/regions";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.5" />
      <ellipse cx="12" cy="12" rx="4.2" ry="9.5" />
      <path d="M2.5 12h19M3.9 7h16.2M3.9 17h16.2" />
    </svg>
  );
}

const RADIUS = 118;
const ease = [0.16, 1, 0.3, 1] as const;

export default function RegionGlobe() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Страны"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`block py-1 transition-colors hover:text-white ${open ? "text-white" : ""}`}
      >
        <motion.span className="block w-6 h-6" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.6, ease }}>
          <GlobeIcon className="w-6 h-6" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.35, ease }}
            style={{ transformOrigin: "50% 0%" }}
            className="absolute left-1/2 top-full mt-4 -ml-[170px] w-[340px] h-[340px] rounded-full bg-panel/85 backdrop-blur-md border border-line shadow-2xl z-50"
          >
            <GlobeIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white/20" />
            {REGION_LIST.map((r, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / REGION_LIST.length;
              return (
                <motion.div
                  key={r.key}
                  className="absolute left-1/2 top-1/2"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
                  animate={{ x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS, opacity: 1, scale: 1 }}
                  exit={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 * i }}
                >
                  <Link
                    href={`/order?region=${r.key}`}
                    onClick={() => setOpen(false)}
                    className="block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-ink px-4 py-2 text-xs text-white/80 hover:bg-accent hover:text-ink hover:border-accent transition-colors"
                  >
                    {r.name}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
