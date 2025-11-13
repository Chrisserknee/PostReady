/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to avoid circular structure errors
    // ESLint will still run in development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled
    ignoreBuildErrors: false,
  },
  // Prevent ChunkLoadError when idle
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve chunk loading stability in development
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
      };
    }
    return config;
  },
  // Increase dev server timeout to prevent idle disconnections
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;

