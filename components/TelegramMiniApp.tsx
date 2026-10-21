"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TG_READY_EVENT, tgWebApp } from "@/lib/tg-webapp";
import { LISTING_PATH, type ListingKind } from "@/lib/listing-constants";

const FLAG = "yenway:tg-miniapp";
const BG = "#0a0a0b";

// Включается только внутри Telegram: Telegram передаёт tgWebAppData в адресе
// при открытии мини-аппа. Обычным посетителям скрипт Telegram не грузится.
export default function TelegramMiniApp() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let inTelegram = window.location.hash.includes("tgWebAppData");
    try {
      if (inTelegram) sessionStorage.setItem(FLAG, "1");
      else inTelegram = sessionStorage.getItem(FLAG) === "1";
    } catch {
      // без sessionStorage — определяем только по адресу
    }
    if (!inTelegram || tgWebApp()) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const wa = tgWebApp();
      if (!wa) return;
      wa.ready();
      wa.expand();
      wa.setHeaderColor?.(BG);
      wa.setBackgroundColor?.(BG);
      document.documentElement.classList.add("tg-app");
      window.dispatchEvent(new Event(TG_READY_EVENT));
      // Открыли по кнопке из канала: startapp=<раздел>_<id> → сразу на вещь.
      // Или на раздел: startapp=order / preorder / stock / bought.
      const start = wa.initDataUnsafe.start_param ?? "";
      const m = /^(stock|preorder|bought)_([\w-]{8,64})$/.exec(start);
      if (m) router.replace(`${LISTING_PATH[m[1] as ListingKind]}/${m[2]}`);
      else if (start === "order") router.replace("/order");
      else if (start in LISTING_PATH) router.replace(LISTING_PATH[start as ListingKind]);
      // Первый экран приложения — лента.
      else if (window.location.pathname === "/") router.replace("/preorder");
    };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ссылки: t.me — внутри Telegram, внешние сайты — во встроенном браузере.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const wa = tgWebApp();
      if (!wa || e.defaultPrevented) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a?.href) return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin) return;
      e.preventDefault();
      if (url.hostname === "t.me") wa.openTelegramLink(url.href);
      else wa.openLink(url.href);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Кнопка «Назад» Telegram — на всех страницах, кроме главной.
  useEffect(() => {
    const apply = () => {
      const wa = tgWebApp();
      if (!wa) return;
      const back = () => router.back();
      if (pathname === "/") {
        wa.BackButton.hide();
        return;
      }
      wa.BackButton.show();
      wa.BackButton.onClick(back);
      return () => wa.BackButton.offClick(back);
    };
    let cleanup = apply();
    const onReady = () => {
      cleanup?.();
      cleanup = apply();
    };
    window.addEventListener(TG_READY_EVENT, onReady);
    return () => {
      window.removeEventListener(TG_READY_EVENT, onReady);
      cleanup?.();
    };
  }, [pathname, router]);

  return null;
}
