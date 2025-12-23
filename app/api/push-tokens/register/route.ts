import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

export const dynamic = 'force-dynamic';

/**
 * Register or update a device's push notification token
 * POST /api/push-tokens/register
 * Body: { token: string, deviceId: string, platform: 'ios' | 'android' }
 */
export async function POST(request: NextRequest) {
    try {
        const { token, deviceId, platform } = await request.json();

        if (!token || !deviceId || !platform) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: token, deviceId, platform' },
                { status: 400 }
            );
        }

        // Get current user from auth header (if using Supabase Auth)
        const authHeader = request.headers.get('authorization');
        let userId = null;

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        // Upsert the token (insert or update if exists)
        const { data, error } = await supabase
            .from('push_tokens')
            .upsert(
                {
                    token,
                    device_id: deviceId,
                    platform,
                    user_id: userId,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'device_id'
                }
            )
            .select()
            .single();

        if (error) {
            // If table doesn't exist, return helpful error
            if (error.code === '42P01') {
                log.error('push_tokens table does not exist. Run migration first.');
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Push tokens table not configured. Please run database migrations.'
                    },
                    { status: 500 }
                );
            }

            throw error;
        }

        log.info(`✅ Registered push token for device ${deviceId} (${platform})`);

        return NextResponse.json({
            success: true,
            message: 'Push token registered successfully',
            data
        });

    } catch (error) {
        log.error('Error registering push token:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to register push token',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * Delete a device's push notification token (for logout/unregister)
 * DELETE /api/push-tokens/register
 * Body: { deviceId: string }
 */
export async function DELETE(request: NextRequest) {
    try {
        const { deviceId } = await request.json();

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: 'Missing deviceId' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('push_tokens')
            .delete()
            .eq('device_id', deviceId);

        if (error) throw error;

        log.info(`✅ Deleted push token for device ${deviceId}`);

        return NextResponse.json({
            success: true,
            message: 'Push token deleted successfully'
        });

    } catch (error) {
        log.error('Error deleting push token:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete push token'
            },
            { status: 500 }
        );
    }
}
