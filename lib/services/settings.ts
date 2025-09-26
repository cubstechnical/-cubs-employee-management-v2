import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface UserSettings {
  profile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    visaExpiryAlerts?: boolean;
    documentUploadAlerts?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
    sessionTimeout?: number;
    passwordPolicy?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
  };
  appearance?: {
    theme?: string;
    compactMode?: boolean;
    showAnimations?: boolean;
  };
}

export interface AdminSettings {
  notifications?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    visaExpiryAlerts?: boolean;
    documentUploadAlerts?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
    sessionTimeout?: number;
    passwordPolicy?: string;
  };
  system?: {
    autoBackup?: boolean;
    backupFrequency?: string;
    retentionDays?: number;
  };
  appearance?: {
    theme?: string;
    compactMode?: boolean;
    showAnimations?: boolean;
  };
}

export class SettingsService {
  // Get user settings by type
  static async getUserSettings(userId: string, settingsType: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', userId)
        .eq('settings_type', settingsType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return default
          return { success: true, data: {} };
        }
        log.error('❌ Error fetching user settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.settings_data || {} };
    } catch (error) {
      log.error('❌ Unexpected error fetching user settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get all user settings
  static async getAllUserSettings(userId: string): Promise<{ success: boolean; data?: UserSettings; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings_type, settings_data')
        .eq('user_id', userId);

      if (error) {
        log.error('❌ Error fetching all user settings:', error);
        return { success: false, error: error.message };
      }

      const settings: UserSettings = {};
      data?.forEach(item => {
        settings[item.settings_type as keyof UserSettings] = item.settings_data as any;
      });

      return { success: true, data: settings };
    } catch (error) {
      log.error('❌ Unexpected error fetching all user settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update user settings
  static async updateUserSettings(userId: string, settingsType: string, settingsData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          settings_type: settingsType,
          settings_data: settingsData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        log.error('❌ Error updating user settings:', error);
        return { success: false, error: error.message };
      }

      log.info(`✅ User settings updated for ${settingsType}`);
      return { success: true };
    } catch (error) {
      log.error('❌ Unexpected error updating user settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get admin settings
  static async getAdminSettings(settingKey?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let query = supabase
        .from('admin_settings')
        .select('setting_key, setting_value, setting_type, description, is_public');

      if (settingKey) {
        query = query.eq('setting_key', settingKey);
      }

      const { data, error } = await query;

      if (error) {
        log.error('❌ Error fetching admin settings:', error);
        return { success: false, error: error.message };
      }

      if (settingKey) {
        return { success: true, data: data?.[0]?.setting_value || {} };
      }

      const settings: any = {};
      data?.forEach(item => {
        settings[item.setting_key as string] = {
          value: item.setting_value,
          type: item.setting_type,
          description: item.description,
          is_public: item.is_public
        };
      });

      return { success: true, data: settings };
    } catch (error) {
      log.error('❌ Unexpected error fetching admin settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update admin settings
  static async updateAdminSettings(settingKey: string, settingValue: any, settingType: string, description?: string, isPublic: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          setting_type: settingType,
          description: description,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        });

      if (error) {
        log.error('❌ Error updating admin settings:', error);
        return { success: false, error: error.message };
      }

      log.info(`✅ Admin settings updated for ${settingKey}`);
      return { success: true };
    } catch (error) {
      log.error('❌ Unexpected error updating admin settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get default settings for new users
  static getDefaultUserSettings(): UserSettings {
    return {
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
  }

  // Get default admin settings
  static getDefaultAdminSettings(): AdminSettings {
    return {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        visaExpiryAlerts: true,
        documentUploadAlerts: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: 'strong'
      },
      system: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30
      },
      appearance: {
        theme: 'system',
        compactMode: false,
        showAnimations: true
      }
    };
  }

  // Initialize user settings if they don't exist
  static async initializeUserSettings(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultSettings = this.getDefaultUserSettings();
      
      for (const [settingsType, settingsData] of Object.entries(defaultSettings)) {
        const result = await this.updateUserSettings(userId, settingsType, settingsData);
        if (!result.success) {
          return result;
        }
      }

      log.info(`✅ User settings initialized for user ${userId}`);
      return { success: true };
    } catch (error) {
      log.error('❌ Unexpected error initializing user settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
