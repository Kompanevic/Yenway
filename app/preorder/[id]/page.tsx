import ListingDetail, { listingMetadata } from "@/components/ListingDetail";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }) {
  return listingMetadata(params.id, "preorder");
}

export default function PreorderItemPage({ params }: { params: { id: string } }) {
  return <ListingDetail id={params.id} kind="preorder" />;
}
