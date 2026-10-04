import Link from "next/link";
import ListingGrid from "./ListingGrid";
import { regionFromUrl } from "@/lib/item-info";
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
  },
  bought: {
    title: "Выкупленные",
    text: "Вещи, которые мы уже выкупили и привезли клиентам. Хотите такую же — найдём и привезём под вас.",
    empty: "Скоро здесь появятся выкупленные вещи."
  }
};

// «Выкупленные» — по дате выкупа (вещь могла долго висеть в «Под заказ»).
const boughtDate = (l: { boughtAt?: string; createdAt: string }) => l.boughtAt ?? l.createdAt;

export default async function ListingFeed({ kind }: { kind: ListingKind }) {
  const items = (await getListings().catch(() => [])).filter((l) => l.status === "published" && kindOf(l) === kind);
  if (kind === "bought") items.sort((a, b) => boughtDate(b).localeCompare(boughtDate(a)));
  const copy = COPY[kind];

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <a href="/" className="block w-fit text-white/40 text-sm hover:text-white/70 transition-colors">
        ← на главную
      </a>

      <div className="mt-5 inline-flex max-w-full overflow-x-auto rounded-full border border-line p-1 font-display text-xs sm:text-sm">
        {(Object.keys(COPY) as ListingKind[]).map((k) => (
          <Link
            key={k}
            href={LISTING_PATH[k]}
            className={`whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 transition-colors ${
              k === kind ? "bg-accent text-ink font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            {COPY[k].title}
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl min-[360px]:text-4xl sm:text-5xl font-bold tracking-tight break-words">{copy.title}</h1>
          <p className="text-white/50 mt-3 text-lg max-w-xl">{copy.text}</p>
        </div>
        {kind === "stock" && (
          <Link
            href="/stock/new"
            className="font-display rounded-full btn-fx bg-accent text-ink px-6 py-3 font-semibold hover:bg-accent2 transition-colors"
          >
            Выложить свою вещь
          </Link>
        )}
      </div>

      {/* В клиент уходят только поля карточки — без ссылки на товар и прочего. */}
      <ListingGrid
        items={items.map(({ id, title, size, price, photoCount, region, sourceUrl }) => ({
          id,
          title,
          size,
          price,
          photoCount,
          // Флажок страны — «под заказ» и «выкупленные»; сама ссылка в клиент не уходит.
          ...(kind !== "stock" ? { region: region ?? regionFromUrl(sourceUrl) } : {})
        }))}
        basePath={LISTING_PATH[kind]}
        emptyText={copy.empty}
        {...(kind === "bought" ? { badge: "Выкуплено", pricePrefix: "за " } : {})}
      />
    </main>
  );
}
