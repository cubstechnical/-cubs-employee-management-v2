import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settings';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const settingsType = searchParams.get('type');

    console.log(`📋 Fetching user settings for user ${userId}${settingsType ? ` (type: ${settingsType})` : ''}`);

    let result;
    if (settingsType) {
      result = await SettingsService.getUserSettings(userId, settingsType);
    } else {
      result = await SettingsService.getAllUserSettings(userId);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        userId: userId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in user settings API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { settingsType, settingsData } = body;

    if (!settingsType || !settingsData) {
      return NextResponse.json({
        success: false,
        error: 'settingsType and settingsData are required'
      }, { status: 400 });
    }

    console.log(`📝 Updating user settings for user ${userId} (type: ${settingsType})`);

    const result = await SettingsService.updateUserSettings(userId, settingsType, settingsData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        userId: userId,
        settingsType: settingsType
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error updating user settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { allSettings } = body;

    if (!allSettings || typeof allSettings !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'allSettings object is required'
      }, { status: 400 });
    }

    console.log(`📝 Updating all user settings for user ${userId}`);

    // Update each settings type
    for (const [settingsType, settingsData] of Object.entries(allSettings)) {
      const result = await SettingsService.updateUserSettings(userId, settingsType, settingsData);
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to update ${settingsType}: ${result.error}`
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All settings updated successfully',
      userId: userId
    });
  } catch (error) {
    console.error('❌ Error updating all user settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


