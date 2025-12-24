export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          name: string
          role: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          name: string
          role: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          days_threshold: number
          id: string
          is_active: boolean | null
          name: string
          subject: string
          type: string
          updated_at: string | null
          variables: string[]
        }
        Insert: {
          content: string
          created_at?: string | null
          days_threshold?: number
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          type: string
          updated_at?: string | null
          variables: string[]
        }
        Update: {
          content?: string
          created_at?: string | null
          days_threshold?: number
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          type?: string
          updated_at?: string | null
          variables?: string[]
        }
        Relationships: []
      }
      employee_aliases: {
        Row: {
          alias: string
          company_name: string
          created_at: string | null
          employee_id: string
          id: string
        }
        Insert: {
          alias: string
          company_name: string
          created_at?: string | null
          employee_id: string
          id?: string
        }
        Update: {
          alias?: string
          company_name?: string
          created_at?: string | null
          employee_id?: string
          id?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_number: string | null
          document_type: string
          employee_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          issuing_authority: string | null
          mime_type: string | null
          notes: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          document_type: string
          employee_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          issuing_authority?: string | null
          mime_type?: string | null
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          employee_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          issuing_authority?: string | null
          mime_type?: string | null
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employee_table: {
        Row: {
          basic_salary: number | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          date_of_birth: string | null
          eid: string | null
          email_id: string | null
          employee_id: string
          home_phone_number: string | null
          id: string
          is_active: boolean | null
          joining_date: string | null
          labourcard_expiry: string | null
          labourcard_no: string | null
          leave_date: string | null
          lulu_wps_card: string | null
          mobile_number: string | null
          name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_no: string | null
          status: string | null
          temp_renewal_notes: string | null
          trade: string | null
          updated_at: string | null
          visa_expiry_date: string | null
          visa_number: string | null
          visa_status: string | null
          visa_type: string | null
          visastamping_date: string | null
          wcc: string | null
        }
        Insert: {
          basic_salary?: number | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          eid?: string | null
          email_id?: string | null
          employee_id: string
          home_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          joining_date?: string | null
          labourcard_expiry?: string | null
          labourcard_no?: string | null
          leave_date?: string | null
          lulu_wps_card?: string | null
          mobile_number?: string | null
          name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_no?: string | null
          status?: string | null
          temp_renewal_notes?: string | null
          trade?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          visa_status?: string | null
          visa_type?: string | null
          visastamping_date?: string | null
          wcc?: string | null
        }
        Update: {
          basic_salary?: number | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          eid?: string | null
          email_id?: string | null
          employee_id?: string
          home_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          joining_date?: string | null
          labourcard_expiry?: string | null
          labourcard_no?: string | null
          leave_date?: string | null
          lulu_wps_card?: string | null
          mobile_number?: string | null
          name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_no?: string | null
          status?: string | null
          temp_renewal_notes?: string | null
          trade?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          visa_status?: string | null
          visa_type?: string | null
          visastamping_date?: string | null
          wcc?: string | null
        }
        Relationships: []
      }
      employee_table_duplicate: {
        Row: {
          basic_salary: number | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          date_of_birth: string | null
          eid: string | null
          email_id: string | null
          employee_id: string
          home_phone_number: string | null
          id: string
          is_active: boolean | null
          joining_date: string | null
          labourcard_expiry: string | null
          labourcard_no: string | null
          leave_date: string | null
          lulu_wps_card: string | null
          mobile_number: string | null
          name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_no: string | null
          status: string | null
          trade: string | null
          updated_at: string | null
          visa_expiry_date: string | null
          visa_number: string | null
          visa_status: string | null
          visa_type: string | null
          visastamping_date: string | null
          wcc: string | null
        }
        Insert: {
          basic_salary?: number | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          eid?: string | null
          email_id?: string | null
          employee_id: string
          home_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          joining_date?: string | null
          labourcard_expiry?: string | null
          labourcard_no?: string | null
          leave_date?: string | null
          lulu_wps_card?: string | null
          mobile_number?: string | null
          name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_no?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          visa_status?: string | null
          visa_type?: string | null
          visastamping_date?: string | null
          wcc?: string | null
        }
        Update: {
          basic_salary?: number | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          eid?: string | null
          email_id?: string | null
          employee_id?: string
          home_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          joining_date?: string | null
          labourcard_expiry?: string | null
          labourcard_no?: string | null
          leave_date?: string | null
          lulu_wps_card?: string | null
          mobile_number?: string | null
          name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_no?: string | null
          status?: string | null
          trade?: string | null
          updated_at?: string | null
          visa_expiry_date?: string | null
          visa_number?: string | null
          visa_status?: string | null
          visa_type?: string | null
          visastamping_date?: string | null
          wcc?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string | null
          days_until_expiry: number | null
          email_sent: boolean | null
          employee_id: string | null
          errors: string[] | null
          id: string
          manual_trigger: string | null
          push_sent: boolean | null
          sent_to: string[]
          type: string
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          created_at?: string | null
          days_until_expiry?: number | null
          email_sent?: boolean | null
          employee_id?: string | null
          errors?: string[] | null
          id?: string
          manual_trigger?: string | null
          push_sent?: boolean | null
          sent_to: string[]
          type: string
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          created_at?: string | null
          days_until_expiry?: number | null
          email_sent?: boolean | null
          employee_id?: string | null
          errors?: string[] | null
          id?: string
          manual_trigger?: string | null
          push_sent?: boolean | null
          sent_to?: string[]
          type?: string
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          categories: Json | null
          created_at: string
          email: string
          email_enabled: string | null
          inapp: boolean | null
          push: boolean | null
          push_enabled: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string
          email?: string
          email_enabled?: string | null
          inapp?: boolean | null
          push?: boolean | null
          push_enabled?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          categories?: Json | null
          created_at?: string
          email?: string
          email_enabled?: string | null
          inapp?: boolean | null
          push?: boolean | null
          push_enabled?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
          id: string
          manual_trigger: string | null
          message: string | null
          metadata: Json | null
          read: boolean | null
          type: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          id?: string
          manual_trigger?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          type?: string | null
          user_id?: string
        }
        Update: {
          category?: string | null
          id?: string
          manual_trigger?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          push_token: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          push_token?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          push_token?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          last_active: string | null
          platform: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          platform: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          platform?: string
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_name: string | null
          fcm_token: string
          id: string
          is_active: boolean | null
          last_updated: string | null
          platform: string
          user_id: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          fcm_token: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          platform: string
          user_id?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          fcm_token?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          platform?: string
          user_id?: string | null
          user_type?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          settings_data: Json
          settings_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings_data?: Json
          settings_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings_data?: Json
          settings_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visa_history: {
        Row: {
          change_type: string | null
          changed_at: string
          changed_by: string | null
          employee_id: string
          id: string
          new_expiry_date: string | null
          new_status: string | null
          notes: string | null
          old_expiry_date: string | null
          old_status: string | null
        }
        Insert: {
          change_type?: string | null
          changed_at?: string
          changed_by?: string | null
          employee_id: string
          id?: string
          new_expiry_date?: string | null
          new_status?: string | null
          notes?: string | null
          old_expiry_date?: string | null
          old_status?: string | null
        }
        Update: {
          change_type?: string | null
          changed_at?: string
          changed_by?: string | null
          employee_id?: string
          id?: string
          new_expiry_date?: string | null
          new_status?: string | null
          notes?: string | null
          old_expiry_date?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_table"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visa_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "visa_expiry_monitor"
            referencedColumns: ["employee_id"]
          },
        ]
      }
    }
    Views: {
      company_document_folders_mv: {
        Row: {
          company_prefix: string | null
          display_name: string | null
          document_count: number | null
          last_modified: string | null
        }
        Relationships: []
      }
      employee_counts_by_company_mv: {
        Row: {
          company_prefix: string | null
          document_count: number | null
          employee_id: string | null
          employee_name: string | null
          last_modified: string | null
        }
        Relationships: []
      }
      notification_stats: {
        Row: {
          emails_sent: number | null
          failed_notifications: number | null
          notification_date: string | null
          pushes_sent: number | null
          total_notifications: number | null
          type: string | null
        }
        Relationships: []
      }
      performance_stats: {
        Row: {
          metric: string | null
          type: string | null
          value: string | null
        }
        Relationships: []
      }
      visa_expiry_monitor: {
        Row: {
          company_name: string | null
          days_until_expiry: number | null
          email_id: string | null
          emp_id: string | null
          employee_id: string | null
          name: string | null
          nationality: string | null
          passport_no: string | null
          trade: string | null
          urgency_level: string | null
          visa_expiry_date: string | null
        }
        Insert: {
          company_name?: string | null
          days_until_expiry?: never
          email_id?: string | null
          emp_id?: string | null
          employee_id?: string | null
          name?: string | null
          nationality?: string | null
          passport_no?: string | null
          trade?: string | null
          urgency_level?: never
          visa_expiry_date?: string | null
        }
        Update: {
          company_name?: string | null
          days_until_expiry?: never
          email_id?: string | null
          emp_id?: string | null
          employee_id?: string | null
          name?: string | null
          nationality?: string | null
          passport_no?: string | null
          trade?: string | null
          urgency_level?: never
          visa_expiry_date?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_visa_status: { Args: { expiry_date: string }; Returns: string }
      get_admin_devices: {
        Args: never
        Returns: {
          device_id: string
          device_name: string
          fcm_token: string
          platform: string
          user_id: string
        }[]
      }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_document_folders_overview: {
        Args: never
        Returns: {
          document_count: number
          folder_name: string
          last_modified: string
        }[]
      }
      get_employee_folders_for_company: {
        Args: { p_company_prefix: string }
        Returns: {
          document_count: number
          employee_id: string
          last_modified: string
        }[]
      }
      get_employee_uuid_by_string_id: {
        Args: { emp_string_id: string }
        Returns: string
      }
      get_expiring_visas_on_days: {
        Args: { days: number[] }
        Returns: {
          company_name: string
          days_until_expiry: number
          email_id: string
          emp_id: string
          employee_id: string
          name: string
          nationality: string
          passport_no: string
          trade: string
          urgency_level: string
          visa_expiry_date: string
        }[]
      }
      get_expiring_visas_within_days: {
        Args: { threshold_days?: number }
        Returns: {
          company_name: string
          days_until_expiry: number
          email_id: string
          emp_id: string
          employee_id: string
          name: string
          nationality: string
          passport_no: string
          trade: string
          urgency_level: string
          visa_expiry_date: string
        }[]
      }
      get_growth_trend_data: { Args: { months_back?: number }; Returns: Json }
      get_index_usage_stats: {
        Args: never
        Returns: {
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          indexname: string
          schemaname: string
          tablename: string
        }[]
      }
      get_notification_stats: {
        Args: never
        Returns: {
          failed_count: number
          pending_count: number
          sent_count: number
          today_count: number
          total_count: number
          week_count: number
        }[]
      }
      get_unique_companies: { Args: never; Returns: string[] }
      get_visa_trends: { Args: { months_back?: number }; Returns: Json }
      log_notification_attempt: {
        Args: {
          p_days_until_expiry?: number
          p_email_sent?: boolean
          p_employee_id?: string
          p_errors?: string[]
          p_push_sent?: boolean
          p_sent_to?: string[]
          p_type: string
          p_urgency?: string
        }
        Returns: string
      }
      map_company_display_name: { Args: { prefix: string }; Returns: string }
      parse_date_any: { Args: { p: string }; Returns: string }
      parse_date_try:
        | { Args: { p: string }; Returns: string }
        | { Args: { p_fmt: string; p_text: string }; Returns: string }
      register_device: {
        Args: {
          p_device_name?: string
          p_fcm_token: string
          p_platform: string
          p_user_id: string
          p_user_type: string
        }
        Returns: string
      }
      search_documents_and_employees: {
        Args: { search_term: string }
        Returns: {
          company_name: string
          created_at: string
          document_type: string
          employee_id: string
          employee_name: string
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          notes: string
          updated_at: string
          uploaded_by: string
        }[]
      }
      search_documents_rpc: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          company_name: string
          employee_id: string
          employee_name: string
          file_name: string
          file_path: string
          id: string
          uploaded_at: string
        }[]
      }
      search_employee_folders: {
        Args: { limit_count?: number; search_term: string }
        Returns: {
          company_name: string
          document_count: number
          employee_id: string
          employee_name: string
          last_modified: string
        }[]
      }
      search_notifications_rpc: {
        Args: { p_limit?: number; p_offset?: number; p_search_term?: string }
        Returns: {
          category: string
          created_at: string
          id: string
          message: string
          read: boolean
          status: string
          title: string
          type: string
          user_id: string
        }[]
      }
      send_visa_notifications: { Args: never; Returns: undefined }
      should_send_reminder_today: {
        Args: never
        Returns: {
          employees_count: number
          reminder_days: number[]
          should_send: boolean
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      test_dashboard_connection: { Args: never; Returns: Json }
      test_dashboard_simple: { Args: never; Returns: Json }
      test_index_performance: {
        Args: never
        Returns: {
          execution_time_ms: number
          rows_returned: number
          test_name: string
        }[]
      }
      to_money_numeric: { Args: { p: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
