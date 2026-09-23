import { notFound } from "next/navigation";
import { getListing } from "@/lib/listings-store";
import ListingGallery from "@/components/ListingGallery";
import BuyButton from "@/components/BuyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const l = await getListing(params.id);
  if (!l || l.status === "pending") return {};
  return {
    title: `${l.title} • ${l.size} — YenWay`,
    description: `${l.condition}, ${l.price.toLocaleString("ru-RU")} ₽. В наличии на YenWay.`,
    openGraph: { images: [`/api/stock-photo/${l.id}/0`] }
  };
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const l = await getListing(params.id);
  if (!l || l.status === "pending") notFound();
  const sold = l.status === "sold";

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <a href="/stock" className="text-white/40 text-sm hover:text-white/70 transition-colors">
        ← В наличии
      </a>
      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div className={sold ? "opacity-50" : ""}>
          <ListingGallery id={l.id} count={l.photoCount} title={l.title} />
        </div>
        <div>
          {sold && (
            <span className="inline-block mb-4 rounded-full border border-line px-3 py-1 font-display text-xs uppercase tracking-wide text-white/60">
              Продано
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
            {sold ? (
              <p className="text-white/50">Эта вещь уже продана — загляните в ленту, там есть другие.</p>
            ) : (
              <>
                <BuyButton id={l.id} />
                <p className="mt-3 text-xs text-white/40">
                  Покупка проходит через YenWay: мы проверим вещь и свяжемся с вами в Telegram.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
