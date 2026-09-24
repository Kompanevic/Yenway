import Link from "next/link";
import { getListings, kindOf, LISTING_PATH, type ListingKind } from "@/lib/listings-store";

const COPY: Record<ListingKind, { title: string; text: string; empty: string }> = {
  stock: {
    title: "В наличии",
    text: "Вещи, которые можно забрать сразу. Покупка проходит через YenWay — мы проверяем каждую сделку.",
    empty: "Пока пусто — выложите первую вещь!"
  },
  preorder: {
    title: "Под заказ",
    text: "Вещи, которые мы выкупим и привезём под вас. Сроки и детали уточним в Telegram.",
    empty: "Скоро здесь появятся вещи под заказ."
  }
};

export default async function ListingFeed({ kind }: { kind: ListingKind }) {
  const items = (await getListings().catch(() => [])).filter((l) => l.status === "published" && kindOf(l) === kind);
  const copy = COPY[kind];

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← на главную
      </a>

      <div className="mt-5 inline-flex rounded-full border border-line p-1 font-display text-sm">
        {(Object.keys(COPY) as ListingKind[]).map((k) => (
          <Link
            key={k}
            href={LISTING_PATH[k]}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              k === kind ? "bg-accent text-ink font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            {COPY[k].title}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-white/50 mt-3 text-lg max-w-xl">{copy.text}</p>
        </div>
        {kind === "stock" && (
          <Link
            href="/stock/new"
            className="font-display rounded-full bg-accent text-ink px-6 py-3 font-semibold hover:bg-accent2 transition-colors"
          >
            Выложить свою вещь
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-panel border border-line p-10 text-center text-white/50">{copy.empty}</div>
      ) : (
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((l) => (
            <Link key={l.id} href={`${LISTING_PATH[kind]}/${l.id}`} className="group block">
              <div className="aspect-square rounded-2xl overflow-hidden border border-line bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/stock-photo/${l.id}/0`}
                  alt={l.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-2.5 font-display text-sm leading-snug line-clamp-2 break-words">
                {l.title}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 align-middle" />
                <span className="text-white/70 whitespace-nowrap">{l.size}</span>
              </div>
              <div className="mt-1 font-display text-sm font-semibold">{l.price.toLocaleString("ru-RU")} ₽</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
