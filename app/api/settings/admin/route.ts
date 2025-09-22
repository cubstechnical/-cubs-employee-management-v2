import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settings';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Get current user and check if admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || profile?.user_role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get('key');

    console.log(`📋 Fetching admin settings${settingKey ? ` (key: ${settingKey})` : ''}`);

    const result = await SettingsService.getAdminSettings(settingKey || undefined);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        adminId: session.user.id
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in admin settings API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user and check if admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || profile?.user_role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { settingKey, settingValue, settingType, description, isPublic } = body;

    if (!settingKey || !settingValue || !settingType) {
      return NextResponse.json({
        success: false,
        error: 'settingKey, settingValue, and settingType are required'
      }, { status: 400 });
    }

    console.log(`📝 Updating admin settings (key: ${settingKey})`);

    const result = await SettingsService.updateAdminSettings(
      settingKey, 
      settingValue, 
      settingType, 
      description, 
      isPublic || false
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Admin settings updated successfully',
        adminId: session.user.id,
        settingKey: settingKey
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error updating admin settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user and check if admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || profile?.user_role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { allSettings } = body;

    if (!allSettings || typeof allSettings !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'allSettings object is required'
      }, { status: 400 });
    }

    console.log(`📝 Updating all admin settings`);

    // Update each setting
    for (const [settingKey, settingData] of Object.entries(allSettings)) {
      const { settingValue, settingType, description, isPublic } = settingData as any;
      
      const result = await SettingsService.updateAdminSettings(
        settingKey, 
        settingValue, 
        settingType, 
        description, 
        isPublic || false
      );
      
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to update ${settingKey}: ${result.error}`
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All admin settings updated successfully',
      adminId: session.user.id
    });
  } catch (error) {
    console.error('❌ Error updating all admin settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

