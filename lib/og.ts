export interface LinkPreview {
  title: string | null;
  image: string | null;
  price: number | null;
  siteName: string | null;
}

function getMetaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const re1 = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
      "i"
    );
    const m = html.match(re1) || html.match(re2);
    if (m?.[1]) return m[1];
  }
  return null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return { title: null, image: null, price: null, siteName: null };

    const html = await res.text();

    const title = getMetaContent(html, ["og:title", "twitter:title"]) ??
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
    const image = getMetaContent(html, ["og:image", "twitter:image", "og:image:secure_url"]);
    const siteName = getMetaContent(html, ["og:site_name"]);
    const priceRaw = getMetaContent(html, [
      "og:price:amount",
      "product:price:amount",
      "twitter:data1"
    ]);

    const price = priceRaw ? parseFloat(priceRaw.replace(/[^\d.]/g, "")) : null;

    return {
      title: title ? decodeEntities(title.trim()) : null,
      image: image ? decodeEntities(image.trim()) : null,
      price: price && !Number.isNaN(price) ? price : null,
      siteName: siteName ? decodeEntities(siteName.trim()) : null
    };
  } catch {
    clearTimeout(timeout);
    return { title: null, image: null, price: null, siteName: null };
  }
}
