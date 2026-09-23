import Link from "next/link";
import { getListings } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "В наличии — YenWay",
  description: "Оригинальные вещи в наличии: покупка через YenWay с проверкой."
};

export default async function StockPage() {
  const items = (await getListings()).filter((l) => l.status === "published");

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <a href="/" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← на главную
      </a>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">В наличии</h1>
          <p className="text-white/50 mt-3 text-lg max-w-xl">
            Вещи, которые можно забрать сразу. Покупка проходит через YenWay — мы проверяем каждую сделку.
          </p>
        </div>
        <Link
          href="/stock/new"
          className="font-display rounded-full bg-accent text-ink px-6 py-3 font-semibold hover:bg-accent2 transition-colors"
        >
          Выложить свою вещь
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-panel border border-line p-10 text-center text-white/50">
          Пока пусто — выложите первую вещь!
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((l) => (
            <Link key={l.id} href={`/stock/${l.id}`} className="group block">
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
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
