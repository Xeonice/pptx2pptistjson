/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverSourceMaps: true,
  },
};

module.exports = nextConfig;
