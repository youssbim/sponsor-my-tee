import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Admin uploads sponsor logos through a server action.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
