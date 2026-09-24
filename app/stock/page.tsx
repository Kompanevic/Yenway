import ListingFeed from "@/components/ListingFeed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "В наличии — YenWay",
  description: "Оригинальные вещи в наличии: покупка через YenWay с проверкой."
};

export default function StockPage() {
  return <ListingFeed kind="stock" />;
}
