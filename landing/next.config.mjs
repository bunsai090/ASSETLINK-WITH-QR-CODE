/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {},
  // Use stable Webpack and explicitly ignore other monorepo folders
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/backend/**', '**/dashboard/**', '**/node_modules/**'],
    };
    return config;
  },
}

export default nextConfig
