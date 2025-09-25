/**
 * Environment Variable Validation and Security Utilities
 * Ensures proper configuration and prevents exposure of sensitive data
 */

/**
 * Required environment variables for the application
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
  GMAIL_USER: '',
  GMAIL_APP_PASSWORD: '',
  GMAIL_FROM_NAME: 'CUBS Technical',
  B2_ENDPOINT: 'https://s3.us-east-005.backblazeb2.com',
  B2_BUCKET_ID: ''
} as const;

/**
 * Validate that all required environment variables are present
 * @returns Array of missing environment variable names
 */
export function validateEnvironmentVariables(): string[] {
  const missing: string[] = [];

  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(`${key} (${description})`);
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
 * Log environment configuration (development only)
 */
export function logEnvironmentConfig(): void {
  if (!isDevelopment()) return;

  console.group('🔧 Environment Configuration');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('App URL:', getAppUrl());

  // Log required variables (without sensitive data)
  console.log('Required Variables:');
  Object.keys(REQUIRED_ENV_VARS).forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? '✅ Set' : '❌ Missing'}`);
  });

  // Log optional variables
  console.log('Optional Variables:');
  Object.keys(OPTIONAL_ENV_VARS).forEach(key => {
    const value = process.env[key];
    console.log(`  ${key}: ${value ? '✅ Set' : '⚠️ Not set'}`);
  });

  console.groupEnd();
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
        console.warn(`⚠️  SECURITY WARNING: ${varName} is exposed on client-side!`);
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
      console.error(`❌ ${errorMessage}`);
      console.log('Please check your .env.local file or environment configuration.');
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
