/**
 * Safe Storage Wrapper
 * Handles mobile Safari Private Mode and storage quota failures gracefully
 */

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
}

class SafeLocalStorage implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('SafeStorage: localStorage read failed for key:', key, error);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('SafeStorage: localStorage write failed for key:', key, error);
      // Handle specific iOS Private Mode error
      if (error instanceof DOMException && error.code === 22) {
        console.warn('SafeStorage: iOS Private Mode detected - storage disabled');
      }
      return false;
    }
  }

  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('SafeStorage: localStorage remove failed for key:', key, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('SafeStorage: localStorage clear failed:', error);
      return false;
    }
  }
}

class SafeSessionStorage implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('SafeStorage: sessionStorage read failed for key:', key, error);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('SafeStorage: sessionStorage write failed for key:', key, error);
      return false;
    }
  }

  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('SafeStorage: sessionStorage remove failed for key:', key, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.warn('SafeStorage: sessionStorage clear failed:', error);
      return false;
    }
  }
}

// Export safe storage instances
export const safeLocalStorage = new SafeLocalStorage();
export const safeSessionStorage = new SafeSessionStorage();

// Storage capability detection
export const detectStorageCapabilities = (): {
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
} => {
  if (typeof window === 'undefined') {
    return { localStorage: false, sessionStorage: false, cookies: false };
  }

  let localStorage = false;
  let sessionStorage = false;
  let cookies = false;

  try {
    localStorage = safeLocalStorage.setItem('test', 'test');
    safeLocalStorage.removeItem('test');
  } catch (error) {
    console.warn('Storage capability check failed for localStorage:', error);
  }

  try {
    sessionStorage = safeSessionStorage.setItem('test', 'test');
    safeSessionStorage.removeItem('test');
  } catch (error) {
    console.warn('Storage capability check failed for sessionStorage:', error);
  }

  try {
    document.cookie = 'test=value';
    cookies = document.cookie.includes('test=value');
    document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (error) {
    console.warn('Cookie capability check failed:', error);
  }

  return { localStorage, sessionStorage, cookies };
};

// Mobile-specific storage helpers
export const safeSetAuthToken = (token: string): boolean => {
  return safeLocalStorage.setItem('cubs-auth-token', JSON.stringify({
    token,
    timestamp: Date.now(),
    expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }));
};

export const safeGetAuthToken = (): string | null => {
  const stored = safeLocalStorage.getItem('cubs-auth-token');
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    const now = Math.floor(Date.now() / 1000);

    // Check if token is expired
    if (parsed.expires_at && parsed.expires_at < now) {
      safeLocalStorage.removeItem('cubs-auth-token');
      return null;
    }

    return parsed.token;
  } catch (error) {
    console.warn('SafeStorage: Failed to parse auth token:', error);
    safeLocalStorage.removeItem('cubs-auth-token');
    return null;
  }
};

export const safeClearAuthData = (): void => {
  safeLocalStorage.removeItem('cubs-auth-token');
  safeLocalStorage.removeItem('cubs_session_persisted');
  safeLocalStorage.removeItem('cubs_last_login');
  safeLocalStorage.removeItem('cubs_user_email');
  safeLocalStorage.removeItem('cubs_user_id');
};
