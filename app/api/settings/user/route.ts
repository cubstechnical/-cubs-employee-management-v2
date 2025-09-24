import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return default settings since we don't have user settings table yet
    const defaultSettings = {
      profile: {
        name: '',
        email: ''
      },
      notifications: {
        email: true,
        push: true,
        sms: false,
        visaExpiryAlerts: true,
        documentUploadAlerts: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: 'strong'
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY'
      },
      appearance: {
        theme: 'system',
        compactMode: false,
        showAnimations: true
      }
    };

    return NextResponse.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user settings'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, just return success since we don't have user settings table yet
    // In the future, this would save to a user_settings table
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save user settings'
    }, { status: 500 });
  }
}
