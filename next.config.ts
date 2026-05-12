import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  // BASE_PATH is injected by the GitHub Actions workflow as the repo name (e.g. /rpg-ai).
  // Leave empty for local dev (npm run dev / npm run build without the env var).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  images: { unoptimized: true },
};

export default config;
