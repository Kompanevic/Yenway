"use client";

import { MotionConfig, motion } from "framer-motion";

// Плавное появление при переходе между страницами. Только opacity — transform
// у обёртки сломал бы position: fixed внутри страниц.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        {children}
      </motion.div>
    </MotionConfig>
  );
}
