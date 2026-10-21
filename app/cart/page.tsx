"use client";

import { useState } from "react";
import Link from "next/link";
import { tgInitHeaders, useList, useTgUsername } from "@/lib/tg-webapp";
import { ItemRow, usePublicItems } from "@/components/ListingPreviewList";

export default function CartPage() {
  const cart = useList("cart");
  const items = usePublicItems(cart.ids, cart.ready);
  const [username, setUsername] = useState("");
  useTgUsername(setUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const available = (items ?? []).filter((i) => !i.unavailable);
  const total = available.reduce((s, i) => s + i.price, 0);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tgInitHeaders() },
        body: JSON.stringify({ ids: available.map((i) => i.id), username })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Не удалось отправить");
      setSent(`Заявка отправлена: ${d.count} шт. на ${Number(d.total).toLocaleString("ru-RU")} ₽. Менеджер напишет вам в Telegram.`);
      await cart.clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-28">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Корзина</h1>
      {sent && <p className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-300/5 p-4 text-sm">{sent}</p>}
      <div className="mt-8 space-y-2">
        {items === null ? (
          <div className="h-20 rounded-2xl shimmer" />
        ) : items.length === 0 ? (
          !sent && (
            <p className="text-white/50">
              Корзина пуста — <Link href="/preorder" className="underline">выберите вещи в ленте</Link>.
            </p>
          )
        ) : (
          items.map((i) => <ItemRow key={i.id} item={i} onRemove={() => cart.remove(i.id)} removeLabel="Убрать из корзины" />)
        )}
      </div>

      {available.length > 0 && (
        <div className="mt-8 rounded-3xl border border-line bg-panel p-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-white/50">Итого, {available.length} шт.</span>
            <span className="font-display text-2xl font-bold">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ваш ник в Telegram"
            className="w-full rounded-2xl bg-ink border border-line px-4 py-3 outline-none focus:border-accent"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={checkout}
            disabled={loading}
            className="w-full font-display rounded-2xl btn-fx bg-accent text-ink py-3.5 font-semibold hover:bg-accent2 disabled:opacity-50"
          >
            {loading ? "Отправляем..." : "Оформить заявку"}
          </button>
          <p className="text-xs text-white/40">Оплата после подтверждения менеджером в Telegram.</p>
        </div>
      )}
    </main>
  );
}
