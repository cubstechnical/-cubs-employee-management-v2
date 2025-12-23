import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

// Allow dynamic execution for API routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user settings from database
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      // Return default settings for unauthenticated requests (graceful degradation)
      const defaultSettings = {
        theme: 'system',
        compact_mode: false,
        notifications_enabled: true,
        email_notifications: true,
        language: 'en',
        timezone: 'UTC'
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        warning: 'Using default settings (no authentication provided)'
      });
    }

    // Extract user from auth header or session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      log.warn('Invalid authentication for settings API, using defaults');
      const defaultSettings = {
        theme: 'system',
        compact_mode: false,
        notifications_enabled: true,
        email_notifications: true,
        language: 'en',
        timezone: 'UTC'
      };

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        warning: 'Using default settings (invalid authentication)'
      });
    }

    // Get user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        log.warn('user_settings table does not exist yet. Returning defaults.');
        const defaultSettings = {
          theme: 'system',
          compact_mode: false,
          notifications_enabled: true,
          email_notifications: true,
          language: 'en',
          timezone: 'UTC'
        };

        return NextResponse.json({
          success: true,
          settings: defaultSettings,
          warning: 'Settings table not yet created. Using defaults.'
        });
      }

      log.error('Failed to fetch user settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Return default settings if none found
    const defaultSettings = {
      theme: 'system',
      compact_mode: false,
      notifications_enabled: true,
      email_notifications: true,
      language: 'en',
      timezone: 'UTC'
    };

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    log.error('User settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Update or create user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...body,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Gracefully handle missing table
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        log.warn('user_settings table does not exist. Cannot save settings.');
        return NextResponse.json({
          success: false,
          error: 'Settings storage not available. Please run database migrations.',
          warning: 'Table not yet created'
        });
      }

      log.error('Failed to update user settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    log.error('Update user settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
