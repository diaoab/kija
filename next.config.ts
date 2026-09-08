import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche le site (surtout /admin) d'être chargé dans une iframe tierce —
  // protège contre le clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Empêche le navigateur de deviner le type d'un fichier servi (ex. une
  // photo uploadée) autrement que via son Content-Type déclaré.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Autorise next/image à optimiser les photos servies depuis Cloudflare R2.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
