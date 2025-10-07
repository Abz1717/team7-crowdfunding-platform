import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ❌ Disables ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ❌ Skips type checking errors (optional)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ybtwbobuezbilcxxftsd.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
