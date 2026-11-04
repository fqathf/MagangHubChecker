import type { NextConfig } from "next";

const isGithubPages =
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.DEPLOY_TARGET === "gh-pages" ||
  Boolean(process.env.NEXT_PUBLIC_BASE_PATH);
const repoName = "MagangHubChecker";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.kemnaker.go.id",
      },
      {
        protocol: "https",
        hostname: "**.aliyuncs.com",
      },
    ],
  },
};

export default nextConfig;
