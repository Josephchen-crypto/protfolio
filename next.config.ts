import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// OpenNext Cloudflare integration — comment out for local dev (EPERM issue on this machine)
// import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
