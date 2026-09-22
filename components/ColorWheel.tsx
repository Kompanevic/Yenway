"use client";

import { motion } from "framer-motion";

const STOPS = [
  "#f7c9c9",
  "#f7dfc4",
  "#f3f0b8",
  "#c9e8c0",
  "#bfe3e0",
  "#c3d7f0",
  "#d3c6ef",
  "#f0c6e3",
  "#f7c9c9"
];

const GRADIENT = `conic-gradient(${STOPS.map((c, i) => `${c} ${(i / (STOPS.length - 1)) * 360}deg`).join(", ")})`;

export default function ColorWheel() {
  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 w-1/2 hidden lg:flex items-center justify-center overflow-hidden">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        className="rounded-full"
        style={{
          width: "58vw",
          height: "58vw",
          maxWidth: 900,
          maxHeight: 900,
          background: GRADIENT,
          opacity: 0.16,
          filter: "blur(1px)"
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 70, ease: "linear" }}
        className="absolute rounded-full border border-white/10"
        style={{ width: "70vw", height: "70vw", maxWidth: 1080, maxHeight: 1080 }}
      />
    </div>
  );
}
