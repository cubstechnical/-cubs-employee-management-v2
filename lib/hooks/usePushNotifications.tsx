'use client';

import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { log } from '@/lib/utils/productionLogger';
import toast from 'react-hot-toast';

/**
 * Hook to register device for push notifications
 * Handles both iOS and Android via Capacitor
 */
export function usePushNotifications() {
    const [isRegistered, setIsRegistered] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) {
            log.info('⚠️ Not a native platform, push notifications unavailable');
            return;
        }

        initializePushNotifications();
    }, []);

    const initializePushNotifications = async () => {
        try {
            // 1. Request permission
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                log.warn('❌ Push notification permission denied');
                setPermissionGranted(false);
                return;
            }

            setPermissionGranted(true);
            log.info('✅ Push notification permission granted');

            // 2. Register with FCM/APNs
            await PushNotifications.register();
            log.info('📲 Registering for push notifications...');

            // 3. Listen for successful registration
            await PushNotifications.addListener('registration', async (token) => {
                log.info('✅ Push registration success:', token.value);

                // Send token to backend
                try {
                    const deviceId = await getDeviceId();
                    const platform = Capacitor.getPlatform() as 'ios' | 'android';

                    const response = await fetch('/api/push-tokens/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: token.value,
                            deviceId,
                            platform
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        log.info('✅ Token registered with server');
                        setIsRegistered(true);
                        toast.success('Push notifications enabled');
                    } else {
                        log.error('❌ Failed to register token with server:', result.error);
                    }
                } catch (error) {
                    log.error('❌ Error sending token to server:', error);
                }
            });

            // 4. Listen for registration errors
            await PushNotifications.addListener('registrationError', (error: any) => {
                log.error('❌ Push registration failed:', error);
            });

            // 5. Handle notifications when app is in foreground
            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                log.info('📬 Push notification received (foreground):', notification);

                // Show toast for foreground notifications
                toast.custom((t) => (
                    <div className= "bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-md border border-gray-200 dark:border-gray-700" >
                    <div className="flex items-start gap-3" >
                <div className="text-2xl" >🔔</div>
                < div className = "flex-1" >
                <h4 className="font-semibold text-gray-900 dark:text-white" >
                { notification.title }
                </h4>
                < p className = "text-sm text-gray-600 dark:text-gray-400 mt-1" >
                { notification.body }
                </p>
                </div>
                < button
                onClick = {() => toast.dismiss(t.id)
}
className = "text-gray-400 hover:text-gray-600"
    >
                ✕
</button>
    </div>
    </div>
        ), { duration: 5000 });
      });

// 6. Handle notification tap (when app is in background/closed)
await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    log.info('📱 Notification tapped:', action);

    // Navigate based on notification data
    const data = action.notification.data;
    if (data?.type === 'visa_expiry') {
        window.location.href = '/notifications';
    }
});

    } catch (error) {
    log.error('❌ Error initializing push notifications:', error);
}
  };

return {
    isRegistered,
    permissionGranted
};
}

/**
 * Get unique device identifier
 */
async function getDeviceId(): Promise<string> {
    try {
        const { Device } = await import('@capacitor/device');
        const info = await Device.getId();
        return info.identifier || `device_${Date.now()}`;
    } catch (error) {
        // Fallback to random ID
        return `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
}
