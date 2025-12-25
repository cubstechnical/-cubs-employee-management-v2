import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';
import { rpcSearchNotifications } from '@/lib/supabase/rpc-types';

// Allow dynamic execution for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use admin client if available to ensure we have permission to execute the RPC
    const client = supabaseAdmin || supabase;

    // Use optimized RPC for search with pagination
    const { data: notifications, error } = await rpcSearchNotifications(client, {
      p_search_term: searchTerm,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      log.error('Failed to fetch notifications:', error);

      // Graceful degradation: If RPC doesn't exist, return empty array
      if (error.code === '42883' || error.code === '42703' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        log.warn('Notifications RPC does not exist yet. Returning empty array.');
        return NextResponse.json({
          success: true,
          notifications: [],
          warning: 'Notifications optimization not yet applied. Please run database migrations.'
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch notifications',
          notifications: []
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    log.error('Notifications API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        notifications: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', user_id } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        user_id,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      log.error('Failed to create notification:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification
    });

  } catch (error) {
    log.error('Create notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
