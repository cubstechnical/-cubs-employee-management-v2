const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Cache Backblaze public endpoints with Range support
    {
      urlPattern: /^https:\/\/f005\.backblazeb2\.com\/file\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'b2-public',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        rangeRequests: true,
      },
    },
    {
      urlPattern: /^https:\/\/s3\.us-east-005\.backblazeb2\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'b2-s3',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
        rangeRequests: true,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  compress: true,
  images: {
    domains: ['s3.us-east-005.backblazeb2.com'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  headers: async () => ([
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
        // Basic CSP; tighten further if needed
        { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https: data: blob:; media-src 'self' https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; connect-src 'self' https: wss:; frame-src 'self' https:;" },
      ],
    },
    {
      source: '/manifest.webmanifest',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, immutable' },
      ],
    },
  ]),
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID,
    B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
    B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
    B2_ENDPOINT: process.env.B2_ENDPOINT,
    B2_BUCKET_ID: process.env.B2_BUCKET_ID,
  },
  webpack: (config, { isServer }) => {
    // Ignore optional native deps used by ws in Node, not needed for Next builds
    config.externals = config.externals || [];
    // For server builds, mark as externals false via fallback so bundler won't try to resolve
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      bufferutil: false,
      'utf-8-validate': false,
    };

    // Also alias to false to be extra safe
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      bufferutil: false,
      'utf-8-validate': false,
    };

    return config;
  },
}

module.exports = withPWA(baseConfig)