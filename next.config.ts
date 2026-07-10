import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/wines/:path*\\.:ext(jpg|jpeg|png|webp|gif|avif|heic|heif)",
        destination: "/wine-images/:path*.:ext",
      },
    ];
  },
};

export default nextConfig;
