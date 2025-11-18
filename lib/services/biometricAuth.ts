import { isCapacitorApp } from '@/utils/mobileDetection';
import { AuthService, type AuthUser } from './auth';
import { log } from '@/lib/utils/productionLogger';

const BIOMETRIC_KEY = 'cubs_biometric_credential';

type BiometricAuthError = {
  message: string;
};

export type BiometricAuthResult = {
  user: AuthUser | null;
  error: BiometricAuthError | null;
};

export class BiometricAuthService {
  static async isBiometricAvailable(): Promise<boolean> {
    // WebAuthn is available in modern mobile browsers and Capacitor WebViews
    if (!isCapacitorApp()) {
      return false;
    }

    // Check if WebAuthn is supported
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false;
    }

    try {
      // Check if platform authenticator (biometric) is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      log.info('BiometricAuthService: WebAuthn platform authenticator available:', available);
      return available;
    } catch (error) {
      log.warn('BiometricAuthService: WebAuthn availability check failed', error);
      return false;
    }
  }

  /**
   * Check if biometric credentials are stored
   * Uses localStorage flag set when credentials are saved
   */
  static async hasStoredCredentials(): Promise<boolean> {
    if (!isCapacitorApp()) {
      return false;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(BIOMETRIC_KEY);
        const hasStored = !!stored;
        log.info('BiometricAuthService: Has stored credentials:', hasStored);
        return hasStored;
      }
      return false;
    } catch (error) {
      log.warn('BiometricAuthService: Error checking stored credentials', error);
      return false;
    }
  }

  static async enableBiometricLogin(email: string, password: string): Promise<void> {
    if (!isCapacitorApp()) {
      return;
    }

    try {
      // Check if WebAuthn is available
      const available = await this.isBiometricAvailable();
      if (!available) {
        log.warn('BiometricAuthService: WebAuthn not available, cannot enable biometric login');
        return;
      }

      log.info('BiometricAuthService: Creating WebAuthn credential for:', email);

      // Create random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Get hostname for RP ID
      const rpId = window.location.hostname || 'localhost';

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'CUBS Employee Management',
            id: rpId
          },
          user: {
            id: new Uint8Array(Buffer.from(email)),
            name: email,
            displayName: email.split('@')[0]
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as PublicKeyCredential;

      if (!credential || !credential.id) {
        throw new Error('Failed to create WebAuthn credential');
      }

      // Store credential info and login data
      if (typeof window !== 'undefined' && window.localStorage) {
        const credentialData = {
          id: credential.id,
          email,
          password: btoa(password), // Base64 encode password for storage
          created: Date.now()
        };
        localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(credentialData));
        localStorage.setItem('cubs_biometric_enabled', 'true');
        localStorage.setItem('cubs_biometric_email', email);
        log.info('BiometricAuthService: WebAuthn credential created and stored');
      }
    } catch (error: any) {
      log.warn('BiometricAuthService: Failed to create WebAuthn credential', error);
      
      // If user cancels, that's okay - don't throw
      if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
        log.info('BiometricAuthService: User cancelled credential creation');
        return;
      }
      
      // For other errors, log but don't throw
      throw error;
    }
  }

  static async disableBiometricLogin(): Promise<void> {
    if (!isCapacitorApp()) {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(BIOMETRIC_KEY);
        localStorage.removeItem('cubs_biometric_enabled');
        localStorage.removeItem('cubs_biometric_email');
        log.info('BiometricAuthService: WebAuthn credential removed');
      }
    } catch (error) {
      log.warn('BiometricAuthService: Failed to remove biometric credential', error);
    }
  }

  static async biometricSignIn(): Promise<BiometricAuthResult> {
    if (!isCapacitorApp()) {
      return {
        user: null,
        error: {
          message: 'Biometric login is only available in the mobile app.'
        }
      };
    }

    try {
      // Check if WebAuthn is available
      const available = await this.isBiometricAvailable();
      if (!available) {
        return {
          user: null,
          error: {
            message: 'Biometric authentication is not available on this device.'
          }
        };
      }

      // Get stored credential data
      if (typeof window === 'undefined' || !window.localStorage) {
        return {
          user: null,
          error: {
            message: 'Unable to access stored credentials.'
          }
        };
      }

      const storedData = localStorage.getItem(BIOMETRIC_KEY);
      if (!storedData) {
        return {
          user: null,
          error: {
            message: 'No saved biometric credentials found. Please sign in with email and password first.'
          }
        };
      }

      const credentialData = JSON.parse(storedData);
      
      // Get biometric type for better messaging
      const biometricType = await this.getBiometricType();
      let title = 'Biometric Login';
      let subtitle = 'Use fingerprint or Face ID';

      if (biometricType === 'face') {
        title = 'Face ID';
        subtitle = 'Use Face ID to sign in';
      } else if (biometricType === 'fingerprint') {
        title = 'Touch ID';
        subtitle = 'Use fingerprint to sign in';
      }

      log.info('BiometricAuthService: Starting WebAuthn authentication', { email: credentialData.email });

      // Create challenge for authentication
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Get hostname for RP ID
      const rpId = window.location.hostname || 'localhost';

      // Convert credential ID from string to ArrayBuffer
      let credentialId: ArrayBuffer;
      try {
        credentialId = Uint8Array.from(atob(credentialData.id), c => c.charCodeAt(0)).buffer;
      } catch (error) {
        // If credential ID is already in a different format, try direct conversion
        credentialId = new TextEncoder().encode(credentialData.id).buffer;
      }

      // Authenticate using WebAuthn
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            type: 'public-key',
            id: credentialId
          }],
          userVerification: 'required',
          timeout: 60000,
          rpId: rpId
        }
      }) as PublicKeyCredential;

      if (!assertion) {
        return {
          user: null,
          error: {
            message: 'Biometric authentication failed.'
          }
        };
      }

      log.info('BiometricAuthService: WebAuthn authentication successful');

      // Get the stored credentials and sign in
      const password = atob(credentialData.password);
      const { user, error } = await AuthService.signIn({
        email: credentialData.email,
        password
      });

      if (error) {
        return { user: null, error };
      }

      return { user, error: null };
    } catch (error: any) {
      log.warn('BiometricAuthService: WebAuthn biometric sign in failed', error);
      
      // Handle specific WebAuthn errors
      if (error.name === 'NotAllowedError') {
        return {
          user: null,
          error: {
            message: 'Biometric authentication was cancelled or denied.'
          }
        };
      }

      if (error.name === 'InvalidStateError') {
        return {
          user: null,
          error: {
            message: 'Biometric credential is invalid. Please sign in with email and password again.'
          }
        };
      }
      
      return {
        user: null,
        error: {
          message: error.message || 'Biometric authentication failed or was cancelled.'
        }
      };
    }
  }

  /**
   * Detect the type of biometric available on the device
   */
  private static async getBiometricType(): Promise<string> {
    try {
      // Try to detect biometric type through user agent
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        
        // iOS devices typically have Face ID (iPhone X and later) or Touch ID
        if (/iphone|ipad|ipod/.test(ua)) {
          // iPhone X and later have Face ID, older have Touch ID
          // We'll default to 'face' for modern iOS devices
          if (/iphone/.test(ua)) {
            // Check for iPhone X or later (rough detection)
            const match = ua.match(/iphone os (\d+)/);
            if (match && parseInt(match[1]) >= 11) {
              return 'face'; // Likely Face ID
            }
            return 'fingerprint'; // Likely Touch ID
          }
          return 'face'; // iPad typically has Face ID
        }
        
        // Android devices typically have fingerprint
        if (/android/.test(ua)) {
          return 'fingerprint';
        }
      }
      
      // Fallback
      return 'biometric';
    } catch (error) {
      return 'biometric';
    }
  }
}
