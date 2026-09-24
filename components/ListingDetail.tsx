import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing, kindOf, LISTING_PATH, type ListingKind } from "@/lib/listings-store";
import ListingGallery from "./ListingGallery";
import BuyButton from "./BuyButton";

const COPY: Record<ListingKind, { back: string; unavailable: string; badge: string; action: string; note: string; meta: string }> = {
  stock: {
    back: "← В наличии",
    badge: "Продано",
    unavailable: "Эта вещь уже продана — загляните в ленту, там есть другие.",
    action: "Хочу купить",
    note: "Покупка проходит через YenWay: мы проверим вещь и свяжемся с вами в Telegram.",
    meta: "В наличии на YenWay."
  },
  preorder: {
    back: "← Под заказ",
    badge: "Недоступно",
    unavailable: "Эту вещь сейчас нельзя заказать — загляните в ленту, там есть другие.",
    action: "Хочу заказать",
    note: "Мы выкупим вещь под вас и свяжемся в Telegram, чтобы уточнить сроки и детали.",
    meta: "Под заказ на YenWay."
  }
};

// Ссылка на товар (sourceUrl) сюда намеренно не передаётся — её видит только админ.
async function load(id: string, kind: ListingKind) {
  const l = await getListing(id).catch(() => undefined);
  return l && l.status !== "pending" && kindOf(l) === kind ? l : undefined;
}

export async function listingMetadata(id: string, kind: ListingKind): Promise<Metadata> {
  const l = await load(id, kind);
  if (!l) return {};
  return {
    title: `${l.title} • ${l.size} — YenWay`,
    description: `${l.condition}, ${l.price.toLocaleString("ru-RU")} ₽. ${COPY[kind].meta}`,
    openGraph: { images: [`/api/stock-photo/${l.id}/0`] }
  };
}

export default async function ListingDetail({ id, kind }: { id: string; kind: ListingKind }) {
  const l = await load(id, kind);
  if (!l) notFound();
  const unavailable = l.status === "sold";
  const copy = COPY[kind];

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <a href={LISTING_PATH[kind]} className="text-white/40 text-sm hover:text-white/70 transition-colors">
        {copy.back}
      </a>
      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className={unavailable ? "opacity-50" : ""}>
          <ListingGallery id={l.id} count={l.photoCount} title={l.title} />
        </div>
        <div>
          {unavailable && (
            <span className="inline-block mb-4 rounded-full border border-line px-3 py-1 font-display text-xs uppercase tracking-wide text-white/60">
              {copy.badge}
            </span>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight break-words">{l.title}</h1>
          <div className="mt-6 space-y-2.5 text-white/70">
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-white/40">Размер</span>
              <span>{l.size}</span>
            </div>
            <div className="flex justify-between border-b border-line pb-2.5">
              <span className="text-white/40">Состояние</span>
              <span>{l.condition}</span>
            </div>
          </div>
          <div className="mt-6 font-display text-3xl font-bold">{l.price.toLocaleString("ru-RU")} ₽</div>
          {l.description && <p className="mt-6 text-white/60 whitespace-pre-line">{l.description}</p>}
          <div className="mt-8">
            {unavailable ? (
              <p className="text-white/50">{copy.unavailable}</p>
            ) : (
              <>
                <BuyButton id={l.id} label={copy.action} />
                <p className="mt-3 text-xs text-white/40">{copy.note}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
