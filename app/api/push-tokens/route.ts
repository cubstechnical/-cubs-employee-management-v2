import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { token, platform, user_id } = await request.json();

        if (!token || !platform) {
            return NextResponse.json(
                { success: false, error: 'Token and platform are required' },
                { status: 400 }
            );
        }

        log.info(`Registering push token for ${platform} (User: ${user_id || 'anonymous'})`);

        // Store token in database
        const { error } = await supabase
            .from('push_tokens')
            .upsert({
                token,
                platform, // 'ios', 'android', 'web'
                user_id,
                last_active: new Date().toISOString()
            }, { onConflict: 'token' });

        if (error) {
            // Graceful handling if table missing (dev mode)
            if (error.code === '42P01') { // undefined_table
                log.warn('push_tokens table missing. Skipping registration.');
                return NextResponse.json({ success: true, warning: 'Table missing' });
            }

            log.error('Failed to store push token:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to store token' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        log.error('Push token API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
