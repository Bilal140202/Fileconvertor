/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features for client-side execution and worker threads
  experimental: {
    // Enable worker threads for client-side processing
    // Note: This improves performance for CPU-intensive operations
    // when combined with proper Web Worker implementation
  },

  // Optimize for strict type checking
  reactStrictMode: true,

  // Headers for security and CORS to enable SharedArrayBuffer for workers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
