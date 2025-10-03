import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/logger';

// Force static generation for mobile builds
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Get notifications from database
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      log.error('Failed to fetch notifications:', error);
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
