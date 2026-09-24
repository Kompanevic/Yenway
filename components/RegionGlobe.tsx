"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, MotionValue, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { REGION_LIST, Region } from "@/lib/regions";

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
const SPIN = Math.PI * 1.5; // на сколько «раскручиваются» по пути к своему месту
const STAGGER = 0.05;

// Позиция считается из одного общего прогресса — без ре-рендеров React на
// каждом кадре, двигаются только transform/opacity (дёшево для GPU).
function OrbitItem({ region, index, progress, picked, onPick }: {
  region: Region;
  index: number;
  progress: MotionValue<number>;
  picked: boolean;
  onPick: () => void;
}) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / REGION_LIST.length;
  const local = useTransform(progress, (p) => {
    const t = (p - index * STAGGER) / (1 - (REGION_LIST.length - 1) * STAGGER);
    return Math.min(1, Math.max(0, t));
  });
  const x = useTransform(local, (t) => Math.cos(angle - (1 - t) * SPIN) * RADIUS * t);
  const y = useTransform(local, (t) => Math.sin(angle - (1 - t) * SPIN) * RADIUS * t);
  const opacity = useTransform(local, [0, 0.25, 1], [0, 1, 1]);
  const scale = useTransform(local, [0, 1], [0.5, 1]);

  return (
    <motion.div className="absolute left-1/2 top-1/2 will-change-transform" style={{ x, y, opacity, scale }}>
      <Link
        href={`/order?region=${region.key}`}
        onClick={onPick}
        className={`block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-4 py-2 text-xs transition-colors ${
          picked
            ? "bg-accent text-ink border-accent animate-pulse"
            : "border-line bg-ink text-white/80 hover:bg-accent hover:text-ink hover:border-accent"
        }`}
      >
        {region.name}
      </Link>
    </motion.div>
  );
}

export default function RegionGlobe() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Круг не сворачиваем при выборе страны — держим до открытия страницы заказа.
  const [picked, setPicked] = useState<string | null>(null);
  const openRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const reduced = useReducedMotion();

  const discOpacity = useTransform(progress, [0, 0.3], [0, 1]);
  const discScale = useTransform(progress, [0, 1], [0.85, 1]);
  const globeRotate = useTransform(progress, [0, 1], [0, 180]);

  function show() {
    openRef.current = true;
    setOpen(true);
    setMounted(true);
    animate(progress, 1, { duration: reduced ? 0 : 1, ease: [0.33, 1, 0.68, 1] });
  }

  function hide() {
    openRef.current = false;
    setPicked(null);
    setOpen(false);
    animate(progress, 0, { duration: reduced ? 0 : 0.4, ease: "easeIn" }).then(() => {
      if (!openRef.current) setMounted(false);
    });
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) hide();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
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
        onClick={() => (openRef.current ? hide() : show())}
        className={`block py-1 transition-colors hover:text-white ${open ? "text-white" : ""}`}
      >
        <motion.span className="block w-6 h-6" style={{ rotate: globeRotate }}>
          <GlobeIcon className="w-6 h-6" />
        </motion.span>
      </button>

      {mounted && (
        <motion.div
          style={{ opacity: discOpacity, scale: discScale, transformOrigin: "50% 0%" }}
          className="absolute left-1/2 top-full mt-4 -ml-[170px] w-[340px] h-[340px] rounded-full bg-panel/90 backdrop-blur-sm border border-line shadow-2xl z-50"
        >
          <GlobeIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white/20" />
          {REGION_LIST.map((r, i) => (
            <OrbitItem key={r.key} region={r} index={i} progress={progress} picked={picked === r.key} onPick={() => setPicked(r.key)} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
