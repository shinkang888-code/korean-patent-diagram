import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ["@neondatabase/serverless"],
  },
};

export default nextConfig;
