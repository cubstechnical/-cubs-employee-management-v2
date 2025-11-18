'use client';

import { useEffect } from 'react';
import { PushNotificationService } from '@/lib/services/pushNotifications';
import { log } from '@/lib/utils/productionLogger';

export default function PushNotificationSetup() {
  useEffect(() => {
    // Request notification permission on app load (mobile and web)
    const initializePushNotifications = async () => {
      try {
        if (PushNotificationService.isSupported()) {
          const permission = await PushNotificationService.requestPermission();
          if (permission === 'granted') {
            log.info('PushNotificationSetup: Notification permission granted');
          } else {
            log.info('PushNotificationSetup: Notification permission not granted:', permission);
          }
        } else {
          log.info('PushNotificationSetup: Push notifications not supported');
        }
      } catch (error) {
        log.warn('PushNotificationSetup: Error initializing push notifications', error);
      }
    };

    // Delay initialization slightly to avoid blocking app load
    const timer = setTimeout(() => {
      initializePushNotifications();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}

