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

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  // Mobile-optimized build configuration
  // Note: output: 'export' is not compatible with API routes
  // For Capacitor, we'll use a different approach
  trailingSlash: true, // Required for static export
  images: {
    domains: ['s3.us-east-005.backblazeb2.com', 'cubsgroups.com'],
    unoptimized: true, // Required for static export
  },
  compress: true,
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint for mobile build
  },
  // Mobile-specific optimizations
  poweredByHeader: false,
  generateEtags: false,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'react-apexcharts'],
    // Performance optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Enable SWC minification for better performance
    swcMinify: true,
    // Enable modern JavaScript features (removed modernBuild as it's not valid)
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'react-apexcharts', '@tanstack/react-query'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    GMAIL_USER: process.env.GMAIL_USER || 'technicalcubs@gmail.com',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || 'kito hkgc ygfp gzjo',
    GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME || 'CUBS Technical',
    B2_APPLICATION_KEY_ID: process.env.B2_APPLICATION_KEY_ID || '',
    B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY || '',
    B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || '',
    B2_ENDPOINT: process.env.B2_ENDPOINT || '',
    B2_BUCKET_ID: process.env.B2_BUCKET_ID || '',
  },
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle splitting and chunk loading
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
            // Separate heavy libraries
            charts: {
              test: /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
              name: 'charts',
              chunks: 'all',
              enforce: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

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

module.exports = withBundleAnalyzer(withPWA(baseConfig))