/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
    // Allow data URLs in Image component (for screenshots)
    domains: ["localhost"],
    formats: ["image/avif", "image/webp"],
    disableStaticImages: true,
  },
};

export default nextConfig;
