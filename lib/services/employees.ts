import { supabase } from '../supabase/client';
import { log } from '@/lib/utils/productionLogger';

// Define Employee interface locally since it's not exported from supabase client
// This interface includes the most commonly used fields across the application
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email_id?: string;
  mobile_number?: string;
  trade: string;
  company_name: string;
  visa_expiry_date: string;
  is_active: boolean;
  created_at: string;
  nationality: string;
  status: string;
  // Additional fields that might be used in admin pages
  dob?: string;
  joining_date?: string;
  passport_no?: string;
  passport_expiry?: string;
  labourcard_no?: string;
  labourcard_expiry?: string;
  visastamping_date?: string;
  eid?: string;
  wcc?: string;
  lulu_wps_card?: string;
  basic_salary?: string;
  visa_status?: string;
  updated_at?: string;
}

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
  data: Employee[];
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
  private static readonly CACHE_DURATION_MS = 5 * 60 * 1000; // Optimized to 5 minutes for fresh data
  
  // Individual employee cache for better performance
  private static employeeCache: Map<string, { data: Employee; timestamp: number }> = new Map();
  private static employeeInflight: Map<string, Promise<{ employee: Employee | null; error: string | null }>> = new Map();
  private static readonly EMPLOYEE_CACHE_DURATION_MS = 10 * 60 * 1000; // Optimized to 10 minutes for fresh data

  // Filter options cache to reduce repeated API calls
  private static filterOptionsCache: { data: FilterOptions; timestamp: number } | null = null;
  private static readonly FILTER_CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  // Dashboard stats cache
  private static dashboardStatsCache: Map<string, { data: DashboardStats; timestamp: number }> = new Map();
  private static readonly DASHBOARD_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Performance monitoring
  private static performanceMetrics: Map<string, number[]> = new Map();

  // Helper function to log performance metrics
  private static logPerformance(operation: string, duration: number) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    this.performanceMetrics.get(operation)!.push(duration);
    
    if (duration > 1000) {
      log.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    } else if (duration > 500) {
      log.info(`⚠️ Moderate operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  // Clear all caches (useful for testing or manual refresh)
  static clearAllCaches() {
    this.employeesCache.clear();
    this.employeeCache.clear();
    this.filterOptionsCache = null;
    this.dashboardStatsCache.clear();
    this.employeesInflight.clear();
    this.employeeInflight.clear();
    log.info('🧹 All employee service caches cleared');
  }

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

  // Optimized helper function to enhance employees with calculated fields
  static enhanceEmployeeData(employees: any[]): any[] {
    const today = new Date(); // Cache current date for performance
    
    return employees.map(employee => {
      // Pre-calculate visa status to avoid repeated date calculations
      let visaStatus = 'unknown';
      if (employee.visa_expiry_date) {
        const expiryDate = new Date(employee.visa_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) visaStatus = 'expired';
        else if (daysUntilExpiry <= 30) visaStatus = 'expiring_soon';
        else if (daysUntilExpiry <= 90) visaStatus = 'expiring_soon';
        else visaStatus = 'valid';
      }

      // Pre-calculate employee status
      let status = 'pending';
      if (employee.status && employee.status !== 'null' && employee.status !== '') {
        status = employee.status.toLowerCase();
      } else if (employee.is_active === false) {
        status = 'inactive';
      } else if (employee.is_active === true) {
        status = 'active';
      }

      return {
        ...employee,
        visa_status: visaStatus,
        status: status,
        // Ensure visa_expiry_date is properly mapped
        visa_expiry_date: employee.visa_expiry_date || employee.visa_expiry || null,
        // Map other fields for consistency
        mobile_number: employee.mobile_number || employee.phone || null,
        email_id: employee.email_id || employee.email || null,
        basic_salary: employee.basic_salary || employee.salary || null
      };
    });
  }

  // Generate unique employee ID based on company and existing IDs for that company
  static async generateEmployeeId(companyName: string, employeeName: string): Promise<string> {
    log.info('🔄 Generating employee ID for:', { companyName, employeeName });
    try {
      // Get existing employees for this company
      const { data: existingEmployees, error } = await supabase
        .from('employee_table')
        .select('employee_id')
        .eq('company_name', companyName);

      if (error) {
        log.error('Error getting existing employees:', error);
        // Fallback to static prefix map if query fails
        const fallbackPrefix = this.generateCompanyPrefix(companyName);
        return `${fallbackPrefix}${Date.now().toString().slice(-4)}`;
      }

      // If there are existing employees, infer the prefix and padding dynamically
      if (existingEmployees && existingEmployees.length > 0) {
        type PrefixStats = { prefix: string; maxNum: number; padLen: number };
        const statsByPrefix = new Map<string, PrefixStats>();

        for (const row of existingEmployees) {
          const id = ((row as any).employee_id as string) || '';
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

        // Choose the prefix that matches the company or the most frequent one
        const expectedPrefix = this.generateCompanyPrefix(companyName);
        let chosen: PrefixStats | null = null;
        
        // First, try to find a prefix that matches the expected company prefix
        for (const s of statsByPrefix.values()) {
          if (s.prefix === expectedPrefix) {
            chosen = s;
            break;
          }
        }
        
        // If no matching prefix found, use the one with the highest number (most recent)
        if (!chosen) {
          let maxNum = -1;
          for (const s of statsByPrefix.values()) {
            if (s.maxNum > maxNum) {
              maxNum = s.maxNum;
              chosen = s;
            }
          }
        }
        
        // Fallback to expected prefix if still no match
        const dynamicPrefix = chosen?.prefix ?? expectedPrefix;
        const nextNumber = (chosen?.maxNum ?? 0) + 1;
        const padLen = chosen?.padLen ?? 3;
        const paddedNumber = nextNumber.toString().padStart(padLen, '0');
        const generatedId = `${dynamicPrefix}${paddedNumber}`;
        log.info('✅ Generated employee ID (with existing employees):', generatedId, { dynamicPrefix, nextNumber, padLen, expectedPrefix });
        return generatedId;
      }

      // No existing employees: use static prefix map
      const companyPrefix = this.generateCompanyPrefix(companyName);
      const defaultPad = companyPrefix === 'ALHT' ? 4 : 3; // known 4-digit series for AL HANA
      const generatedId = `${companyPrefix}${(1).toString().padStart(defaultPad, '0')}`;
      log.info('✅ Generated new employee ID (no existing employees):', generatedId);
      return generatedId;
    } catch (error) {
      log.error('Error generating employee ID:', error);
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
        log.error('Error getting AL ASHBAL employees:', error);
        return `AL ASHBAL ${Date.now().toString().slice(-3)}`;
      }

      // Find the highest employee number
      let maxNumber = 0;
      if (existingEmployees && existingEmployees.length > 0) {
        existingEmployees.forEach(emp => {
          const employeeId = (emp as any).employee_id as string;
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
      log.error('Error generating AL ASHBAL employee ID:', error);
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
      const { data: employee, error } = await (supabase as any)
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
        log.error('Error creating employee:', error);
        return { success: false, error: error.message };
      }

      // Enhance the created employee with calculated fields
      const enhancedEmployee = this.enhanceEmployeeData([employee])[0];

      return { success: true, employee: enhancedEmployee as Employee };
    } catch (error) {
      log.error('Error creating employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create employee' };
    }
  }



  static async getEmployees(
    pagination: PaginationParams,
    filters?: EmployeeFilters
  ): Promise<PaginatedEmployeesResponse> {
    const startTime = performance.now();
    
    // Apply pagination with validation and defaults
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    
    try {
      const cacheKey = JSON.stringify({ p: pagination, f: filters || {} });
      const cached = this.employeesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION_MS * 2) { // Extended cache duration
        this.logPerformance('getEmployees-cache-hit', performance.now() - startTime);
        return cached.data;
      }
      const inflight = this.employeesInflight.get(cacheKey);
      if (inflight) {
        this.logPerformance('getEmployees-inflight-hit', performance.now() - startTime);
        return inflight;
      }

      const run = async (): Promise<PaginatedEmployeesResponse> => {
        const queryStartTime = performance.now();
        
        // Add timeout protection for the entire query
        const timeoutPromise = new Promise<PaginatedEmployeesResponse>((_, reject) => 
          setTimeout(() => reject(new Error('Employee query timeout')), 30000)
        );
        
        // Apply pagination with validation and defaults
        const page = pagination.page || 1;
        const pageSize = pagination.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Build query with filters and search
        let query = supabase
          .from('employee_table')
          .select('employee_id, name, company_name, trade, nationality, status, is_active, visa_expiry_date, created_at, updated_at');

        // Apply search filter
        if (filters?.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();

          // Try multiple field search using OR condition
          const searchPattern = `%${searchTerm}%`;
          try {
            query = query.or(
              `name.ilike.${searchPattern},employee_id.ilike.${searchPattern},trade.ilike.${searchPattern},company_name.ilike.${searchPattern}`
            );
          } catch (error) {
            // Fallback to name search only if OR fails
            query = query.ilike('name', searchPattern);
          }
        }

        // Apply company filter
        if (filters?.company_name && filters.company_name.trim()) {
          log.info(`🏢 Applying company filter: "${filters.company_name}"`);
          query = query.eq('company_name', filters.company_name);
        }

        // Apply trade filter
        if (filters?.trade && filters.trade.trim()) {
          log.info(`🔧 Applying trade filter: "${filters.trade}"`);
          query = query.eq('trade', filters.trade);
        }

        // Apply nationality filter
        if (filters?.nationality && filters.nationality.trim()) {
          log.info(`🌍 Applying nationality filter: "${filters.nationality}"`);
          query = query.eq('nationality', filters.nationality);
        }

        // Apply status filter
        if (filters?.status && filters.status.trim()) {
          log.info(`📊 Applying status filter: "${filters.status}"`);
          query = query.eq('status', filters.status);
        }

        // Apply visa status filter
        if (filters?.visa_status && filters.visa_status.trim()) {
          log.info(`🛂 Applying visa status filter: "${filters.visa_status}"`);
          // For visa status, we need to check the calculated field
          // This will be handled after fetching the data
        }

        // Apply pagination
        query = query.range(from, to);

        log.info(`🔍 Fetching employees: page ${page}, size ${pageSize}, range ${from}-${to}`);

        // Execute the query with timeout
        const { data: rawEmployees, error } = await Promise.race([
          query,
          timeoutPromise
        ]) as any;

        if (error) {
          log.error('❌ Employee query error:', error);
          throw new Error(error.message);
        }

        log.info(`✅ Found ${rawEmployees?.length || 0} employees`);

        // Enhance employees with calculated status fields
        let employees = this.enhanceEmployeeData(rawEmployees || []);

        // Apply visa status filter after enhancing data (since it's calculated)
        if (filters?.visa_status && filters.visa_status.trim()) {
          log.info(`🛂 Applying visa status filter: "${filters.visa_status}"`);
          employees = employees.filter(emp => emp.visa_status === filters.visa_status);
        }

        // Get total count with same filters
        let countQuery = supabase
          .from('employee_table')
          .select('*', { count: 'exact', head: true });

        // Apply same filters to count query
        if (filters?.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,trade.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
        }
        if (filters?.company_name && filters.company_name.trim()) {
          countQuery = countQuery.eq('company_name', filters.company_name);
        }
        if (filters?.trade && filters.trade.trim()) {
          countQuery = countQuery.eq('trade', filters.trade);
        }
        if (filters?.nationality && filters.nationality.trim()) {
          countQuery = countQuery.eq('nationality', filters.nationality);
        }
        if (filters?.status && filters.status.trim()) {
          countQuery = countQuery.eq('status', filters.status);
        }

        const { count } = await countQuery;
        
        log.info(`📊 Total employees matching filters: ${count || 0}`);
        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

        const response: PaginatedEmployeesResponse = {
          data: (employees || []) as unknown as Employee[],
          total,
          page: page,
          pageSize: pageSize,
          totalPages,
          error: null
        };
        
        this.employeesCache.set(cacheKey, { data: response, timestamp: Date.now() });
        this.logPerformance('getEmployees-query', performance.now() - queryStartTime);
        this.logPerformance('getEmployees-total', performance.now() - startTime);
        
        return response;
      };
      
      const promise = run().finally(() => {
        this.employeesInflight.delete(cacheKey);
      });
      this.employeesInflight.set(cacheKey, promise);
      return promise;
    } catch (error) {
      log.error('Error fetching employees:', error);
      
      // If it's a timeout error, provide more specific message
      if (error instanceof Error && error.message.includes('timeout')) {
        log.info('⚠️ Employee query timed out, database might be slow');
              return {
        data: [],
        total: 0,
        page: page || 1,
        pageSize: pageSize || 20,
        totalPages: 0,
        error: 'Database query timed out. Please try again or contact support if the issue persists.'
      };
      }
      
      return {
        data: [],
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
      // Check cache first
      const cached = this.employeeCache.get(employeeId);
      if (cached && Date.now() - cached.timestamp < this.EMPLOYEE_CACHE_DURATION_MS) {
        return { employee: cached.data, error: null };
      }

      // Check if request is already in flight
      const inflight = this.employeeInflight.get(employeeId);
      if (inflight) return inflight;

      const run = async (): Promise<{ employee: Employee | null; error: string | null }> => {
        // Try to find employee by employee_id first (human-readable ID like "ALHT001")
        let { data: rawEmployee, error } = await supabase
          .from('employee_table')
          .select('*')
          .eq('employee_id', employeeId)
          .single();

        // If not found and employeeId looks like a UUID, try searching by id field
        if (error && (employeeId.includes('-') && employeeId.length > 20)) {
          log.info('🔄 Employee not found by employee_id, trying UUID search...');
          const uuidResult = await supabase
            .from('employee_table')
            .select('*')
            .eq('id', employeeId)
            .single();

          rawEmployee = uuidResult.data;
          error = uuidResult.error;
        }

        if (error) {
          return { employee: null, error: error.message };
        }

        // Enhance employee with calculated status fields
        const employee = rawEmployee ? this.enhanceEmployeeData([rawEmployee])[0] : null;

        // Cache the result using the original employeeId parameter
        if (employee) {
          this.employeeCache.set(employeeId, { data: employee as unknown as Employee, timestamp: Date.now() });
        }

        return { employee: employee as unknown as Employee, error: null };
      };

      const promise = run().finally(() => {
        this.employeeInflight.delete(employeeId);
      });
      
      this.employeeInflight.set(employeeId, promise);
      return promise;
    } catch (error) {
      log.error('Error fetching employee:', error);
      return { employee: null, error: 'Failed to fetch employee' };
    }
  }

  // Get employee by ID using the optimized view
  static async getEmployeeByIdOptimized(employeeId: string): Promise<{ employee: EmployeeWithDocuments | null; error: string | null }> {
    try {
      log.info(`🔍 Fetching employee with optimized query: ${employeeId}`);
      
      // First try to get employee from employee_table by employee_id
      let { data: employeeData, error: empError } = await supabase
        .from('employee_table')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      // If not found and employeeId looks like a UUID, try searching by id field
      if (empError && (employeeId.includes('-') && employeeId.length > 20)) {
        log.info('🔄 Employee not found by employee_id in optimized query, trying UUID search...');
        const uuidResult = await supabase
          .from('employee_table')
          .select('*')
          .eq('id', employeeId)
          .single();

        employeeData = uuidResult.data;
        empError = uuidResult.error;
      }

      if (empError) {
        log.error('❌ Error fetching employee:', empError);
        return { employee: null, error: empError.message };
      }

      if (!employeeData) {
        log.info('❌ Employee not found');
        return { employee: null, error: 'Employee not found' };
      }

      // Get document count for this employee
      const { count: documentCount, error: docError } = await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', employeeId);

      if (docError) {
        log.error('❌ Error fetching document count:', docError);
      }

      const employee = {
        ...(employeeData as any),
        document_count: documentCount || 0
      } as unknown as EmployeeWithDocuments;

      log.info(`✅ Found employee: ${employee.name} with ${employee.document_count || 0} documents`);
      
      return { employee, error: null };
    } catch (error) {
      log.error('❌ Exception in getEmployeeByIdOptimized:', error);
      return { employee: null, error: 'Failed to fetch employee' };
    }
  }

  // Get dashboard stats using the optimized view

  static async updateEmployee(employeeData: UpdateEmployeeData): Promise<Employee | null> {
    try {
      const { data: employee, error } = await (supabase as any)
        .from('employee_table')
        .update(employeeData as any)
        .eq('employee_id', employeeData.employee_id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Clear caches after update
      this.employeeCache.delete(employeeData.employee_id);
      this.employeesCache.clear(); // Clear list cache as data changed

      return employee as unknown as Employee;
    } catch (error) {
      log.error('Error updating employee:', error);
      return null;
    }
  }

  static async deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string; deletedDocuments?: number }> {
    try {
      log.info(`🗑️ Starting deletion of employee: ${employeeId}`);
      
      // Step 1: Find all documents for this employee
      const { data: documents, error: docError } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId);

      if (docError) {
        log.error('Error fetching employee documents:', docError);
        return { success: false, error: docError.message };
      }

      let deletedDocuments = 0;

      // Step 2: Delete documents from Backblaze (if any)
      if (documents && documents.length > 0) {
        log.info(`🗂️ Deleting ${documents.length} documents for employee ${employeeId}`);
        
        // Import BackblazeService dynamically
        const { BackblazeService } = await import('./backblaze');
        
        for (const doc of documents) {
          try {
            if ((doc as any).file_path && typeof (doc as any).file_path === 'string' && (doc as any).file_path.trim() !== '') {
              const deleteResult = await BackblazeService.deleteFile((doc as any).file_path);
              if (deleteResult.success) {
                log.info(`✅ Deleted from Backblaze: ${(doc as any).file_name}`);
              } else {
                log.info(`⚠️ Failed to delete from Backblaze: ${(doc as any).file_name} - ${deleteResult.error || 'Unknown error'}`);
              }
            } else {
              log.info(`⚠️ Skipping document with invalid file_path: ${(doc as any).file_name}`);
            }
          } catch (error) {
            log.info(`⚠️ Error deleting from Backblaze: ${(doc as any).file_name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Step 3: Delete documents from database
        const { error: deleteDocsError } = await supabase
          .from('employee_documents')
          .delete()
          .eq('employee_id', employeeId);

        if (deleteDocsError) {
          log.error('Error deleting documents from database:', deleteDocsError);
          return { success: false, error: deleteDocsError.message };
        }

        deletedDocuments = documents.length;
        log.info(`✅ Successfully deleted ${deletedDocuments} documents from database`);
      }

      // Step 4: Delete employee from database
      const { error } = await supabase
        .from('employee_table')
        .delete()
        .eq('employee_id', employeeId);

      if (error) {
        log.error('Error deleting employee from database:', error);
        return { success: false, error: error.message };
      }

      log.info(`✅ Successfully deleted employee: ${employeeId}`);
      return { success: true, deletedDocuments };
    } catch (error) {
      log.error('Error deleting employee:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete employee' };
    }
  }

  static async getFilterOptions(): Promise<FilterOptions> {
    const startTime = performance.now();
    try {
      // Check cache first
      if (this.filterOptionsCache && Date.now() - this.filterOptionsCache.timestamp < this.FILTER_CACHE_DURATION_MS) {
        this.logPerformance('getFilterOptions-cache-hit', performance.now() - startTime);
        return this.filterOptionsCache.data;
      }

      // Use simple queries with individual timeout protection and error handling
      let companiesResult, tradesResult, nationalitiesResult;

      try {
        companiesResult = await Promise.race([
          supabase.from('employee_table').select('company_name').not('company_name', 'is', null),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Companies query timeout')), 10000))
        ]) as any;
      } catch (error) {
        log.info('⚠️ Companies query failed, using fallback');
        companiesResult = { data: [] };
      }

      try {
        tradesResult = await Promise.race([
          supabase.from('employee_table').select('trade').not('trade', 'is', null).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Trades query timeout')), 5000))
        ]) as any;
      } catch (error) {
        log.info('⚠️ Trades query failed, using fallback');
        tradesResult = { data: [] };
      }

      try {
        nationalitiesResult = await Promise.race([
          supabase.from('employee_table').select('nationality').not('nationality', 'is', null).limit(50),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Nationalities query timeout')), 5000))
        ]) as any;
      } catch (error) {
        log.info('⚠️ Nationalities query failed, using fallback');
        nationalitiesResult = { data: [] };
      }

      // Process results
      const companies = new Set<string>();
      const trades = new Set<string>();
      const nationalities = new Set<string>();

      companiesResult.data?.forEach((row: any) => {
        if (row.company_name) companies.add(row.company_name as string);
      });

      tradesResult.data?.forEach((row: any) => {
        if (row.trade) trades.add(row.trade as string);
      });

      nationalitiesResult.data?.forEach((row: any) => {
        if (row.nationality) nationalities.add(row.nationality as string);
      });

      // Get all companies and clean them up
      const allCompanies = Array.from(companies).sort();
      log.info('🏢 All companies found in database:', allCompanies);
      
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
      
      log.info('🏢 Clean companies after filtering:', cleanCompanies);
      
      const result: FilterOptions = {
        companies: cleanCompanies as string[],
        trades: Array.from(trades).sort(),
        nationalities: Array.from(nationalities).sort(),
        statuses: ['active', 'inactive', 'pending', 'suspended'], // Use standard status values
        visaStatuses: ['valid', 'expiring_soon', 'expired', 'processing', 'unknown'] // Use standard visa status values
      };

      // Cache the result
      this.filterOptionsCache = { data: result, timestamp: Date.now() };
      this.logPerformance('getFilterOptions-query', performance.now() - startTime);
      
      return result;
    } catch (error) {
      log.error('Error getting filter options:', error);
      
      // If it's a timeout error, return basic data
      if (error instanceof Error && error.message.includes('timeout')) {
        log.info('⚠️ Filter options query timed out, returning basic data');
      }
      
      // Return fallback data to prevent UI from breaking
      return {
        companies: [
          'CUBS', 
          'GOLDEN CUBS', 
          'CUBS CONTRACTING', 
          'FLUID ENGINEERING',
          'AL ASHBAL AJMAN',
          'AL MACEN',
          'RUKIN AL ASHBAL',
          'ASHBAL AL KHALEEJ',
          'AL HANA TOURS & TRAVELS'
        ],
        trades: ['Electrician', 'Plumber', 'Carpenter', 'Welder', 'Technician'],
        nationalities: ['Indian', 'Pakistani', 'Bangladeshi', 'Filipino', 'Nepali'],
        statuses: ['active', 'inactive', 'pending', 'suspended'],
        visaStatuses: ['valid', 'expiring_soon', 'expired', 'processing', 'unknown']
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
      log.error('Error getting temporary workers count:', error);
      return 0;
    }
  }

  // Dashboard-specific methods - OPTIMIZED with single RPC call
  static async getAdminDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
    try {
      // Check cache first
      const cacheKey = JSON.stringify(filters || {});
      const cached = this.dashboardStatsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.DASHBOARD_CACHE_DURATION_MS) {
        return cached.data;
      }

      // Use the new consolidated RPC function
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) {
        log.error('Error fetching dashboard stats via RPC:', error);
        // Fallback to individual queries if RPC fails
        return this.getAdminDashboardStatsFallback(filters);
      }

      if (!data) {
        throw new Error('No data returned from dashboard stats function');
      }

      // Type assertion for the RPC response - cast to any first, then to DashboardStats
      const rpcData = data as any;

      const stats: DashboardStats = {
        totalEmployees: Number(rpcData.totalEmployees) || 0,
        activeEmployees: Number(rpcData.activeEmployees) || 0,
        totalDocuments: Number(rpcData.totalDocuments) || 0,
        pendingApprovals: Number(rpcData.pendingApprovals) || 0,
        visasExpiringSoon: Number(rpcData.visasExpiringSoon) || 0,
        departments: Number(rpcData.departments) || 0
      };

      // Cache the result
      this.dashboardStatsCache.set(cacheKey, { data: stats, timestamp: Date.now() });

      return stats;
    } catch (error) {
      log.error('Error in getAdminDashboardStats:', error);
      // Fallback to individual queries
      return this.getAdminDashboardStatsFallback(filters);
    }
  }

  // Fallback method for dashboard stats (original implementation)
  private static async getAdminDashboardStatsFallback(filters?: DashboardFilters): Promise<DashboardStats> {
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

      // Get pending approvals from profiles table
      const { count: pendingApprovals, error: approvalsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .is('approved_by', null);

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

      const uniqueDepartments = new Set(departments?.map((d: any) => d.trade) || []).size;

      if (employeesError || activeError || docsError || approvalsError || visaError || deptError) {
        log.error('Error fetching dashboard stats:', { employeesError, activeError, docsError, approvalsError, visaError, deptError });
        throw new Error('Failed to fetch dashboard statistics');
      }

      return {
        totalEmployees: totalEmployees || 0,
        activeEmployees: activeEmployees || 0,
        totalDocuments: totalDocuments || 0,
        pendingApprovals: pendingApprovals || 0,
        visasExpiringSoon: visasExpiringSoon || 0,
        departments: uniqueDepartments
      };
    } catch (error) {
      log.error('Error in getAdminDashboardStatsFallback:', error);
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
        log.error('Error fetching department distribution:', error);
        throw error;
      }

      // Group by department and calculate statistics
      const departmentMap = new Map<string, { count: number; recentCount: number }>();
      
      data?.forEach(employee => {
        const trade = ((employee as any).trade as string) || 'Unknown';
        const isRecent = new Date((employee as any).created_at as string) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
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
      log.error('Error in getEmployeeDistributionByDepartment:', error);
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
        log.error('Error fetching company distribution:', error);
        throw error;
      }

      const companyMap = new Map<string, { count: number; recentCount: number }>();
      data?.forEach(emp => {
        const company = ((emp as any).company_name as string) || 'Unknown';
        const isRecent = new Date((emp as any).created_at as string) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
      log.error('Error in getEmployeeDistributionByCompany:', error);
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
          log.error('Error fetching growth trend data:', { empError, docError });
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
      log.error('Error in getGrowthTrendData:', error);
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
        log.error('Error fetching expiring visas:', error);
        throw error;
      }

      return data?.map(employee => {
        const daysLeft = Math.ceil((new Date((employee as any).visa_expiry_date as string).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (daysLeft <= 7) urgency = 'critical';
        else if (daysLeft <= 30) urgency = 'high';
        else if (daysLeft <= 60) urgency = 'medium';

        return {
          employee_id: (employee as any).employee_id as string,
          name: ((employee as any).name as string) || 'Unknown',
          visa_type: ((employee as any).visa_status as string) || 'Unknown',
          visa_expiry_date: (employee as any).visa_expiry_date as string,
          daysLeft,
          urgency
        };
      }) || [];
    } catch (error) {
      log.error('Error in getExpiringVisasSummary:', error);
      throw error;
    }
  }

  // Test search functionality
  static async testEmployeeSearch(searchTerm: string): Promise<{ success: boolean; results: any[]; error?: string }> {
    try {
      log.info(`🧪 Testing employee search with term: "${searchTerm}"`);

      const result = await this.getEmployees({ page: 1, pageSize: 10 }, { search: searchTerm });

      if (result.error) {
        return { success: false, results: [], error: result.error };
      }

      return {
        success: true,
        results: result.data.map(emp => ({
          employee_id: emp.employee_id,
          name: emp.name,
          company_name: emp.company_name,
          trade: emp.trade
        }))
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
