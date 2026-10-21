"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// Telegram Mini App: сайт, открытый внутри Telegram (кнопка меню бота или ссылка t.me/<бот>/<app>).
interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { username?: string; first_name?: string; photo_url?: string }; start_param?: string };
  CloudStorage?: {
    getItem(key: string, cb: (err: unknown, value?: string) => void): void;
    setItem(key: string, value: string, cb?: (err: unknown) => void): void;
  };
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

// Заголовок с подписанными данными Telegram — сервер по нему узнаёт пользователя.
export function tgInitHeaders(): Record<string, string> {
  const wa = tgWebApp();
  return wa ? { "x-tg-init-data": wa.initData } : {};
}

// true — сайт открыт как мини-апп в Telegram.
export function useMiniApp(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(!!tgWebApp());
    check();
    window.addEventListener(TG_READY_EVENT, check);
    return () => window.removeEventListener(TG_READY_EVENT, check);
  }, []);
  return on;
}

// Личные списки (избранное, корзина): в Telegram — облако Telegram
// (синхронно между устройствами), на сайте — память браузера.
export type ListKey = "favorites" | "cart";
export const LIST_EVENT = "yenway-lists";

export async function getList(key: ListKey): Promise<string[]> {
  const cloud = tgWebApp()?.CloudStorage;
  const raw = await new Promise<string | null>((resolve) => {
    if (cloud) cloud.getItem(key, (err, v) => resolve(err ? null : v ?? null));
    else {
      try {
        resolve(localStorage.getItem(`yenway:${key}`));
      } catch {
        resolve(null);
      }
    }
  });
  try {
    const ids = JSON.parse(raw ?? "[]");
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setList(key: ListKey, ids: string[]): Promise<void> {
  const value = JSON.stringify(Array.from(new Set(ids)).slice(0, 100));
  const cloud = tgWebApp()?.CloudStorage;
  await new Promise<void>((resolve) => {
    if (cloud) cloud.setItem(key, value, () => resolve());
    else {
      try {
        localStorage.setItem(`yenway:${key}`, value);
      } catch {
        // без сохранения
      }
      resolve();
    }
  });
  window.dispatchEvent(new Event(LIST_EVENT));
}

// Список в состоянии компонента + переключение элемента.
export function useList(key: ListKey) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () =>
      getList(key).then((v) => {
        setIds(v);
        setReady(true);
      });
    load();
    window.addEventListener(LIST_EVENT, load);
    window.addEventListener(TG_READY_EVENT, load);
    return () => {
      window.removeEventListener(LIST_EVENT, load);
      window.removeEventListener(TG_READY_EVENT, load);
    };
  }, [key]);
  const toggle = (id: string) => setList(key, ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
  const remove = (id: string) => setList(key, ids.filter((x) => x !== id));
  const clear = () => setList(key, []);
  return { ids, ready, has: (id: string) => ids.includes(id), toggle, remove, clear };
}
