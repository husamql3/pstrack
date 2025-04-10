import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import { createJiti } from 'jiti'

const jiti = createJiti(fileURLToPath(import.meta.url))
void jiti.import('./src/config/env')

const nextConfig: NextConfig = {
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
}

export default nextConfig
