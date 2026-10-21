"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MANAGER_TELEGRAM } from "@/lib/pricing";
import { plural } from "@/lib/plural";
import { tgInitHeaders, tgWebApp, useList, useMiniApp } from "@/lib/tg-webapp";
import { REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, type CustomerRequestView as CustomerRequest } from "@/lib/request-constants";

type Me = { user: { id: number; username?: string; first_name?: string; last_name?: string; photo_url?: string }; requests: CustomerRequest[]; items?: SellerItem[] };
type SellerItem = { id: string; title: string; size: string; price: number; kind: string; status: string; earning: number; payout: "due" | "paid" | null };

const STATUS_STYLE: Record<string, string> = {
  new: "border-white/20 text-white/70",
  accepted: "border-sky-300/40 text-sky-200",
  bought: "border-amber-300/40 text-amber-200",
  shipping: "border-violet-300/40 text-violet-200",
  delivered: "border-emerald-300/40 text-emerald-200",
  canceled: "border-red-400/30 text-red-300/80"
};

export default function ProfilePage() {
  const miniApp = useMiniApp();
  const fav = useList("favorites");
  const cart = useList("cart");
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!miniApp) return;
    fetch("/api/me", { headers: tgInitHeaders() })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "Не удалось загрузить профиль");
        setMe(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [miniApp]);

  if (!miniApp) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-28 text-center">
        <h1 className="font-display text-3xl font-bold">Профиль</h1>
        <p className="mt-4 text-white/50">
          Профиль, заявки и статусы заказов доступны в приложении YenWay в Telegram — без регистрации, по вашему аккаунту
          Telegram.
        </p>
        <a href="https://t.me/yenwayjapan" className="mt-8 inline-block font-display rounded-full btn-fx bg-accent text-ink px-7 py-3 font-semibold">
          Открыть в Telegram
        </a>
      </main>
    );
  }

  const u = me?.user ?? tgWebApp()?.initDataUnsafe.user;
  const name = [me?.user.first_name, me?.user.last_name].filter(Boolean).join(" ") || u?.first_name || "Профиль";
  const requests = me?.requests ?? [];
  const items = me?.items ?? [];
  const sales = items.filter((i) => i.kind === "bought").length;
  const due = items.filter((i) => i.payout === "due").reduce((s, i) => s + i.earning, 0);
  const paid = items.filter((i) => i.payout === "paid").reduce((s, i) => s + i.earning, 0);
  const activeCount = requests.filter((r) => r.status !== "delivered" && r.status !== "canceled").length;
  const row = "flex items-center justify-between px-5 py-4 border-b border-line/60 last:border-b-0 hover:bg-white/[0.03] transition-colors";

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 pt-8 pb-28 space-y-4">
      <section className="rounded-3xl border border-line bg-gradient-to-br from-white/[0.07] to-transparent p-5 flex items-center gap-4">
        {u?.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.photo_url} alt="" className="w-16 h-16 rounded-full object-cover ring-1 ring-white/20" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center font-display text-xl">{name.slice(0, 1)}</div>
        )}
        <div className="min-w-0">
          <div className="font-display text-xl font-bold truncate">{name}</div>
          {u?.username && <div className="text-sm text-white/50">@{u.username}</div>}
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2 text-center">
        {(
          [
            [requests.length, plural(requests.length, ["заявка", "заявки", "заявок"])],
            [activeCount, plural(activeCount, ["активная", "активные", "активных"])],
            [fav.ids.length, "в избранном"],
            [cart.ids.length, "в корзине"]
          ] as [number, string][]
        ).map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-line bg-panel/80 py-3">
            <div className="font-display text-xl font-bold">{v}</div>
            <div className="text-[10px] text-white/45 mt-0.5">{l}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-line bg-panel/80 overflow-hidden font-display text-sm">
        <Link href="/sell" className={row}>Выложить свою вещь <span className="text-accent">+</span></Link>
        <Link href="/favorites" className={row}>Избранное <span className="text-white/30">→</span></Link>
        <Link href="/cart" className={row}>Корзина <span className="text-white/30">→</span></Link>
        <Link href="/search" className={row}>Найти вещь по фото <span className="text-white/30">→</span></Link>
        <Link href="/bought" className={row}>Уже выкупили <span className="text-white/30">→</span></Link>
        <Link href="/reviews" className={row}>Отзывы <span className="text-white/30">→</span></Link>
        <a href={`https://t.me/${MANAGER_TELEGRAM}`} className={row}>Написать менеджеру <span className="text-white/30">→</span></a>
      </section>

      {items.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold mt-6 mb-3">Мои вещи</h2>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="rounded-2xl border border-line bg-panel/80 py-3">
              <div className="font-display text-xl font-bold">{sales}</div>
              <div className="text-[10px] text-white/45 mt-0.5">{plural(sales, ["продажа", "продажи", "продаж"])}</div>
            </div>
            <div className="rounded-2xl border border-amber-300/30 bg-panel/80 py-3">
              <div className="font-display text-xl font-bold">{due.toLocaleString("ru-RU")} ₽</div>
              <div className="text-[10px] text-white/45 mt-0.5">к выплате</div>
            </div>
            <div className="rounded-2xl border border-emerald-300/30 bg-panel/80 py-3">
              <div className="font-display text-xl font-bold">{paid.toLocaleString("ru-RU")} ₽</div>
              <div className="text-[10px] text-white/45 mt-0.5">выплачено</div>
            </div>
          </div>
          <div className="space-y-2">
            {items.map((it) => (
              <Link key={it.id} href={`/${it.kind}/${it.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-panel/80 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/stock-photo/${it.id}/0`} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold truncate">{it.title}</div>
                  <div className="text-xs text-white/40">
                    {it.price.toLocaleString("ru-RU")} ₽ · ваш заработок {it.earning.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-white/60">
                  {it.payout === "paid" ? "Выплачено" : it.payout === "due" ? "К выплате" : it.status === "sold" ? "Снята" : "В продаже"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-bold mt-6 mb-3">Мои заявки</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!me && !error ? (
          <div className="h-16 rounded-2xl shimmer" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-white/50">Пока нет заявок. Рассчитайте вещь или нажмите «Хочу купить» — заявка появится здесь со статусом.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-panel/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-white/40">{REQUEST_TYPE_LABEL[r.type]}</div>
                    <div className="font-display text-sm font-semibold mt-0.5 line-clamp-2">{r.title}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${STATUS_STYLE[r.status]}`}>{REQUEST_STATUS_LABEL[r.status]}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>{new Date(r.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</span>
                  {r.price ? <span>{r.price.toLocaleString("ru-RU")} ₽</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
