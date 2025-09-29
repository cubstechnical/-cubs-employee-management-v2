import { supabase } from '@/lib/supabase/client';
import { log } from '@/lib/utils/productionLogger';

export interface CompanyStats {
  company_name: string;
  employee_count: number;
}

export class CompanyStatsService {
  /**
   * Get employee count by company
   */
  static async getCompanyStats(): Promise<CompanyStats[]> {
    try {
      log.info('Starting company stats fetch...');
      
      const { data, error } = await supabase
        .from('employee_table')
        .select('company_name')
        .eq('is_active', true);

      if (error) {
        log.error('Supabase error fetching company stats:', error);
        throw error;
      }

      log.info('Raw data from Supabase:', data);

      if (!data || data.length === 0) {
        log.info('No data returned from Supabase');
        throw new Error('No employee data found');
      }

      // Count employees by company
      const companyCounts: { [key: string]: number } = {};
      
      data.forEach((employee) => {
        const companyName = (employee as any).company_name;
        if (companyName && typeof companyName === 'string' && companyName.trim()) {
          companyCounts[companyName] = (companyCounts[companyName] || 0) + 1;
        }
      });

      log.info('Company counts:', companyCounts);

      // Convert to array and sort by employee count (descending)
      const companyStats: CompanyStats[] = Object.entries(companyCounts)
        .map(([company_name, employee_count]) => ({
          company_name,
          employee_count,
        }))
        .filter(stat => {
          // Remove unwanted entries
          const unwantedCompanies = [
            'Company Documents',
            'COMPANY DOCUMENTS',
            'company documents',
            'Documents',
            'DOCUMENTS',
            'documents',
            '',
            null,
            undefined
          ];
          return !unwantedCompanies.includes(stat.company_name);
        })
        .sort((a, b) => b.employee_count - a.employee_count);

      log.info('Final company stats:', companyStats);
      return companyStats;
    } catch (error) {
      log.error('Error in getCompanyStats:', error);
      // Return fallback data if there's an error
      return [
        { company_name: 'CUBS', employee_count: 0 },
        { company_name: 'CUBS CONTRACTING', employee_count: 0 },
        { company_name: 'AL MACEN', employee_count: 0 },
        { company_name: 'RUKIN AL ASHBAL', employee_count: 0 },
        { company_name: 'GOLDEN CUBS', employee_count: 0 },
        { company_name: 'FLUID ENGINEERING', employee_count: 0 },
        { company_name: 'AL HANA TOURS & TRAVELS', employee_count: 0 },
        { company_name: 'AL ASHBAL AJMAN', employee_count: 0 },
        { company_name: 'ASHBAL AL KHALEEJ', employee_count: 0 },
      ];
    }
  }

  /**
   * Get all unique company names
   */
  static async getCompanyNames(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('company_name')
        .not('company_name', 'is', null)
        .eq('is_active', true);

      if (error) {
        log.error('Error fetching company names:', error);
        throw error;
      }

      // Get unique company names
      const uniqueCompanies = [...new Set(data?.map((emp: any) => emp.company_name).filter(Boolean))] as string[];

      return uniqueCompanies.sort();
    } catch (error) {
      log.error('Error in getCompanyNames:', error);
      // Return fallback company names
      return [
        'CUBS',
        'CUBS CONTRACTING',
        'AL MACEN',
        'RUKIN AL ASHBAL',
        'GOLDEN CUBS',
        'FLUID ENGINEERING',
        'AL HANA TOURS & TRAVELS',
        'AL ASHBAL AJMAN',
        'ASHBAL AL KHALEEJ',
      ];
    }
  }
}
