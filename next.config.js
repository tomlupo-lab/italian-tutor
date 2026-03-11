/** @type {import("next").NextConfig} */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/tutor";
const normalizedBasePath =
  rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");
const devRewriteBasePath =
  process.env.NODE_ENV === "development" ? normalizedBasePath : "";

const nextConfig = {
  basePath: devRewriteBasePath ? "" : normalizedBasePath,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ],
  async rewrites() {
    if (!devRewriteBasePath) return [];
    return [
      { source: `${devRewriteBasePath}`, destination: "/" },
      { source: `${devRewriteBasePath}/:path*`, destination: "/:path*" },
    ];
  },
};

module.exports = nextConfig;
