/** @type {import("next").NextConfig} */
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "/tutor";
const basePath =
  rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

const nextConfig = {
  basePath,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
