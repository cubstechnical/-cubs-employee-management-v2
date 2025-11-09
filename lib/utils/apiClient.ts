import { getApiBaseUrl } from './environment';
import { log } from './productionLogger';

/**
 * Get the full API URL for a given endpoint
 * Handles production vs development, Capacitor vs web, etc.
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  const apiBaseUrl = getApiBaseUrl();
  
  if (apiBaseUrl) {
    // Use absolute URL
    return `${apiBaseUrl}/${cleanEndpoint}`;
  } else {
    // Use relative URL (development)
    return `/${cleanEndpoint}`;
  }
}

/**
 * Wrapper for fetch that automatically handles API URL resolution
 * Use this instead of direct fetch for API calls
 */
export async function apiFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  log.debug('🌐 API Request:', { url, endpoint, method: options?.method || 'GET' });
  
  return fetch(url, options);
}

