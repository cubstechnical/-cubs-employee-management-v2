import { supabase } from '../supabase/client';

// Dynamically import Capacitor to avoid SSR issues
let PushNotifications: any = null;

// Only import Capacitor on client side
if (typeof window !== 'undefined') {
  try {
    PushNotifications = require('@capacitor/push-notifications').PushNotifications;
  } catch (error) {
    console.log('Capacitor Push Notifications not available:', error);
  }
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  image?: string;
}

export class PushNotificationService {
  private static isInitialized = false;
  private static deviceToken: string | null = null;

  // Initialize push notifications
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if PushNotifications is available (client-side only)
    if (!PushNotifications || typeof window === 'undefined') {
      console.log('Push notifications not available in this environment');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
        
        // Set up listeners
        this.setupListeners();
        
        this.isInitialized = true;
        console.log('Push notifications initialized successfully');
      } else {
        console.log('Push notification permission denied');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  // Set up push notification listeners
  private static setupListeners(): void {
    if (!PushNotifications) {
      console.log('PushNotifications not available for listeners');
      return;
    }

    // Registration success
    PushNotifications.addListener('registration', (token: { value: string }) => {
      this.deviceToken = token.value;
      console.log('Push registration success:', token.value);
      
      // Store token in database
      this.storeDeviceToken(token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: { error: string }) => {
      console.error('Push registration failed:', error.error);
    });

    // Push notification received
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push notification received:', notification);
      
      // Handle notification when app is in foreground
      this.handleNotificationReceived(notification);
    });

    // Push notification action clicked
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      console.log('Push notification action performed:', notification);
      
      // Handle notification tap
      this.handleNotificationAction(notification);
    });
  }

  // Store device token in database
  private static async storeDeviceToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('device_tokens')
          .upsert({
            user_id: user.id,
            device_token: token,
            platform: this.getPlatform(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,device_token'
          });

        if (error) {
          console.error('Failed to store device token:', error);
        } else {
          console.log('Device token stored successfully');
        }
      }
    } catch (error) {
      console.error('Error storing device token:', error);
    }
  }

  // Get current platform
  private static getPlatform(): string {
    if (typeof window !== 'undefined') {
      if (window.navigator.userAgent.includes('Android')) return 'android';
      if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) return 'ios';
    }
    return 'web';
  }

  // Handle notification received (app in foreground)
  private static handleNotificationReceived(notification: any): void {
    // You can show a custom in-app notification here
    // For now, we'll just log it
    console.log('Notification received in foreground:', notification);
  }

  // Handle notification action (user tapped notification)
  private static handleNotificationAction(notification: { notification: { data?: any } }): void {
    const data = notification.notification.data;
    
    // Navigate based on notification type
    if (data?.type === 'visa_expiry') {
      // Navigate to employee details or visa management
      window.location.href = `/employees/${data.employee_id}`;
    } else if (data?.type === 'approval') {
      // Navigate to approvals page
      window.location.href = '/admin/approvals';
    }
  }

  // Send push notification to specific user
  static async sendToUser(userId: string, notification: PushNotificationData): Promise<boolean> {
    try {
      // Get user's device tokens
      const { data: tokens, error } = await supabase
        .from('device_tokens')
        .select('device_token, platform')
        .eq('user_id', userId);

      if (error || !tokens || tokens.length === 0) {
        console.log('No device tokens found for user:', userId);
        return false;
      }

      // Send to each device
      const results = await Promise.all(
        tokens.map((token: { device_token: string; platform: string }) => 
          this.sendToDevice(token.device_token, notification)
        )
      );

      return results.some(result => result);
    } catch (error) {
      console.error('Error sending push notification to user:', error);
      return false;
    }
  }

  // Send push notification to specific device
  private static async sendToDevice(token: string, notification: PushNotificationData): Promise<boolean> {
    try {
      // This would typically call your backend API to send via Firebase
      const response = await fetch('/api/push-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          notification
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending push notification to device:', error);
      return false;
    }
  }

  // Send visa expiry notification
  static async sendVisaExpiryNotification(
    userId: string, 
    employeeName: string, 
    daysUntilExpiry: number
  ): Promise<boolean> {
    const urgency = daysUntilExpiry <= 7 ? 'CRITICAL' : daysUntilExpiry <= 15 ? 'URGENT' : 'WARNING';
    const emoji = daysUntilExpiry <= 7 ? '🚨' : daysUntilExpiry <= 15 ? '⚠️' : '📋';

    const notification: PushNotificationData = {
      title: `${emoji} Visa Expiry ${urgency}`,
      body: `${employeeName}'s visa expires in ${daysUntilExpiry} days`,
      data: {
        type: 'visa_expiry',
        days_until_expiry: daysUntilExpiry,
        urgency: urgency.toLowerCase()
      },
      badge: 1,
      sound: 'default'
    };

    return this.sendToUser(userId, notification);
  }

  // Send approval notification
  static async sendApprovalNotification(userId: string, message: string): Promise<boolean> {
    const notification: PushNotificationData = {
      title: '🔔 New Approval Request',
      body: message,
      data: {
        type: 'approval'
      },
      badge: 1,
      sound: 'default'
    };

    return this.sendToUser(userId, notification);
  }

  // Get current device token
  static getDeviceToken(): string | null {
    return this.deviceToken;
  }

  // Check if push notifications are available
  static isAvailable(): boolean {
    return this.isInitialized && this.deviceToken !== null && PushNotifications !== null;
  }
}
