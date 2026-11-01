"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { REGIONS, REGION_LIST, RegionKey } from "@/lib/regions";
import Flag from "./Flag";
import { tgInitHeaders, useTgUsername } from "@/lib/tg-webapp";
import { CURRENCY_REGION, calculatePrice, deliveryRateLabel, isManualRegion, type Currency } from "@/lib/pricing";

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
    markupRUB: number | null;
    totalRUB: number | null;
    hasIndividualParts: boolean;
    isEstimate: boolean;
  } | null;
  manual: boolean;
  managerTelegram: string;
  region: { key: RegionKey; name: string; flag: string; currency: string };
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
  useTgUsername(setUsername);
  // Цена на площадке в её валюте — если сайт не отдаёт цену, клиент вписывает сам.
  const [price, setPrice] = useState("");
  // Клиент сам поправил цену — автоподстановка её больше не перезаписывает.
  const priceTouched = useRef(false);
  const [found, setFound] = useState<{ title: string | null; image: string | null } | null>(null);
  const [lookup, setLookup] = useState<"idle" | "loading" | "found" | "missing">("idle");

  // Вставили ссылку — сразу подтягиваем название, фото и цену с сайта.
  useEffect(() => {
    const url = link.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(url)) {
      setLookup("idle");
      setFound(null);
      return;
    }
    // Новая ссылка — новая вещь: цену снова подставляем сами.
    priceTouched.current = false;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLookup("loading");
      try {
        const res = await fetch("/api/price-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const d = (await res.json()) as { title?: string | null; image?: string | null; price?: number | null; currency?: Currency | null };
        if (cancelled) return;
        setFound(res.ok && (d.title || d.image) ? { title: d.title ?? null, image: d.image ?? null } : null);
        if (res.ok && d.currency) setRegion(CURRENCY_REGION[d.currency]);
        if (res.ok && d.price) {
          setLookup("found");
          if (!priceTouched.current) setPrice(String(d.price));
        } else setLookup("missing");
      } catch {
        if (!cancelled) setLookup("missing");
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [link]);
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
        headers: { "Content-Type": "application/json", ...tgInitHeaders() },
        body: JSON.stringify({
          link,
          username,
          region,
          manualPrice: priceNum,
          title: found?.title ?? undefined,
          image: found?.image ?? undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так");
      } else {
        setResult(data);
        // Цену, которую нашли на странице, показываем в поле — её можно поправить.
        if (!priceNum && data.breakdown?.itemPriceLocal) setPrice(String(data.breakdown.itemPriceLocal));
      }
    } catch {
      setError("Не удалось отправить заявку. Проверьте соединение.");
    } finally {
      setLoading(false);
    }
  }

  const priceNum = parseFloat(price.replace(",", ".").replace(/\s/g, "")) > 0 ? parseFloat(price.replace(",", ".").replace(/\s/g, "")) : null;
  // После расчёта цену можно поменять — итог пересчитывается сразу, без новой заявки.
  const b = useMemo(() => {
    const base = result?.breakdown;
    if (!base || !result || priceNum == null || priceNum === base.itemPriceLocal) return base;
    return calculatePrice(priceNum, result.region.key, link, null);
  }, [result, priceNum, link]);

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
                <Flag region={r.key} className="block mx-auto w-[1.35em] h-[0.9em] rounded-[2px] text-xl" />
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
              Цена на сайте, {REGIONS[region].currency}
            </label>
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => {
                priceTouched.current = true;
                setPrice(e.target.value.replace(/[^\d.,\s]/g, ""));
              }}
              placeholder={lookup === "loading" ? "ищем цену на сайте…" : "например: 12000"}
              className="w-full rounded-2xl bg-panel border border-line px-4 py-3.5 outline-none focus:border-accent transition-colors"
            />
            <p className="mt-2 text-xs text-white/40">
              {lookup === "loading"
                ? "Смотрим страницу товара…"
                : lookup === "found"
                  ? "Цена подставлена с сайта — если неверная, исправьте."
                  : lookup === "missing"
                    ? "Сайт не отдал цену — впишите её вручную."
                    : "Вставьте ссылку — цена подставится сама."}
            </p>
            {found && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-panel p-2.5">
                {found.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={found.image} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                )}
                <span className="text-sm text-white/70 line-clamp-2">{found.title ?? "Товар"}</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          type="submit"
          disabled={loading}
          className="font-display w-full rounded-2xl btn-fx bg-accent text-ink py-4 font-semibold text-lg hover:bg-accent2 transition-colors disabled:opacity-50"
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
                <div className="text-white/50 text-sm mt-1 flex items-center gap-2">
                  <Flag region={result.region.key} className="w-[1.35em] h-[0.9em] rounded-[2px] shrink-0" /> {result.region.name}
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
                  <div className="flex items-center justify-between gap-3 text-white/70">
                    <span>Цена на сайте</span>
                    <span className="flex items-center gap-2">
                      <input
                        inputMode="decimal"
                        value={price}
                        onChange={(e) => {
                          priceTouched.current = true;
                          setPrice(e.target.value.replace(/[^\d.,\s]/g, ""));
                        }}
                        placeholder="впишите"
                        aria-label={`Цена на сайте, ${result.region.currency}`}
                        className="w-28 rounded-xl bg-ink border border-line px-3 py-1.5 text-right outline-none focus:border-accent transition-colors"
                      />
                      <span className="text-white/40">{result.region.currency}</span>
                    </span>
                  </div>
                  <Row
                    label={`Товар (${result.region.currency})`}
                    value={b.itemPriceRUB != null ? `${b.itemPriceRUB} ₽` : "впишите цену выше"}
                  />
                  <Row
                    label="Комиссия"
                    value={b.commissionRUB != null ? (result.region.key === "japan" ? `до ${b.commissionRUB} ₽` : `${b.commissionRUB} ₽`) : "уточняется"}
                  />
                  {b.serviceFeeRUB != null && <Row label="Сервис" value={`${b.serviceFeeRUB} ₽`} />}
                  <Row
                    label="Страховка"
                    value={b.insuranceRUB != null ? `${b.insuranceRUB} ₽` : "уточняется"}
                  />
                  <Row
                    label="Доставка"
                    value={`отдельно${deliveryRateLabel(result.region.key) ? ` · ${deliveryRateLabel(result.region.key)}` : ""}`}
                  />
                  {b.markupRUB != null && <Row label="Сбор сервиса 8%" value={`${b.markupRUB} ₽`} />}
                  <div className="pt-3 mt-3 border-t border-line flex justify-between font-display font-bold text-xl">
                    <span>Итого*</span>
                    <span className="text-accent">
                      {b.totalRUB != null ? `${b.totalRUB} ₽` : "уточним вручную"}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {b.isEstimate && "* точную цену товара уточним вручную и напишем вам в Telegram. "}
                    {!b.isEstimate && "* без доставки — она оплачивается отдельно по весу. "}
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
