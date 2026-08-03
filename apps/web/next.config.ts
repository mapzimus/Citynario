import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@citynario/schemas"],
  poweredByHeader: false,
};

export default nextConfig;
