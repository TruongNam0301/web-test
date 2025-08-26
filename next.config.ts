import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "standalone",
  optimizeFonts: true,
  compress: true,
  swcMinify: true,
};

export default nextConfig;
