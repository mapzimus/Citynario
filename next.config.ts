import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = githubPages ? "/Citynario" : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;
