import OrderForm from "@/components/OrderForm";
import { RegionKey, REGIONS, REGION_LIST } from "@/lib/regions";
import { DELIVERY_FLAT_RUB, SERVICE_FEE_PERCENT, INSURANCE_PERCENT } from "@/lib/pricing";

const deliveryValues = Object.values(DELIVERY_FLAT_RUB);
const minDelivery = Math.min(...deliveryValues);
const maxDelivery = Math.max(...deliveryValues);

export default function OrderPage({
  searchParams
}: {
  searchParams: { region?: string };
}) {
  const initialRegion: RegionKey =
    searchParams.region && searchParams.region in REGIONS
      ? (searchParams.region as RegionKey)
      : "japan";

  return (
    <main>
      <div className="max-w-2xl mx-auto px-6 pt-12">
        <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
          ← на главную
        </a>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-5 tracking-tight">
          Оформить заказ
        </h1>
        <p className="text-white/50 mt-3 text-lg">
          Вставьте ссылку на товар и укажите ник в Telegram — мы рассчитаем стоимость и свяжемся с
          вами.
        </p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            ["Страховка", "включена"],
            ["Расчёт", "за секунды"],
            ["Связь", "в Telegram"],
            ["Регионов", "5"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-panel border border-line py-3 px-2">
              <div className="font-display text-sm font-semibold">{value}</div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full h-[30vh] min-h-[200px] max-h-[340px] mt-14 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-70"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/10 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xs sm:text-sm tracking-[0.4em] uppercase text-white/80 bg-ink/30 px-5 py-2.5 backdrop-blur-sm rounded-full border border-white/10">
            Original Brands · Worldwide
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 pt-14 grid lg:grid-cols-[1.1fr,0.9fr] gap-14">
        <OrderForm initialRegion={initialRegion} />

        <aside className="space-y-8 lg:pt-1">
          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-white/40 mb-4">
              Что входит в стоимость
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between rounded-xl bg-panel border border-line px-4 py-3">
                <span className="text-white/60">Комиссия сервиса</span>
                <span className="font-semibold">{SERVICE_FEE_PERCENT}%</span>
              </li>
              <li className="flex justify-between rounded-xl bg-panel border border-line px-4 py-3">
                <span className="text-white/60">Страховка посылки</span>
                <span className="font-semibold">{INSURANCE_PERCENT}%</span>
              </li>
              <li className="flex justify-between rounded-xl bg-panel border border-line px-4 py-3">
                <span className="text-white/60">Доставка</span>
                <span className="font-semibold">
                  {minDelivery.toLocaleString("ru-RU")}–{maxDelivery.toLocaleString("ru-RU")} ₽
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-white/40 mb-4">
              Как это работает
            </h2>
            <ol className="space-y-3 text-sm text-white/60">
              <li className="flex gap-3">
                <span className="font-display text-accent shrink-0">01</span>
                Вставляете ссылку и ник в Telegram
              </li>
              <li className="flex gap-3">
                <span className="font-display text-accent shrink-0">02</span>
                Видите фото товара и расчёт стоимости
              </li>
              <li className="flex gap-3">
                <span className="font-display text-accent shrink-0">03</span>
                Мы пишем вам в Telegram и оформляем заказ
              </li>
            </ol>
          </div>

          <div>
            <h2 className="font-display text-sm uppercase tracking-wide text-white/40 mb-4">
              Площадки
            </h2>
            <div className="flex flex-wrap gap-2">
              {REGION_LIST.flatMap((r) => r.platforms.slice(0, 2)).map((p, i) => (
                <a
                  key={p.name + i}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs rounded-full bg-panel border border-line px-3 py-1.5 text-white/50 hover:bg-accent hover:text-ink hover:border-accent transition-colors"
                >
                  {p.name}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
