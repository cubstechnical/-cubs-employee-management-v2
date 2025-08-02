import { supabase } from '../supabase/client';
import { Employee } from '../supabase/client';

export interface CreateEmployeeData {
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
  wcc: string;
  lulu_wps_card: string;
  basic_salary: string;
  company_name: string;
  visa_status?: string;
  status?: string;
  is_active?: boolean;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  employee_id: string;
}

export interface EmployeeFilters {
  company_name?: string;
  status?: string;
  visa_status?: string;
  trade?: string;
  nationality?: string;
  search?: string;
  is_temporary?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedEmployeesResponse {
  employees: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

export interface FilterOptions {
  companies: string[];
  trades: string[];
  nationalities: string[];
  statuses: string[];
  visaStatuses: string[];
}

export class EmployeeService {
  static async getEmployees(
    pagination: PaginationParams,
    filters?: EmployeeFilters
  ): Promise<PaginatedEmployeesResponse> {
    try {
      // Real Supabase query
      let query = supabase
        .from('employee_table')
        .select('*');

      // Apply filters
      if (filters?.company_name && filters.company_name !== 'All') {
        query = query.eq('company_name', filters.company_name);
      }
      if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }
      if (filters?.visa_status && filters.visa_status !== 'All') {
        query = query.eq('visa_status', filters.visa_status);
      }
      if (filters?.trade && filters.trade !== 'All') {
        query = query.eq('trade', filters.trade);
      }
      if (filters?.nationality && filters.nationality !== 'All') {
        query = query.eq('nationality', filters.nationality);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,trade.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,nationality.ilike.%${filters.search}%`);
      }

      // Filter for temporary workers (employees with specific patterns in employee_id)
      if (filters?.is_temporary) {
        query = query.or('employee_id.ilike.%TEMP%,employee_id.ilike.%temp%,employee_id.ilike.%Temporary%,employee_id.ilike.%temporary%');
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data: employees, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Get total count with the same filters
      let countQuery = supabase
        .from('employee_table')
        .select('*', { count: 'exact', head: true });

      // Apply the same filters to count query
      if (filters?.company_name && filters.company_name !== 'All') {
        countQuery = countQuery.eq('company_name', filters.company_name);
      }
      if (filters?.status && filters.status !== 'All') {
        countQuery = countQuery.eq('status', filters.status);
      }
      if (filters?.visa_status && filters.visa_status !== 'All') {
        countQuery = countQuery.eq('visa_status', filters.visa_status);
      }
      if (filters?.trade && filters.trade !== 'All') {
        countQuery = countQuery.eq('trade', filters.trade);
      }
      if (filters?.nationality && filters.nationality !== 'All') {
        countQuery = countQuery.eq('nationality', filters.nationality);
      }
      if (filters?.search) {
        countQuery = countQuery.or(`name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,trade.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,nationality.ilike.%${filters.search}%`);
      }
      if (filters?.is_temporary) {
        countQuery = countQuery.or('employee_id.ilike.%TEMP%,employee_id.ilike.%temp%,employee_id.ilike.%Temporary%,employee_id.ilike.%temporary%');
      }

      const { count } = await countQuery;
      const total = count || 0;
      const totalPages = Math.ceil(total / pagination.pageSize);

      return {
        employees: (employees || []) as unknown as Employee[],
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        error: null
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return {
        employees: [],
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const { data: employee, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return employee as unknown as Employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  static async createEmployee(employeeData: CreateEmployeeData): Promise<Employee | null> {
    try {
      const { data: employee, error } = await supabase
        .from('employee_table')
        .insert([employeeData as any])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return employee as unknown as Employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      return null;
    }
  }

  static async updateEmployee(employeeData: UpdateEmployeeData): Promise<Employee | null> {
    try {
      const { data: employee, error } = await supabase
        .from('employee_table')
        .update(employeeData as any)
        .eq('employee_id', employeeData.employee_id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return employee as unknown as Employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      return null;
    }
  }

  static async deleteEmployee(employeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('employee_id', employeeId);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  static async getFilterOptions(): Promise<FilterOptions> {
    try {
      // Get unique companies
      const { data: companies } = await supabase
        .from('employee_table')
        .select('company_name')
        .not('company_name', 'is', null);

      // Get unique trades
      const { data: trades } = await supabase
        .from('employee_table')
        .select('trade')
        .not('trade', 'is', null);

      // Get unique nationalities
      const { data: nationalities } = await supabase
        .from('employee_table')
        .select('nationality')
        .not('nationality', 'is', null);

      // Get unique statuses
      const { data: statuses } = await supabase
        .from('employee_table')
        .select('status')
        .not('status', 'is', null);

      // Get unique visa statuses
      const { data: visaStatuses } = await supabase
        .from('employee_table')
        .select('visa_status')
        .not('visa_status', 'is', null);

      return {
        companies: Array.from(new Set(companies?.map(c => c.company_name as string) || [])).sort(),
        trades: Array.from(new Set(trades?.map(t => t.trade as string) || [])).sort(),
        nationalities: Array.from(new Set(nationalities?.map(n => n.nationality as string) || [])).sort(),
        statuses: Array.from(new Set(statuses?.map(s => s.status as string) || [])).sort(),
        visaStatuses: Array.from(new Set(visaStatuses?.map(v => v.visa_status as string) || [])).sort()
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      return {
        companies: [],
        trades: [],
        nationalities: [],
        statuses: [],
        visaStatuses: []
      };
    }
  }

  static async getTemporaryWorkersCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('employee_table')
        .select('*', { count: 'exact', head: true })
        .or('employee_id.ilike.%TEMP%,employee_id.ilike.%temp%,employee_id.ilike.%Temporary%,employee_id.ilike.%temporary%');

      return count || 0;
    } catch (error) {
      console.error('Error getting temporary workers count:', error);
      return 0;
    }
  }
}
