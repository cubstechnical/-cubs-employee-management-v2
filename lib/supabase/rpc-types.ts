// Type definitions for custom Supabase RPC functions
// This file extends the default Supabase types with our custom RPC function signatures

import { SupabaseClient } from '@supabase/supabase-js';

// RPC Response Types

export interface NotificationStatsRow {
    total_count: number;
    sent_count: number;
    pending_count: number;
    failed_count: number;
    today_count: number;
    week_count: number;
}

export interface NotificationSearchResult {
    id: string;
    title: string;
    message: string;
    type: string;
    status: string;
    user_id: string;
    created_at: string;
    category: string;
    read: boolean;
}

// Type-safe RPC helper functions
export async function rpcGetNotificationStats(supabase: SupabaseClient) {
    return supabase.rpc('get_notification_stats') as unknown as Promise<{
        data: NotificationStatsRow[] | null;
        error: { code: string; message: string } | null;
    }>;
}

export async function rpcSearchNotifications(
    supabase: SupabaseClient,
    params: { p_search_term: string; p_limit: number; p_offset: number }
) {
    return supabase.rpc('search_notifications_rpc', params) as unknown as Promise<{
        data: NotificationSearchResult[] | null;
        error: { code: string; message: string } | null;
    }>;
}
