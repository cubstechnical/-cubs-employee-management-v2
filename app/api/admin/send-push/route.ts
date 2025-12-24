import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/services/firebasePush';
import { log } from '@/lib/utils/productionLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Admin (basic check, enhance as needed)
        // For now, we just check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { title, body, platform } = await request.json();

        if (!title || !body) {
            return NextResponse.json({ success: false, error: 'Title and body required' }, { status: 400 });
        }

        // 2. Fetch Tokens
        let query = supabase.from('push_tokens').select('token');

        if (platform && platform !== 'all') {
            query = query.eq('platform', platform);
        }

        const { data: tokens, error } = await query;

        if (error) {
            // Graceful fallback if table missing
            if (error.code === '42P01') {
                return NextResponse.json({
                    success: false,
                    error: 'Push tokens table missing. Run migrations.',
                    warning: 'Table missing'
                });
            }
            return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
        }

        if (!tokens || tokens.length === 0) {
            return NextResponse.json({ success: true, message: 'No devices registered', count: 0 });
        }

        const tokenList = tokens.map((t: any) => t.token);

        // 3. Send via Firebase
        if (process.env.DISABLE_EMAILS === 'true') {
            log.info(`[MOCK] Sending Push to ${tokenList.length} devices: ${title} - ${body}`);
            return NextResponse.json({
                success: true,
                message: 'Mock notification sent (Dev Mode)',
                count: tokenList.length
            });
        }

        const result = await sendPushNotification(tokenList, title, body);

        return NextResponse.json({
            success: result.success,
            count: tokenList.length,
            result
        });

    } catch (error) {
        log.error('Send Push API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
