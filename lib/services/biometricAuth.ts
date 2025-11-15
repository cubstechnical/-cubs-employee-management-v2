import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { isCapacitorApp } from '@/utils/mobileDetection';
import { AuthService, type AuthUser } from './auth';
import { log } from '@/lib/utils/productionLogger';

const BIOMETRIC_SERVER_ID = 'cubs-employee-login';

type BiometricAuthError = {
  message: string;
};

export type BiometricAuthResult = {
  user: AuthUser | null;
  error: BiometricAuthError | null;
};

export class BiometricAuthService {
  static async isBiometricAvailable(): Promise<boolean> {
    if (!isCapacitorApp()) {
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      return !!result.isAvailable;
    } catch (error) {
      log.warn('BiometricAuthService: isAvailable failed', error);
      return false;
    }
  }

  /**
   * Check if biometric credentials are stored (without prompting)
   */
  static async hasStoredCredentials(): Promise<boolean> {
    if (!isCapacitorApp()) {
      return false;
    }

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_ID
      });
      return !!(credentials.username && credentials.password);
    } catch (error) {
      // If credentials don't exist, getCredentials will throw
      return false;
    }
  }

  static async enableBiometricLogin(
    email: string,
    password: string
  ): Promise<void> {
    if (!isCapacitorApp()) {
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        return;
      }

      await NativeBiometric.setCredentials({
        username: email,
        password,
        server: BIOMETRIC_SERVER_ID
      });

      log.info('BiometricAuthService: credentials stored');
    } catch (error) {
      log.warn('BiometricAuthService: failed to store credentials', error);
    }
  }

  static async disableBiometricLogin(): Promise<void> {
    if (!isCapacitorApp()) {
      return;
    }

    try {
      await NativeBiometric.deleteCredentials({
        server: BIOMETRIC_SERVER_ID
      });
    } catch (error) {
      log.warn('BiometricAuthService: failed to delete credentials', error);
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
      const availability = await NativeBiometric.isAvailable();
      if (!availability.isAvailable) {
        return {
          user: null,
          error: {
            message:
              'Biometric authentication is not available on this device.'
          }
        };
      }

      // Get biometric type for better messaging
      const availability = await NativeBiometric.isAvailable();
      const biometricType = availability.biometryType || 'biometric';
      
      let title = 'Biometric Login';
      let subtitle = 'Use fingerprint or Face ID';
      let reason = 'Authenticate to access your CUBS account';
      
      // Customize messages based on biometric type
      if (biometricType === 'FaceID' || biometricType === 'face') {
        title = 'Face ID';
        subtitle = 'Use Face ID to sign in';
        reason = 'Use Face ID to authenticate and access your CUBS account';
      } else if (biometricType === 'TouchID' || biometricType === 'fingerprint') {
        title = 'Touch ID';
        subtitle = 'Use fingerprint to sign in';
        reason = 'Use your fingerprint to authenticate and access your CUBS account';
      }

      await NativeBiometric.verifyIdentity({
        reason,
        title,
        subtitle,
        description: ''
      });

      const credentials = await NativeBiometric.getCredentials({
        server: BIOMETRIC_SERVER_ID
      });

      if (!credentials.username || !credentials.password) {
        return {
          user: null,
          error: {
            message:
              'No saved biometric credentials found. Please sign in with ' +
              'email and password first.'
          }
        };
      }

      const { user, error } = await AuthService.signIn({
        email: credentials.username,
        password: credentials.password
      });

      return { user, error };
    } catch (error) {
      log.warn('BiometricAuthService: biometric sign in failed', error);
      return {
        user: null,
        error: {
          message: 'Biometric authentication failed or was cancelled.'
        }
      };
    }
  }
}
