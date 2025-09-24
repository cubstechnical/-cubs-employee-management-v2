import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check if notifications table exists
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation "notifications" does not exist')) {
        return NextResponse.json({
          success: true,
          notifications: [],
          message: 'Notifications table does not exist yet'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notifications',
      notifications: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, recipient, category } = body;

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        title,
        message,
        type,
        recipient,
        category,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      notification: data[0]
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create notification'
    }, { status: 500 });
  }
}
