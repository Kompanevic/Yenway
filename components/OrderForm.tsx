"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { REGIONS, REGION_LIST, RegionKey } from "@/lib/regions";
import { CHINA_DELIVERY_TIERS, isManualRegion } from "@/lib/pricing";

interface Result {
  preview: { title: string | null; image: string | null; price: number | null };
  breakdown: {
    itemPriceLocal: number | null;
    itemPriceRUB: number | null;
    commissionRUB: number | null;
    insuranceRUB: number | null;
    serviceFeeRUB: number | null;
    deliveryRUB: number | null;
    deliveryDays: string | null;
    totalRUB: number | null;
    hasIndividualParts: boolean;
    isEstimate: boolean;
  } | null;
  manual: boolean;
  managerTelegram: string;
  region: { name: string; flag: string; currency: string };
  notified: boolean;
}

function regionFromParam(v: string | null): RegionKey {
  return v && Object.prototype.hasOwnProperty.call(REGIONS, v) ? (v as RegionKey) : "japan";
}

// Регион читается из ссылки в браузере — так страница заказа статическая
// и открывается мгновенно с CDN, без сборки на сервере.
export default function OrderForm() {
  const param = useSearchParams().get("region");
  const [region, setRegion] = useState<RegionKey>(() => regionFromParam(param));

  useEffect(() => {
    setRegion(regionFromParam(param));
  }, [param]);
  const [link, setLink] = useState("");
  const [username, setUsername] = useState("");
  const [weight, setWeight] = useState("");
  const [chinaTier, setChinaTier] = useState(CHINA_DELIVERY_TIERS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const manual = isManualRegion(region);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link,
          username,
          region,
          weightKg: weight ? parseFloat(weight) : null,
          chinaTier
        })
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

  const b = result?.breakdown;

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Регион
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {REGION_LIST.map((r) => (
              <motion.button
                type="button"
                key={r.key}
                onClick={() => setRegion(r.key)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-2xl py-3 text-sm border transition-colors ${
                  region === r.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-panel text-white/60 hover:border-white/30"
                }`}
              >
                <div className="text-xl">{r.flag}</div>
                <span className="font-display">{r.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Ссылка на товар
          </label>
          <input
            required
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-2xl bg-panel border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
            Ваш ник в Telegram
          </label>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ivan_petrov"
            className="w-full rounded-2xl bg-panel border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
          />
        </div>

        {!manual && (
          <div>
            <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
              Примерный вес, кг
            </label>
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="например: 0.5"
              className="w-full rounded-2xl bg-panel border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
            />
          </div>
        )}

        {region === "china" && !manual && (
          <div>
            <label className="block font-display text-xs uppercase tracking-wide text-white/50 mb-2">
              Скорость доставки
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHINA_DELIVERY_TIERS.map((t) => (
                <motion.button
                  type="button"
                  key={t.id}
                  onClick={() => setChinaTier(t.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-2xl py-2.5 px-1 text-center border transition-colors ${
                    chinaTier === t.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line bg-panel text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="font-display text-xs font-semibold">{t.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{t.ratePerKg} ₽/кг</div>
                  <div className="text-[11px] text-white/40">{t.days}</div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="font-display w-full rounded-2xl bg-accent text-ink py-4 font-semibold text-lg hover:bg-accent2 transition-colors disabled:opacity-50"
        >
          {loading ? "Считаем..." : "Рассчитать и отправить заявку"}
        </motion.button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 rounded-3xl bg-panel border border-line p-7"
          >
            <div className="flex gap-4">
              {result.preview.image && (
                <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.preview.image}
                    alt={result.preview.title ?? "Товар"}
                    className="absolute inset-0 w-full h-full object-cover"
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

            <div className="mt-6 space-y-2.5 text-sm">
              {result.manual ? (
                <p className="text-white/60">
                  По этому региону расчёт делает менеджер вручную. Заявка уже у нас — для
                  ускорения можете сразу написать{" "}
                  <a
                    href={`https://t.me/${result.managerTelegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-2"
                  >
                    @{result.managerTelegram}
                  </a>
                  , приложив ссылку на товар.
                </p>
              ) : b ? (
                <>
                  <Row
                    label={`Товар (${result.region.currency})`}
                    value={b.itemPriceRUB != null ? `${b.itemPriceRUB} ₽` : "уточняется вручную"}
                  />
                  <Row
                    label="Комиссия"
                    value={b.commissionRUB != null ? `${b.commissionRUB} ₽` : "уточняется"}
                  />
                  {b.serviceFeeRUB != null && <Row label="Сервис" value={`${b.serviceFeeRUB} ₽`} />}
                  <Row
                    label="Страховка"
                    value={b.insuranceRUB != null ? `${b.insuranceRUB} ₽` : "уточняется"}
                  />
                  <Row
                    label="Доставка"
                    value={
                      b.deliveryRUB != null
                        ? `${b.deliveryRUB} ₽${b.deliveryDays ? ` · ${b.deliveryDays}` : ""}`
                        : "укажите вес"
                    }
                  />
                  <div className="pt-3 mt-3 border-t border-line flex justify-between font-display font-bold text-xl">
                    <span>Итого{b.hasIndividualParts || b.isEstimate ? "*" : ""}</span>
                    <span className="text-accent">
                      {b.totalRUB != null ? `${b.totalRUB} ₽` : "уточним вручную"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {b.isEstimate && "* точную цену товара уточним вручную и напишем вам в Telegram. "}
                    {!b.isEstimate && b.hasIndividualParts && "* часть пунктов рассчитывается индивидуально. "}
                    Возможны таможенные пошлины — около 15% от суммы заказа, оплачиваются
                    дополнительно.
                  </p>
                </>
              ) : null}
            </div>

            <p className="mt-6 text-sm text-white/50">
              {result.notified
                ? "Заявка отправлена! Мы напишем вам в Telegram в ближайшее время."
                : `Не удалось передать заявку менеджеру — напишите, пожалуйста, @${result.managerTelegram} и пришлите ссылку на товар.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
