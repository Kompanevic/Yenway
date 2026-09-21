"use client";

import { useState } from "react";
import Image from "next/image";
import { REGION_LIST, RegionKey } from "@/lib/regions";

interface Result {
  preview: { title: string | null; image: string | null; price: number | null };
  breakdown: {
    itemPriceLocal: number | null;
    itemPriceRUB: number | null;
    serviceFeeRUB: number | null;
    insuranceRUB: number | null;
    deliveryRUB: number;
    totalRUB: number | null;
    isEstimate: boolean;
  };
  region: { name: string; flag: string; currency: string };
  notified: boolean;
}

export default function OrderForm({ initialRegion }: { initialRegion: RegionKey }) {
  const [region, setRegion] = useState<RegionKey>(initialRegion);
  const [link, setLink] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, username, region })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
      } else {
        setResult(data);
      }
    } catch {
      setError("Не удалось отправить заявку. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">Регион</label>
          <div className="grid grid-cols-5 gap-2">
            {REGION_LIST.map((r) => (
              <button
                type="button"
                key={r.key}
                onClick={() => setRegion(r.key)}
                className={`rounded-xl py-3 text-sm border transition-colors ${
                  region === r.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-white/10 bg-panel text-white/60 hover:border-white/30"
                }`}
              >
                <div className="text-xl">{r.flag}</div>
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Ссылка на товар</label>
          <input
            required
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl bg-panel border border-white/10 px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Ваш ник в Telegram</label>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ivan_petrov"
            className="w-full rounded-xl bg-panel border border-white/10 px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent text-ink py-3 font-semibold hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {loading ? "Считаем..." : "Рассчитать и отправить заявку"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-2xl bg-panel border border-white/10 p-6">
          <div className="flex gap-4">
            {result.preview.image && (
              <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-white/5">
                <Image
                  src={result.preview.image}
                  alt={result.preview.title ?? "Товар"}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div>
              <div className="font-semibold">{result.preview.title ?? "Товар"}</div>
              <div className="text-white/50 text-sm mt-1">
                {result.region.flag} {result.region.name}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            {result.breakdown.isEstimate ? (
              <p className="text-white/60">
                Не удалось автоматически определить цену товара — уточним её вручную и напишем
                вам в Telegram.
              </p>
            ) : (
              <>
                <Row label={`Товар (${result.region.currency})`} value={`${result.breakdown.itemPriceRUB} ₽`} />
                <Row label="Комиссия сервиса" value={`${result.breakdown.serviceFeeRUB} ₽`} />
                <Row label="Страховка" value={`${result.breakdown.insuranceRUB} ₽`} />
                <Row label="Доставка" value={`${result.breakdown.deliveryRUB} ₽`} />
                <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-lg">
                  <span>Итого</span>
                  <span className="text-accent">{result.breakdown.totalRUB} ₽</span>
                </div>
              </>
            )}
          </div>

          <p className="mt-5 text-sm text-white/50">
            {result.notified
              ? "Заявка отправлена! Мы напишем вам в Telegram в ближайшее время."
              : "Заявка принята, но уведомление не отправилось — мы всё равно скоро свяжемся."}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-white/70">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
