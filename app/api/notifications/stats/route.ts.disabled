import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';
import { rpcGetNotificationStats } from '@/lib/supabase/rpc-types';

// Allow dynamic execution for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Use optimized RPC for accurate stats
        const { data: stats, error } = await rpcGetNotificationStats(supabase);

        if (error) {
            log.error('Failed to fetch notification stats:', error);

            // Graceful degradation: If RPC doesn't exist, return zero stats
            if (error.code === '42883' || error.code === '42703' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                log.warn('Notification stats RPC does not exist yet. Returning zeros.');
                return NextResponse.json({
                    success: true,
                    stats: {
                        total_count: 0,
                        sent_count: 0,
                        pending_count: 0,
                        failed_count: 0,
                        today_count: 0,
                        week_count: 0
                    },
                    warning: 'Notifications optimization not yet applied. Please run database migrations.'
                });
            }

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch notification stats',
                    stats: null
                },
                { status: 500 }
            );
        }

        // RPC returns array with single row
        const statsRow = stats && stats.length > 0 ? stats[0] : null;

        return NextResponse.json({
            success: true,
            stats: statsRow || {
                total_count: 0,
                sent_count: 0,
                pending_count: 0,
                failed_count: 0,
                today_count: 0,
                week_count: 0
            }
        });

    } catch (error) {
        log.error('Notification stats API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                stats: null
            },
            { status: 500 }
        );
    }
}
