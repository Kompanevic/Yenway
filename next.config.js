/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }, { protocol: "http", hostname: "**" }]
  },
  async headers() {
    return [
      {
        source: "/:path*.(mp4|jpg|jpeg|png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  }
};

module.exports = nextConfig;
