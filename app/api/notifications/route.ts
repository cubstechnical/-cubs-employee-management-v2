import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching notifications from database...');
    
    // Check if notifications table exists by trying to query it
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.log('⚠️ Notifications table does not exist yet:', error.message);
      return NextResponse.json({
        success: true,
        notifications: [],
        message: 'Notifications table not created yet. Run the database migration to create it.',
        total: 0
      });
    }

    console.log(`✅ Fetched ${notifications?.length || 0} notifications`);
    
    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: notifications?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      notifications: [],
      total: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, type, recipient, category } = body;
    
    console.log('📝 Creating new notification...');
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: type || 'info',
        status: 'pending',
        recipient: recipient || 'info@cubstechnical.com',
        category: category || 'system'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating notification:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log('✅ Notification created successfully:', data.id);
    
    return NextResponse.json({
      success: true,
      notification: data
    });
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


