import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/og";
import { JOURNAL_POSTS } from "@/lib/journal";

export async function GET() {
  const posts = await Promise.all(
    JOURNAL_POSTS.map(async (post) => {
      const preview = await fetchLinkPreview(post.url);
      return {
        url: post.url,
        brand: post.brand ?? preview.siteName,
        title: preview.title,
        image: preview.image
      };
    })
  );

  return NextResponse.json({ posts: posts.filter((p) => p.title || p.image) });
}
