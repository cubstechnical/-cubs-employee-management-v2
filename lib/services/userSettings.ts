'use client';

import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface UserSettings {
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  timezone: string;
  user_id?: string;
  updated_at?: string;
}

export class UserSettingsService {
  /**
   * Get user settings for the current user
   */
  static async getUserSettings(): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Get user settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        log.error('Failed to fetch user settings:', error);
        return {
          success: false,
          error: 'Failed to fetch settings'
        };
      }

      // Return default settings if none found
      const defaultSettings: UserSettings = {
        theme: 'light',
        notifications_enabled: true,
        email_notifications: true,
        language: 'en',
        timezone: 'UTC'
      };

      return {
        success: true,
        settings: (settings as unknown as UserSettings) || defaultSettings
      };
    } catch (error) {
      log.error('User settings service error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; settings?: UserSettings; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      // Update or create user settings
      const { data: updatedSettings, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        log.error('Failed to update user settings:', error);
        return {
          success: false,
          error: 'Failed to update settings'
        };
      }

      return {
        success: true,
        settings: updatedSettings as unknown as UserSettings
      };
    } catch (error) {
      log.error('Update user settings error:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }
}
