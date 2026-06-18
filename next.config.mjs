import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(__dirname),
  },
  // Allow the ngrok tunnel host to load Next.js dev resources (HMR, etc.)
  // during local Zoom OAuth testing. Safe to leave; only affects `next dev`.
  allowedDevOrigins: ["displace-washhouse-nintendo.ngrok-free.dev"],
};

export default nextConfig;
