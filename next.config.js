/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    workerThreads: true,
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    // Enable Web Worker support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      loader: 'worker-loader',
      options: {
        name: 'static/[hash].worker.js',
        publicPath: '/_next/',
      },
    })

    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    return config
  },
}

module.exports = nextConfig
