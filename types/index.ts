export interface User {
  id: string;
  email: string;
  name: string;
  role: 'master_admin' | 'admin';
  avatar_url?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminInvite {
  id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  dob: string;
  trade: string;
  nationality: string;
  joining_date: string;
  passport_no: string;
  passport_expiry: string;
  labourcard_no: string;
  labourcard_expiry: string;
  visastamping_date: string;
  visa_expiry_date: string;
  eid: string;
  leave_date?: string;
  wcc: string;
  lulu_wps_card: string;
  basic_salary: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  passport_number?: string;
  visa_number?: string;
  visa_type?: string;
  visa_status: string;
  date_of_birth?: string;
  join_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  salary?: number;
  mobile_number?: string;
  home_phone_number?: string;
  email_id?: string;
  company_id?: string;
}

export interface Document {
  id: string;
  employee_id: string;
  name?: string;
  file_name: string;
  type?: 'passport' | 'visa' | 'contract' | 'id_card' | 'other';
  document_type: string;
  file_url: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  created_at: string;
  updated_at?: string;
  notes?: string;
  is_active?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

export interface VisaNotification {
  id: string;
  employee_id: string;
  employee_name: string;
  visa_expiry_date: string;
  days_remaining: number;
  notification_sent: boolean;
  last_sent_at?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  manager_id?: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  employee_id: string;
  type: 'document' | 'visa_renewal' | 'salary_change' | 'termination';
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  approved_by?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeMapping {
  id: string;
  employee_id: string;
  project_id: string;
  project_name: string;
  role: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_employees: number;
  active_employees: number;
  expiring_visas: number;
  pending_approvals: number;
  total_documents: number;
  departments_count: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchFilters {
  search?: string;
  department?: string;
  status?: string;
  visa_expiry?: 'expired' | 'expiring_soon' | 'valid';
  date_from?: string;
  date_to?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
} 