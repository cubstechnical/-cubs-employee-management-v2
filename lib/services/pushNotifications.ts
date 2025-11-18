import { log } from '@/lib/utils/productionLogger';
import { isCapacitorApp } from '@/utils/mobileDetection';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export class PushNotificationService {
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      log.warn('PushNotificationService: Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      log.warn('PushNotificationService: Notification permission denied');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      log.info('PushNotificationService: Permission result:', permission);
      return permission;
    } catch (error) {
      log.error('PushNotificationService: Error requesting permission', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Web Notifications API
    if ('Notification' in window) {
      return true;
    }

    // Check for Capacitor Push Notifications (if plugin installed)
    if (isCapacitorApp() && typeof (window as any).Capacitor?.Plugins?.PushNotifications !== 'undefined') {
      return true;
    }

    return false;
  }

  /**
   * Check if permission is granted
   */
  static hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    return Notification.permission === 'granted';
  }

  /**
   * Send a push notification
   */
  static async sendNotification(data: PushNotificationData): Promise<boolean> {
    try {
      // Check if we're in Capacitor and use native push if available
      if (isCapacitorApp()) {
        const capacitor = (window as any).Capacitor;
        if (capacitor?.Plugins?.PushNotifications) {
          try {
            await capacitor.Plugins.PushNotifications.schedule({
              notifications: [{
                title: data.title,
                body: data.body,
                id: Date.now(),
                schedule: { at: new Date() },
                sound: 'default',
                attachments: undefined,
                actionTypeId: '',
                extra: data.data || {}
              }]
            });
            log.info('PushNotificationService: Native push notification sent');
            return true;
          } catch (error) {
            log.warn('PushNotificationService: Native push failed, falling back to web', error);
          }
        }
      }

      // Fallback to Web Notifications API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const permission = await this.requestPermission();
          if (permission !== 'granted') {
            log.warn('PushNotificationService: Permission not granted');
            return false;
          }
        }

        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icon.png',
          badge: data.badge || '/icon.png',
          tag: data.tag,
          data: data.data,
          requireInteraction: data.requireInteraction || false
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        log.info('PushNotificationService: Web notification sent');
        return true;
      }

      log.warn('PushNotificationService: No notification method available');
      return false;
    } catch (error) {
      log.error('PushNotificationService: Error sending notification', error);
      return false;
    }
  }

  /**
   * Send visa expiry push notification
   */
  static async sendVisaExpiryNotification(
    employeeCount: number,
    daysRemaining: number,
    urgency: 'critical' | 'urgent' | 'high' | 'medium' | 'low'
  ): Promise<boolean> {
    const urgencyEmojis = {
      critical: '🚨',
      urgent: '⚠️',
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };

    const urgencyText = {
      critical: 'CRITICAL',
      urgent: 'URGENT',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW'
    };

    const title = `${urgencyEmojis[urgency]} Visa Expiry ${urgencyText[urgency]}`;
    const body = `${employeeCount} employee${employeeCount > 1 ? 's have' : ' has'} visa${employeeCount > 1 ? 's' : ''} expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;

    return this.sendNotification({
      title,
      body,
      tag: `visa-expiry-${daysRemaining}`,
      requireInteraction: urgency === 'critical' || urgency === 'urgent',
      data: {
        type: 'visa_expiry',
        employeeCount,
        daysRemaining,
        urgency
      }
    });
  }
}

