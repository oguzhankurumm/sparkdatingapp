import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  transpilePackages: ['@spark/ui', '@spark/hooks', '@spark/utils', '@spark/i18n'],
  typedRoutes: true,

  // Experimental optimizations
  experimental: {
    // Partial Prerendering — opt in per-page with `export const experimental_ppr = true`
    ppr: 'incremental',

    // React Compiler — auto-memoises components (no more manual useMemo/useCallback)
    reactCompiler: true,

    // Tree-shake barrel exports for large packages
    optimizePackageImports: ['@phosphor-icons/react', '@spark/ui', 'framer-motion', 'zustand'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },

  // Compress responses
  compress: true,

  // Production source maps for Sentry
  productionBrowserSourceMaps: true,

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(self), microphone=(self), geolocation=(self)',
        },
      ],
    },
  ],
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)
