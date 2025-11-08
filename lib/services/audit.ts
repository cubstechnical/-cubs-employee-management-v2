import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface AuditLog {
  id?: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_email?: string;
  created_at?: string;
}

export class AuditService {
  /**
   * Log an audit trail entry
   */
  static async logAudit(auditData: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('audit_logs')
        .insert({
          table_name: auditData.table_name,
          record_id: auditData.record_id,
          action: auditData.action,
          old_values: auditData.old_values || null,
          new_values: auditData.new_values || null,
          user_id: auditData.user_id || null,
          user_email: auditData.user_email || null,
        });

      if (error) {
        log.error('❌ Error logging audit:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        // Don't throw error to avoid breaking the main operation
      } else {
        log.info('✅ Audit logged successfully');
      }
    } catch (err) {
      log.error('❌ Error in audit logging:', err);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get audit logs for a specific record
   */
  static async getAuditLogs(tableName: string, recordId: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('❌ Error fetching audit logs:', error);
        return [];
      }

      return (data as unknown as AuditLog[]) || [];
    } catch (err) {
      log.error('❌ Error in getAuditLogs:', err);
      return [];
    }
  }

  /**
   * Get audit logs for a specific table
   */
  static async getTableAuditLogs(tableName: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        log.error('❌ Error fetching table audit logs:', error);
        return [];
      }

      return (data as unknown as AuditLog[]) || [];
    } catch (err) {
      log.error('❌ Error in getTableAuditLogs:', err);
      return [];
    }
  }

  /**
   * Get current user info for audit logging
   */
  static async getCurrentUserInfo(): Promise<{ id?: string; email?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return {
          id: user.id,
          email: user.email || undefined
        };
      }
      
      return {};
    } catch (err) {
      log.error('❌ Error getting current user info:', err);
      return {};
    }
  }
}
