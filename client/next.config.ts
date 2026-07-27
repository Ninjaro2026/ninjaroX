import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ninjaro-x-zcvj.vercel.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
