import { supabase } from '../supabase/client';

export interface EmployeeMapping {
  id: string;
  employee_id: string;
  employee_name: string;
  company_name: string;
  supervisor_id?: string;
  supervisor_name?: string;
  department?: string;
  role?: string;
  team?: string;
  project?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'transferred';
  created_at: string;
  updated_at: string;
}

export class EmployeeMappingService {
  static async getMappings(): Promise<{ mappings: EmployeeMapping[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { mappings: [], error: error.message };
      }

      return { mappings: (data as unknown as EmployeeMapping[]) || [], error: null };
    } catch (error) {
      return { mappings: [], error: 'Failed to fetch mappings' };
    }
  }

  static async getFilterOptions(): Promise<{ companies: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('company_name')
        .not('company_name', 'is', null);

      if (error) {
        return { companies: [], error: error.message };
      }

      const companies = Array.from(new Set(data?.map((item: any) => item.company_name) || []));
      return { companies, error: null };
    } catch (error) {
      return { companies: [], error: 'Failed to fetch companies' };
    }
  }
}
