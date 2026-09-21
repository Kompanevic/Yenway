import OrderForm from "@/components/OrderForm";
import { RegionKey, REGIONS } from "@/lib/regions";

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
    <main className="max-w-2xl mx-auto px-6 py-16">
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
      <OrderForm initialRegion={initialRegion} />
    </main>
  );
}
