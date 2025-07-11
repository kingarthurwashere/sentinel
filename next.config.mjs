/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'services.sentinel-hub.com'],
    unoptimized: true,
  },
  
  // Environment variables - provide defaults for build time
  env: {
    DATABASE_URL: process.env.DATABASE_URL || 'placeholder',
    SENTINEL_HUB_CLIENT_ID: process.env.SENTINEL_HUB_CLIENT_ID || 'demo',
    SENTINEL_HUB_CLIENT_SECRET: process.env.SENTINEL_HUB_CLIENT_SECRET || 'demo',
    SENTINEL_HUB_INSTANCE_ID: process.env.SENTINEL_HUB_INSTANCE_ID || 'demo',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default',
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config for Docker optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
        },
      }
    }
    
    return config
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
