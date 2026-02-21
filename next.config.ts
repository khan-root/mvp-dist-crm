import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose"],
  // Add this to help with debugging
  productionBrowserSourceMaps: true,
  // Ensure API routes don't return HTML
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
