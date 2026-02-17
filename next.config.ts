import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
        },
      ],
    },
  ],
};

export default nextConfig;
