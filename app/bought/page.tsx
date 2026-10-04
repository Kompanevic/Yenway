import ListingFeed from "@/components/ListingFeed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Выкупленные — YenWay",
  description: "Вещи, которые YenWay уже выкупил и привёз клиентам."
};

export default function BoughtPage() {
  return <ListingFeed kind="bought" />;
}
