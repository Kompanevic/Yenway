import ListingFeed from "@/components/ListingFeed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Под заказ — YenWay",
  description: "Оригинальные вещи под заказ: выкупим и привезём через YenWay."
};

export default function PreorderPage() {
  return <ListingFeed kind="preorder" />;
}
