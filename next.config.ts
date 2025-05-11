import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { createJiti } from 'jiti'

const jiti = createJiti(fileURLToPath(import.meta.url))
void jiti.import('./src/config/env')

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'nc5my9yt8e.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
}

export default nextConfig
