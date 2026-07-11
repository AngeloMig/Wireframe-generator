import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the live development cache separate from production builds. Running
  // `next build` while the preview is open must not invalidate dev manifests.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // A stray package-lock.json in the home directory makes Next.js infer the
  // wrong workspace root, so pin it to this project.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
