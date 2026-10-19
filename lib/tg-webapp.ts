"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

// Telegram Mini App: сайт, открытый внутри Telegram (кнопка меню бота или ссылка t.me/<бот>/<app>).
interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { username?: string }; start_param?: string };
  ready(): void;
  expand(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  BackButton: { show(): void; hide(): void; onClick(cb: () => void): void; offClick(cb: () => void): void };
  openTelegramLink(url: string): void;
  openLink(url: string): void;
}

export const TG_READY_EVENT = "tg-webapp-ready";

export function tgWebApp(): TgWebApp | null {
  if (typeof window === "undefined") return null;
  const wa = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
  return wa?.initData ? wa : null;
}

// Подставляет ник из Telegram в поле формы, если оно ещё пустое. Ник виден
// и редактируется в форме, поэтому непроверенных initDataUnsafe тут достаточно.
export function useTgUsername(set: Dispatch<SetStateAction<string>>) {
  useEffect(() => {
    const apply = () => {
      const u = tgWebApp()?.initDataUnsafe.user?.username;
      if (u) set((prev) => prev || u);
    };
    apply();
    window.addEventListener(TG_READY_EVENT, apply);
    return () => window.removeEventListener(TG_READY_EVENT, apply);
  }, [set]);
}
