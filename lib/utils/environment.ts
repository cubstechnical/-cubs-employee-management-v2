import { log } from '@/lib/utils/productionLogger';
/**
 * Environment Variable Validation and Security Utilities
 * Ensures proper configuration and prevents exposure of sensitive data
 */

/**
 * Required environment variables for the application
 * NEXT_PUBLIC_ vars are available on client, others are server-only
 */
const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase Anonymous Key',
  B2_APPLICATION_KEY_ID: 'Backblaze B2 Application Key ID',
  B2_APPLICATION_KEY: 'Backblaze B2 Application Key',
  B2_BUCKET_NAME: 'Backblaze B2 Bucket Name'
} as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_APP_URL: 'https://cubsgroups.com',
  NEXT_PUBLIC_VISA_ALERT_EMAIL: 'info@cubstechnical.com',
  VISA_ALERT_EMAIL: 'info@cubstechnical.com',
  GMAIL_USER: '',
  GMAIL_APP_PASSWORD: '',
  GMAIL_FROM_NAME: 'CUBS Technical',
  B2_ENDPOINT: 'https://s3.us-east-005.backblazeb2.com',
  B2_BUCKET_ID: ''
} as const;

/**
 * Validate that all required environment variables are present
 * On client-side, only check NEXT_PUBLIC_ vars (server-only vars won't be available)
 * @returns Array of missing environment variable names
 */
export function validateEnvironmentVariables(): string[] {
  const missing: string[] = [];
  const isClientSide = typeof window !== 'undefined';

  // Static checks for client-side variables (required for Next.js bundling)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (Supabase URL)');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase Anonymous Key)');
  }

  // Server-side only checks
  if (!isClientSide) {
    if (!process.env.B2_APPLICATION_KEY_ID) {
      missing.push('B2_APPLICATION_KEY_ID (Backblaze B2 Application Key ID)');
    }
    if (!process.env.B2_APPLICATION_KEY) {
      missing.push('B2_APPLICATION_KEY (Backblaze B2 Application Key)');
    }
    if (!process.env.B2_BUCKET_NAME) {
      missing.push('B2_BUCKET_NAME (Backblaze B2 Bucket Name)');
    }
  }

  return missing;
}

/**
 * Get environment variable with validation
 * @param key - Environment variable key
 * @param fallback - Fallback value if not set
 * @returns Environment variable value or fallback
 */
export function getEnvVar(key: keyof typeof OPTIONAL_ENV_VARS, fallback: string = ''): string {
  return process.env[key] || fallback;
}

/**
 * Get required environment variable with validation
 * @param key - Environment variable key
 * @returns Environment variable value
 * @throws Error if variable is not set
 */
export function getRequiredEnvVar(key: keyof typeof REQUIRED_ENV_VARS): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Get application URL with validation
 */
export function getAppUrl(): string {
  const url = getEnvVar('NEXT_PUBLIC_APP_URL', 'https://cubsgroups.com');
  try {
    return new URL(url).origin;
  } catch {
    return 'https://cubsgroups.com';
  }
}

/**
 * Get API base URL for making requests
 * Uses NEXT_PUBLIC_APP_URL in production, relative paths in development
 * Also checks for Capacitor environment (mobile app)
 */
export function getApiBaseUrl(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_APP_URL || 'https://cubsgroups.com';
  }

  // Client-side: check if we're in Capacitor (mobile app)
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

  if (isCapacitor) {
    // In Capacitor, use the configured server URL or a remote API host
    const capacitorConfig = (window as any).Capacitor?.getConfig?.();
    if (capacitorConfig?.server?.url) {
      return capacitorConfig.server.url;
    }
    // When running from local assets (capacitor://), fall back to hosted API URL
    const remoteApi =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof document !== 'undefined' ? document.baseURI : 'https://cubsgroups.com');
    try {
      return new URL(remoteApi).origin;
    } catch {
      return 'https://cubsgroups.com';
    }
  }

  // Web production: use environment variable or current origin
  if (isProduction()) {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;

    // SAFETY CHECK: If env var is the placeholder or missing, use real domain
    if (!envUrl || envUrl.includes('your-production-domain') || envUrl === 'undefined') {
      log.warn('⚠️ Invalid/Placeholder NEXT_PUBLIC_APP_URL detected. Forcing correct domain.');
      return 'https://www.cubsgroups.com';
    }

    if (envUrl) {
      try {
        return new URL(envUrl).origin;
      } catch {
        // Invalid URL, use current origin
      }
    }
    // Use current origin as fallback
    return window.location.origin;
  }

  // Development: use relative paths (works with Next.js dev server)
  return '';
}

/**
 * Log environment configuration (development only)
 */
export function logEnvironmentConfig(): void {
  if (!isDevelopment()) return;

  const isClientSide = typeof window !== 'undefined';

  log.group('🔧 Environment Configuration');
  log.info('Environment:', process.env.NODE_ENV);
  log.info('App URL:', getAppUrl());

  // Log required variables (without sensitive data)
  log.info('Required Variables:');
  Object.keys(REQUIRED_ENV_VARS).forEach(key => {
    // Skip server-only vars on client
    if (isClientSide && !key.startsWith('NEXT_PUBLIC_')) return;
    const value = process.env[key];
    log.info(`  ${key}: ${value ? '✅ Set' : '❌ Missing'}`);
  });

  // Log optional variables
  log.info('Optional Variables:');
  Object.keys(OPTIONAL_ENV_VARS).forEach(key => {
    // Skip server-only vars on client
    if (isClientSide && !key.startsWith('NEXT_PUBLIC_')) return;
    const value = process.env[key];
    log.info(`  ${key}: ${value ? '✅ Set' : '⚠️ Not set'}`);
  });

  log.groupEnd();
}

/**
 * Security check: Ensure no sensitive data is exposed in client-side code
 * This should be called during build time
 */
export function securityCheck(): void {
  // List of environment variables that should NEVER be exposed client-side
  const clientSideOnlyVars = [
    'B2_APPLICATION_KEY',
    'GMAIL_APP_PASSWORD',
    'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  if (typeof window !== 'undefined') {
    // Client-side checks
    clientSideOnlyVars.forEach(varName => {
      if (process.env[varName]) {
        log.warn(`⚠️  SECURITY WARNING: ${varName} is exposed on client-side!`);
      }
    });
  }
}

/**
 * Initialize environment validation on module load
 */
export function initializeEnvironment(): void {
  // Validate required environment variables
  const missing = validateEnvironmentVariables();

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    if (isDevelopment()) {
      log.error(`❌ ${errorMessage}`);
      log.info('Please check your .env.local file or environment configuration.');
    } else {
      throw new Error(errorMessage);
    }
  }

  // Log configuration in development
  logEnvironmentConfig();

  // Security checks
  securityCheck();
}

// Auto-initialize in development
if (isDevelopment()) {
  initializeEnvironment();
}

/**
 * Public email used for visa alerts (safe to expose)
 */
export function getVisaAlertEmail(): string {
  return process.env.NEXT_PUBLIC_VISA_ALERT_EMAIL || 'info@cubstechnical.com';
}

/**
 * Server-side fallback for visa alert recipient
 */
export function getServerVisaAlertEmail(): string {
  return (
    process.env.VISA_ALERT_EMAIL ||
    process.env.NEXT_PUBLIC_VISA_ALERT_EMAIL ||
    'info@cubstechnical.com'
  );
}
