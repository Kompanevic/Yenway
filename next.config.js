/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Файл читается через fs — явно включаем его в бандл функции на Vercel.
    outputFileTracingIncludes: { "/api/admin/wallpaper": ["./private/admin-wallpaper.jpg"] }
  },
  async headers() {
    return [
      {
        source: "/:path*.(mp4|jpg|jpeg|png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
      }
    ];
  }
};

module.exports = nextConfig;
