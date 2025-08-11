import { supabase } from '../supabase/client';
import { Employee } from '../supabase/client';

// Extended Employee interface for the optimized view
export interface EmployeeWithDocuments extends Employee {
  document_count?: number;
  last_document_upload?: string;
}

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

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDocuments: number;
  pendingApprovals: number;
  visasExpiringSoon: number;
  departments: number;
}

export interface DepartmentDistribution {
  name: string;
  employees: number;
  percentage: number;
  growth: string;
}

export interface CompanyDistribution {
  name: string;
  employees: number;
  percentage: number;
  growth: string;
}

export interface GrowthTrendData {
  month: string;
  employees: number;
  documents: number;
  approvals: number;
}

export interface ExpiringVisa {
  employee_id: string;
  name: string;
  visa_type: string;
  visa_expiry_date: string;
  daysLeft: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface DashboardFilters {
  dateRange?: '7d' | '30d' | '90d' | '1y' | 'all';
  department?: string;
  company?: string;
}

export class EmployeeService {
  // In-memory cache and dedupe for employee lists
  private static employeesCache: Map<string, { data: PaginatedEmployeesResponse; timestamp: number }> = new Map();
  private static employeesInflight: Map<string, Promise<PaginatedEmployeesResponse>> = new Map();
  private static readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  // Helper function to calculate visa status based on expiry dates
  static calculateVisaStatus(employee: any): string {
    if (!employee.visa_expiry_date) return 'unknown';
    
    const today = new Date();
    const expiryDate = new Date(employee.visa_expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    if (daysUntilExpiry <= 90) return 'expiring_soon';
    return 'valid';
  }

  // Helper function to determine employee status
  static calculateEmployeeStatus(employee: any): string {
    // If employee has an explicit status, use that
    if (employee.status && employee.status !== 'null' && employee.status !== '') {
      return employee.status.toLowerCase();
    }
    
    // Otherwise derive from is_active and other fields
    if (employee.is_active === false) return 'inactive';
    if (employee.is_active === true) return 'active';
    
    // Default to pending if no clear status
    return 'pending';
  }

  // Helper function to enhance employees with calculated fields
  static enhanceEmployeeData(employees: any[]): any[] {
    return employees.map(employee => ({
      ...employee,
      visa_status: this.calculateVisaStatus(employee),
      status: this.calculateEmployeeStatus(employee),
      // Ensure visa_expiry_date is properly mapped
      visa_expiry_date: employee.visa_expiry_date || employee.visa_expiry || null,
      // Map other fields for consistency
      mobile_number: employee.mobile_number || employee.phone || null,
      email_id: employee.email_id || employee.email || null,
      basic_salary: employee.basic_salary || employee.salary || null
    }));
  }

  // Generate unique employee ID based on company and existing IDs for that company
  static async generateEmployeeId(companyName: string, employeeName: string): Promise<string> {
    try {
      // Get existing employees for this company
      const { data: existingEmployees, error } = await supabase
        .from('employee_table')
        .select('employee_id')
        .eq('company_name', companyName);

      if (error) {
        console.error('Error getting existing employees:', error);
        // Fallback to static prefix map if query fails
        const fallbackPrefix = this.generateCompanyPrefix(companyName);
        return `${fallbackPrefix}${Date.now().toString().slice(-4)}`;
      }

      // If there are existing employees, infer the prefix and padding dynamically
      if (existingEmployees && existingEmployees.length > 0) {
        type PrefixStats = { prefix: string; maxNum: number; padLen: number };
        const statsByPrefix = new Map<string, PrefixStats>();

        for (const row of existingEmployees) {
          const id = (row.employee_id as string) || '';
          // Match any non-digit prefix (including spaces/underscores) followed by digits
          const m = id.match(/^([^0-9]*?)(\d+)$/);
          if (!m) continue;
          const prefix = m[1];
          const numStr = m[2];
          const num = parseInt(numStr, 10);
          if (!statsByPrefix.has(prefix)) {
            statsByPrefix.set(prefix, { prefix, maxNum: isNaN(num) ? 0 : num, padLen: numStr.length });
          } else {
            const s = statsByPrefix.get(prefix)!;
            if (!isNaN(num) && num > s.maxNum) s.maxNum = num;
            // Keep the longest observed numeric width
            if (numStr.length > s.padLen) s.padLen = numStr.length;
          }
        }

        // Choose the most frequent or first observed prefix; fall back to static map
        let chosen: PrefixStats | null = null;
        for (const s of statsByPrefix.values()) { chosen = s; break; }
        const dynamicPrefix = chosen?.prefix ?? this.generateCompanyPrefix(companyName);
        const nextNumber = (chosen?.maxNum ?? 0) + 1;
        const padLen = chosen?.padLen ?? 3;
        const paddedNumber = nextNumber.toString().padStart(padLen, '0');
        return `${dynamicPrefix}${paddedNumber}`;
      }

      // No existing employees: use static prefix map
      const companyPrefix = this.generateCompanyPrefix(companyName);
      const defaultPad = companyPrefix === 'ALHT' ? 4 : 3; // known 4-digit series for AL HANA
      return `${companyPrefix}${(1).toString().padStart(defaultPad, '0')}`;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      const fallbackPrefix = this.generateCompanyPrefix(companyName);
      return `${fallbackPrefix}${Date.now().toString().slice(-4)}`;
    }
  }

  // Special method for AL ASHBAL AJMAN employee IDs
  private static async generateAshbalEmployeeId(): Promise<string> {
    try {
      const { data: existingEmployees, error } = await supabase
        .from('employee_table')
        .select('employee_id')
        .eq('company_name', 'AL ASHBAL AJMAN');

      if (error) {
        console.error('Error getting AL ASHBAL employees:', error);
        return `AL ASHBAL ${Date.now().toString().slice(-3)}`;
      }

      // Find the highest employee number
      let maxNumber = 0;
      if (existingEmployees && existingEmployees.length > 0) {
        existingEmployees.forEach(emp => {
          const employeeId = emp.employee_id as string;
          if (employeeId && employeeId.startsWith('AL ASHBAL ')) {
            // Extract the number part after "AL ASHBAL "
            const numberPart = employeeId.substring('AL ASHBAL '.length);
            const number = parseInt(numberPart);
            if (!isNaN(number) && number > maxNumber) {
              maxNumber = number;
            }
          }
        });
      }

      const nextNumber = maxNumber + 1;
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      
      return `AL ASHBAL ${paddedNumber}`;
    } catch (error) {
      console.error('Error generating AL ASHBAL employee ID:', error);
      return `AL ASHBAL ${Date.now().toString().slice(-3)}`;
    }
  }

  // Generate company prefix from company name
  static generateCompanyPrefix(companyName: string): string {
    const prefixMap: { [key: string]: string } = {
      'AL HANA TOURS & TRAVELS': 'ALHT',
      'AL HANA TOURS': 'ALHT',
      'COMPANY_DOCS': 'COMP',
      'Company Documents': 'COMP',
      'AL ASHBAL AJMAN': 'AL ASHBAL',
      'ASHBAL AL KHALEEJ': 'AAK',
      'CUBS CONTRACTING': 'CCS',
      'CUBS CONTRACTING & SERVICES W L L': 'CCS',
      'FLUID ENGINEERING': 'FE',
      'GOLDEN CUBS': 'GCGC',
      'AL MACEN': 'ALM',
      'RUKIN AL ASHBAL': 'RAA',
      'CUBS': 'CUB'
    };

    // Check for exact match first
    if (prefixMap[companyName]) {
      return prefixMap[companyName];
    }
    // Generate prefix from company name
    const words = companyName
      .replace(/[&]/g, 'and')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (words.length >= 2) {
      // Take first 2 characters from first 2 words
      return words.slice(0, 2).map(word => word.substring(0, 2)).join('');
    } else if (words.length === 1) {
      // Take first 4 characters from single word
      return words[0].substring(0, 4);
    }

    // Fallback
    return 'EMP';
  }

  // Create new employee
  static async createEmployee(employeeData: CreateEmployeeData): Promise<{ success: boolean; error?: string; employee?: Employee }> {
    try {
      // Validate required fields
      const requiredFields = ['employee_id', 'name', 'company_name', 'trade', 'nationality'];
      for (const field of requiredFields) {
        if (!employeeData[field as keyof CreateEmployeeData]) {
          return { success: false, error: `${field} is required` };
        }
      }

      // Check if employee ID already exists and generate a new one if needed
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const { data: existingEmployee } = await supabase
          .from('employee_table')
          .select('employee_id')
          .eq('employee_id', employeeData.employee_id)
          .single();

        if (!existingEmployee) {
          break; // ID is unique, proceed
        }

        // If ID exists, generate a new one
        const newId = await this.generateEmployeeId(employeeData.company_name, employeeData.name);
        employeeData.employee_id = newId;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return { success: false, error: 'Unable to generate unique employee ID after multiple attempts' };
      }

      // Insert employee data
      const { data: employee, error } = await supabase
        .from('employee_table')
        .insert({
          employee_id: employeeData.employee_id,
          name: employeeData.name,
          date_of_birth: employeeData.dob || null,
          trade: employeeData.trade,
          nationality: employeeData.nationality,
          joining_date: employeeData.joining_date,
          passport_no: employeeData.passport_no,
          passport_expiry: employeeData.passport_expiry,
          labourcard_no: employeeData.labourcard_no || null,
          labourcard_expiry: employeeData.labourcard_expiry || null,
          visastamping_date: employeeData.visastamping_date || null,
          visa_expiry_date: employeeData.visa_expiry_date || null,
          eid: employeeData.eid || null,
          wcc: employeeData.wcc || null,
          lulu_wps_card: employeeData.lulu_wps_card || null,
          basic_salary: employeeData.basic_salary ? parseFloat(employeeData.basic_salary) : null,
          company_name: employeeData.company_name,
          status: employeeData.status || 'active',
          is_active: employeeData.is_active !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        return { success: false, error: error.message };
      }

      // Enhance the created employee with calculated fields
      const enhancedEmployee = this.enhanceEmployeeData([employee])[0];

      return { success: true, employee: enhancedEmployee as Employee };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create employee' };
    }
  }

  static async getEmployees(
    pagination: PaginationParams,
    filters?: EmployeeFilters
  ): Promise<PaginatedEmployeesResponse> {
    try {
      const cacheKey = JSON.stringify({ p: pagination, f: filters || {} });
      const cached = this.employeesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS) {
        return cached.data;
      }
      const inflight = this.employeesInflight.get(cacheKey);
      if (inflight) return inflight;

      const run = async (): Promise<PaginatedEmployeesResponse> => {
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

      const { data: rawEmployees, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Enhance employees with calculated status fields
      const employees = this.enhanceEmployeeData(rawEmployees || []);

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

      const response: PaginatedEmployeesResponse = {
        employees: (employees || []) as unknown as Employee[],
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        error: null
      };
      this.employeesCache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
      };
      const promise = run().finally(() => {
        this.employeesInflight.delete(cacheKey);
      });
      this.employeesInflight.set(cacheKey, promise);
      return promise;
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

  static async getEmployeeById(employeeId: string): Promise<{ employee: Employee | null; error: string | null }> {
    try {
      const { data: rawEmployee, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (error) {
        return { employee: null, error: error.message };
      }

      // Enhance employee with calculated status fields
      const employee = rawEmployee ? this.enhanceEmployeeData([rawEmployee])[0] : null;

      return { employee: employee as unknown as Employee, error: null };
    } catch (error) {
      console.error('Error fetching employee:', error);
      return { employee: null, error: 'Failed to fetch employee' };
    }
  }

  // Get employee by ID using the optimized view
  static async getEmployeeByIdOptimized(employeeId: string): Promise<{ employee: EmployeeWithDocuments | null; error: string | null }> {
    try {
      console.log(`🔍 Fetching employee with optimized query: ${employeeId}`);
      
      // First try to get employee from employee_table
      const { data: employeeData, error: empError } = await supabase
        .from('employee_table')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (empError) {
        console.error('❌ Error fetching employee:', empError);
        return { employee: null, error: empError.message };
      }

      if (!employeeData) {
        console.log('❌ Employee not found');
        return { employee: null, error: 'Employee not found' };
      }

      // Get document count for this employee
      const { count: documentCount, error: docError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId);

      if (docError) {
        console.error('❌ Error fetching document count:', docError);
      }

      const employee = {
        ...employeeData,
        document_count: documentCount || 0
      } as unknown as EmployeeWithDocuments;

      console.log(`✅ Found employee: ${employee.name} with ${employee.document_count || 0} documents`);
      
      return { employee, error: null };
    } catch (error) {
      console.error('❌ Exception in getEmployeeByIdOptimized:', error);
      return { employee: null, error: 'Failed to fetch employee' };
    }
  }

  // Get dashboard stats using the optimized view

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

  static async deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string; deletedDocuments?: number }> {
    try {
      console.log(`🗑️ Starting deletion of employee: ${employeeId}`);
      
      // Step 1: Find all documents for this employee
      const { data: documents, error: docError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId);

      if (docError) {
        console.error('Error fetching employee documents:', docError);
        return { success: false, error: docError.message };
      }

      let deletedDocuments = 0;

      // Step 2: Delete documents from Backblaze (if any)
      if (documents && documents.length > 0) {
        console.log(`🗂️ Deleting ${documents.length} documents for employee ${employeeId}`);
        
        // Import BackblazeService dynamically
        const { BackblazeService } = await import('./backblaze');
        
        for (const doc of documents) {
          try {
            if (doc.file_path && typeof doc.file_path === 'string' && doc.file_path.trim() !== '') {
              const deleteResult = await BackblazeService.deleteFile(doc.file_path);
              if (deleteResult.success) {
                console.log(`✅ Deleted from Backblaze: ${doc.file_name}`);
              } else {
                console.log(`⚠️ Failed to delete from Backblaze: ${doc.file_name} - ${deleteResult.error || 'Unknown error'}`);
              }
            } else {
              console.log(`⚠️ Skipping document with invalid file_path: ${doc.file_name}`);
            }
          } catch (error) {
            console.log(`⚠️ Error deleting from Backblaze: ${doc.file_name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Step 3: Delete documents from database
        const { error: deleteDocsError } = await supabase
          .from('employee_documents')
          .delete()
          .eq('employee_id', employeeId);

        if (deleteDocsError) {
          console.error('Error deleting documents from database:', deleteDocsError);
          return { success: false, error: deleteDocsError.message };
        }

        deletedDocuments = documents.length;
        console.log(`✅ Successfully deleted ${deletedDocuments} documents from database`);
      }

      // Step 4: Delete employee from database
      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('employee_id', employeeId);

      if (error) {
        console.error('Error deleting employee from database:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Successfully deleted employee: ${employeeId}`);
      return { success: true, deletedDocuments };
    } catch (error) {
      console.error('Error deleting employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete employee' };
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

      // Get all companies and clean them up
      const allCompanies = Array.from(new Set(companies?.map(c => c.company_name as string) || [])).sort();
      
      // Filter out only unwanted companies, keep all active companies
      const cleanCompanies = allCompanies.filter(company => {
        // Remove Company Documents (not a real company)
        if (company === 'Company Documents') return false;
        
        // Remove duplicate Fluid Engineering variations (keep only FLUID ENGINEERING)
        if (company === 'FLUID ENGINEERING SERVICES') return false;
        if (company === 'FLUID') return false;
        
        // Keep all other companies including:
        // - CUBS, GOLDEN CUBS, CUBS CONTRACTING (as you confirmed)
        // - FLUID ENGINEERING (after consolidation)
        // - All other active companies
        return true;
      });
      
      return {
        companies: cleanCompanies,
        trades: Array.from(new Set(trades?.map(t => t.trade as string) || [])).sort(),
        nationalities: Array.from(new Set(nationalities?.map(n => n.nationality as string) || [])).sort(),
        statuses: ['active', 'inactive', 'pending', 'suspended'], // Use standard status values
        visaStatuses: ['valid', 'expiring_soon', 'expired', 'processing', 'unknown'] // Use standard visa status values
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

  // Dashboard-specific methods
  static async getAdminDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
    try {
      const dateFilter = this.getDateFilter(filters?.dateRange);
      
      // Get total employees
      const { count: totalEmployees, error: employeesError } = await supabase
        .from('employee_table')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateFilter);

      // Get active employees
      const { count: activeEmployees, error: activeError } = await supabase
        .from('employee_table')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', dateFilter);

      // Get total documents
      const { count: totalDocuments, error: docsError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateFilter);

      // Get pending approvals (mock for now - replace with actual approvals table)
      const pendingApprovals = 0; // TODO: Implement when approvals table exists

      // Get visas expiring soon (within 90 days)
      const { count: visasExpiringSoon, error: visaError } = await supabase
        .from('employee_table')
        .select('*', { count: 'exact', head: true })
        .gte('visa_expiry_date', new Date().toISOString().split('T')[0])
        .lte('visa_expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Get unique departments
      const { data: departments, error: deptError } = await supabase
        .from('employee_table')
        .select('trade')
        .gte('created_at', dateFilter);

      const uniqueDepartments = new Set(departments?.map(d => d.trade) || []).size;

      if (employeesError || activeError || docsError || visaError || deptError) {
        console.error('Error fetching dashboard stats:', { employeesError, activeError, docsError, visaError, deptError });
        throw new Error('Failed to fetch dashboard statistics');
      }

      return {
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        totalDocuments: totalDocuments || 0,
        pendingApprovals,
        visasExpiringSoon: visasExpiringSoon || 0,
        departments: uniqueDepartments
      };
    } catch (error) {
      console.error('Error in getAdminDashboardStats:', error);
      throw error;
    }
  }

  static async getEmployeeDistributionByDepartment(filters?: DashboardFilters): Promise<DepartmentDistribution[]> {
    try {
      const dateFilter = this.getDateFilter(filters?.dateRange);
      
      const { data, error } = await supabase
        .from('employee_table')
        .select('trade, created_at')
        .gte('created_at', dateFilter)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching department distribution:', error);
        throw error;
      }

      // Group by department and calculate statistics
      const departmentMap = new Map<string, { count: number; recentCount: number }>();
      
      data?.forEach(employee => {
        const trade = (employee.trade as string) || 'Unknown';
        const isRecent = new Date(employee.created_at as string) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (!departmentMap.has(trade)) {
          departmentMap.set(trade, { count: 0, recentCount: 0 });
        }
        
        const dept = departmentMap.get(trade)!;
        dept.count++;
        if (isRecent) dept.recentCount++;
      });

      const totalEmployees = Array.from(departmentMap.values()).reduce((sum, dept) => sum + dept.count, 0);
      
      return Array.from(departmentMap.entries()).map(([name, stats]) => ({
        name,
        employees: stats.count,
        percentage: totalEmployees > 0 ? Math.round((stats.count / totalEmployees) * 100) : 0,
        growth: stats.recentCount > 0 ? `+${stats.recentCount}` : '0'
      }));
    } catch (error) {
      console.error('Error in getEmployeeDistributionByDepartment:', error);
      throw error;
    }
  }

  static async getEmployeeDistributionByCompany(filters?: DashboardFilters): Promise<CompanyDistribution[]> {
    try {
      const dateFilter = this.getDateFilter(filters?.dateRange);
      const { data, error } = await supabase
        .from('employee_table')
        .select('company_name, created_at')
        .gte('created_at', dateFilter)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching company distribution:', error);
        throw error;
      }

      const companyMap = new Map<string, { count: number; recentCount: number }>();
      data?.forEach(emp => {
        const company = (emp.company_name as string) || 'Unknown';
        const isRecent = new Date(emp.created_at as string) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (!companyMap.has(company)) companyMap.set(company, { count: 0, recentCount: 0 });
        const v = companyMap.get(company)!;
        v.count++;
        if (isRecent) v.recentCount++;
      });

      const totalEmployees = Array.from(companyMap.values()).reduce((sum, v) => sum + v.count, 0);
      return Array.from(companyMap.entries())
        .map(([name, stats]) => ({
          name,
          employees: stats.count,
          percentage: totalEmployees > 0 ? Math.round((stats.count / totalEmployees) * 100) : 0,
          growth: stats.recentCount > 0 ? `+${stats.recentCount}` : '0',
        }))
        .sort((a, b) => b.employees - a.employees);
    } catch (error) {
      console.error('Error in getEmployeeDistributionByCompany:', error);
      throw error;
    }
  }

  static async getGrowthTrendData(filters?: DashboardFilters): Promise<GrowthTrendData[]> {
    try {
      const dateFilter = this.getDateFilter(filters?.dateRange);
      const months = this.getLast6Months();
      
      const trendData: GrowthTrendData[] = [];

      for (const month of months) {
        const { count: employees, error: empError } = await supabase
          .from('employee_table')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', month.start)
          .lte('created_at', month.end);

        const { count: documents, error: docError } = await supabase
          .from('employee_documents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', month.start)
          .lte('created_at', month.end);

        if (empError || docError) {
          console.error('Error fetching growth trend data:', { empError, docError });
          continue;
        }

        trendData.push({
          month: month.label,
          employees: employees || 0,
          documents: documents || 0,
          approvals: 0 // TODO: Implement when approvals table exists
        });
      }

      return trendData;
    } catch (error) {
      console.error('Error in getGrowthTrendData:', error);
      throw error;
    }
  }

  static async getExpiringVisasSummary(limit: number = 5): Promise<ExpiringVisa[]> {
    try {
      const { data, error } = await supabase
        .from('employee_table')
        .select('employee_id, name, visa_status, visa_expiry_date')
        .gte('visa_expiry_date', new Date().toISOString().split('T')[0])
        .lte('visa_expiry_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('is_active', true)
        .order('visa_expiry_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching expiring visas:', error);
        throw error;
      }

      return data?.map(employee => {
        const daysLeft = Math.ceil((new Date(employee.visa_expiry_date as string).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (daysLeft <= 7) urgency = 'critical';
        else if (daysLeft <= 30) urgency = 'high';
        else if (daysLeft <= 60) urgency = 'medium';

        return {
          employee_id: employee.employee_id as string,
          name: (employee.name as string) || 'Unknown',
          visa_type: (employee.visa_status as string) || 'Unknown',
          visa_expiry_date: employee.visa_expiry_date as string,
          daysLeft,
          urgency
        };
      }) || [];
    } catch (error) {
      console.error('Error in getExpiringVisasSummary:', error);
      throw error;
    }
  }

  // Helper methods
  private static getDateFilter(dateRange?: string): string {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(0).toISOString(); // All time
    }
  }

  private static getLast6Months(): Array<{ label: string; start: string; end: string }> {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        start: date.toISOString(),
        end: endDate.toISOString()
      });
    }
    
    return months;
  }
}
