"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";

const KEY = "yenway:cookie-consent";
type Consent = "all" | "necessary";

function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

// Согласие на cookie: плашка при первом заходе; аналитика — только после «Принять».
export default function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, []);

  function choose(v: Consent) {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      // без сохранения — спросим в следующий раз
    }
    setConsent(v);
  }

  return (
    <>
      {consent === "all" && <Analytics />}
      {ready && !consent && (
        <div
          role="dialog"
          aria-label="Согласие на использование cookie"
          className="cookie-bar fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none"
        >
          <div className="pointer-events-auto mx-auto max-w-2xl rounded-3xl border border-line bg-panel/95 backdrop-blur p-4 sm:p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:flex sm:items-center sm:gap-5">
            <p className="text-sm text-white/70 leading-relaxed">
              Мы используем cookie и похожие технологии, чтобы сайт работал, и с вашего согласия — для анонимной статистики посещений.
              Подробнее — в{" "}
              <Link href="/privacy" className="text-white underline underline-offset-2 hover:text-accent">
                политике конфиденциальности
              </Link>
              .
            </p>
            <div className="mt-3 sm:mt-0 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => choose("necessary")}
                className="flex-1 sm:flex-none rounded-full border border-line px-4 py-2.5 font-display text-sm text-white/80 hover:border-white/40"
              >
                Только необходимые
              </button>
              <button
                type="button"
                onClick={() => choose("all")}
                className="flex-1 sm:flex-none rounded-full btn-fx bg-accent text-ink px-5 py-2.5 font-display text-sm font-semibold"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
