import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ninjaro-x-or1s-hbdiel76e-ninjaro.vercel.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
