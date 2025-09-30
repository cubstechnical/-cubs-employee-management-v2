const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.DISABLE_PWA === 'true',
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
    // Cache Supabase API calls with StaleWhileRevalidate for better performance
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-api',
        expiration: { 
          maxEntries: 100, 
          maxAgeSeconds: 5 * 60 // 5 minutes for API data
        },
      },
    },
    // Cache static assets with CacheFirst
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: { 
          maxEntries: 100, 
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        },
      },
    },
    // Cache fonts with CacheFirst
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-fonts',
        expiration: { 
          maxEntries: 20, 
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        },
      },
    },
    // Cache CSS and JS with StaleWhileRevalidate
    {
      urlPattern: /\.(?:css|js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: { 
          maxEntries: 50, 
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        },
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
  // Mobile-optimized build configuration for Capacitor
  output: 'export', // ✅ ENABLED for Capacitor static export
  trailingSlash: true,
  distDir: '.next', // Build directory
  images: {
    domains: ['s3.us-east-005.backblazeb2.com', 'cubsgroups.com'],
    unoptimized: true, // Required for static export
  },
  compress: true,
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint for production builds
  },
  // Mobile-specific optimizations
  poweredByHeader: false,
  generateEtags: false,
  // Note: headers() not supported in static export mode
  /* async headers() {
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.backblazeb2.com https://cubsgroups.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'"
            ].join('; '),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  }, */
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'react-apexcharts', '@tanstack/react-query'],
  },
  // Move turbo config to turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    GMAIL_USER: process.env.GMAIL_USER || '',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
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
          chunks: 'all',
          minSize: 10000, // Reduced min size for better splitting
          maxSize: 50000, // Reduced max size to 50KB for better mobile performance
          cacheGroups: {
            // React and React DOM - highest priority
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // ApexCharts - very heavy library
            apexcharts: {
              test: /[\\/]node_modules[\\/](apexcharts|react-apexcharts)[\\/]/,
              name: 'apexcharts',
              chunks: 'all',
              priority: 35,
              enforce: true,
            },
            // Supabase - heavy database library
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase|supabase)[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // React Query - data fetching
            reactQuery: {
              test: /[\\/]node_modules[\\/](@tanstack|react-query)[\\/]/,
              name: 'react-query',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](lucide-react|react-hot-toast|framer-motion)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Common utilities
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 15,
              enforce: true,
              maxSize: 30000, // Reduced common chunk size
            },
            // Default vendor chunk - everything else
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
              maxSize: 150000, // Reduced vendor chunk to 150KB for mobile
            },
          },
        },
      };
    }

    // Ignore optional native deps used by ws in Node, not needed for Next builds
    config.externals = config.externals || [];
    
    // Handle Supabase realtime dependency warnings
    config.ignoreWarnings = [
      // Ignore the dynamic require warning from Supabase realtime
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'ws'/,
      /Module not found: Can't resolve 'bufferutil'/,
      /Module not found: Can't resolve 'utf-8-validate'/,
    ];
    
    // For server builds, mark as externals false via fallback so bundler won't try to resolve
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      bufferutil: false,
      'utf-8-validate': false,
      // Node.js modules that should not be bundled for client-side
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      dns: false,
      child_process: false,
    };

    // Also alias to false to be extra safe
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      bufferutil: false,
      'utf-8-validate': false,
      // Node.js modules that should not be bundled for client-side
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      dns: false,
      child_process: false,
    };

    return config;
  },
}

module.exports = withBundleAnalyzer(withPWA(baseConfig))