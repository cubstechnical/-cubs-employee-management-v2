import * as admin from 'firebase-admin';
import { log } from '@/lib/utils/productionLogger';

// Initialize Firebase Admin (do this once)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
        );

        // Only initialize if we have credentials
        if (serviceAccount.project_id) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            log.info('✅ Firebase Admin initialized successfully');
        } else {
            log.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid - Push notifications will be mocked');
        }
    } catch (error) {
        log.error('❌ Failed to initialize Firebase Admin:', error);
    }
}

export async function sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: any
) {
    try {
        // Return early if no tokens
        if (!tokens || tokens.length === 0) {
            return { success: true, successCount: 0, failureCount: 0, message: 'No tokens provided' };
        }

        // Mock if no firebase app (dev mode)
        if (!admin.apps.length) {
            log.info(`[MOCK PUSH] To ${tokens.length} devices: ${title}`);
            return { success: true, successCount: tokens.length, failureCount: 0, mock: true };
        }

        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            tokens // Array of FCM tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        log.info(`Push notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

        // Log failed tokens to help debugging (optional: remove invalid tokens from DB)
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp: any, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            log.warn(`Failed tokens: ${failedTokens.length}`, failedTokens); // Truncate if too many
        }

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        log.error('Error sending push notifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send notification to all registered devices
 * Used by cron jobs and server-side events
 */
export async function sendToAllDevices(
    title: string,
    body: string,
    data?: any
) {
    try {
        const { supabase } = await import('@/lib/supabase/client'); // Use client or admin depending on needs
        // Actually for cron jobs we might need admin access if RLS blocks reading tokens
        // But tokens table allows service role access.
        // Let's use the standard import pattern for server components if possible, 
        // or just raw fetch if we want to avoid circular deps. 
        // Best is to inject the tokens, but for convenience let's query here.

        // Dynamic import to avoid build issues if this file is imported on client
        const { createClient } = await import('@supabase/supabase-js');

        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseClient = createClient(sbUrl, sbKey);

        // Fetch all tokens
        const { data: tokens, error } = await supabaseClient
            .from('push_tokens')
            .select('token');

        if (error) {
            log.error('Error fetching push tokens:', error);
            return { success: false, error: error.message };
        }

        if (!tokens || tokens.length === 0) {
            log.info('No devices registered for push notifications');
            return { success: true, count: 0 };
        }

        const tokenList = tokens.map(t => t.token);

        // Remove duplicates
        const uniqueTokens = [...new Set(tokenList)];

        return await sendPushNotification(uniqueTokens, title, body, data);

    } catch (error) {
        log.error('Error in sendToAllDevices:', error);
        return { success: false, error };
    }
}
