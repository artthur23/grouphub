import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  serverExternalPackages: ["@whiskeysockets/baileys", "pino", "pino-pretty"],
  webpack: (config) => {
    config.externals.push("bufferutil", "utf-8-validate");
    return config;
  },
};

export default nextConfig;
