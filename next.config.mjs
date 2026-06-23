import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/settings', destination: '/settings/my-link', permanent: true },
    ]
  },
  turbopack: {
    root: resolve(__dirname),
  },
  allowedDevOrigins: ["displace-washhouse-nintendo.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
