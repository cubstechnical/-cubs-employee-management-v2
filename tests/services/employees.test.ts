import { EmployeeService } from '@/lib/services/employees';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ne: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should return employees with pagination', async () => {
      const mockEmployees = [
        {
          id: 'emp-1',
          name: 'John Doe',
          employee_id: 'EMP001',
          email_id: 'john@example.com',
          status: 'active',
        },
        {
          id: 'emp-2',
          name: 'Jane Smith',
          employee_id: 'EMP002',
          email_id: 'jane@example.com',
          status: 'active',
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: mockEmployees,
        error: null,
        count: 2,
      });

      const result = await EmployeeService.getEmployees(1, 10, '', {});

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual({
        employees: mockEmployees,
        totalCount: 2,
        error: null,
      });
    });

    it('should apply search filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await EmployeeService.getEmployees(1, 10, 'john', {});

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%john%');
    });

    it('should apply status filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await EmployeeService.getEmployees(1, 10, '', { status: 'active' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should handle database errors', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: 0,
      });

      const result = await EmployeeService.getEmployees(1, 10, '', {});

      expect(result).toEqual({
        employees: [],
        totalCount: 0,
        error: mockError,
      });
    });
  });

  describe('getEmployee', () => {
    it('should return a single employee', async () => {
      const mockEmployee = {
        id: 'emp-1',
        name: 'John Doe',
        employee_id: 'EMP001',
        email_id: 'john@example.com',
        status: 'active',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: mockEmployee,
        error: null,
      });

      const result = await EmployeeService.getEmployee('emp-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'emp-1');
      expect(result).toEqual({
        employee: mockEmployee,
        error: null,
      });
    });

    it('should handle employee not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Employee not found' },
      });

      const result = await EmployeeService.getEmployee('nonexistent');

      expect(result).toEqual({
        employee: null,
        error: { message: 'Employee not found' },
      });
    });
  });

  describe('createEmployee', () => {
    it('should successfully create an employee', async () => {
      const employeeData = {
        name: 'John Doe',
        employee_id: 'EMP001',
        email_id: 'john@example.com',
        status: 'active',
      };

      const mockEmployee = {
        id: 'emp-1',
        ...employeeData,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: mockEmployee,
        error: null,
      });

      const result = await EmployeeService.createEmployee(employeeData);

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.insert).toHaveBeenCalledWith(employeeData);
      expect(result).toEqual({
        success: true,
        employee: mockEmployee,
        error: null,
      });
    });

    it('should handle creation errors', async () => {
      const employeeData = {
        name: 'John Doe',
        employee_id: 'EMP001',
        email_id: 'john@example.com',
        status: 'active',
      };

      const mockError = { message: 'Employee ID already exists' };
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await EmployeeService.createEmployee(employeeData);

      expect(result).toEqual({
        success: false,
        employee: null,
        error: mockError,
      });
    });
  });

  describe('updateEmployee', () => {
    it('should successfully update an employee', async () => {
      const employeeId = 'emp-1';
      const updateData = {
        name: 'John Updated',
        status: 'inactive',
      };

      const mockEmployee = {
        id: employeeId,
        ...updateData,
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: mockEmployee,
        error: null,
      });

      const result = await EmployeeService.updateEmployee(employeeId, updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', employeeId);
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual({
        success: true,
        employee: mockEmployee,
        error: null,
      });
    });

    it('should handle update errors', async () => {
      const employeeId = 'emp-1';
      const updateData = { name: 'John Updated' };
      const mockError = { message: 'Employee not found' };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await EmployeeService.updateEmployee(employeeId, updateData);

      expect(result).toEqual({
        success: false,
        employee: null,
        error: mockError,
      });
    });
  });

  describe('deleteEmployee', () => {
    it('should successfully delete an employee', async () => {
      const employeeId = 'emp-1';

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await EmployeeService.deleteEmployee(employeeId);

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', employeeId);
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it('should handle deletion errors', async () => {
      const employeeId = 'emp-1';
      const mockError = { message: 'Employee not found' };

      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await EmployeeService.deleteEmployee(employeeId);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
    });
  });

  describe('getAdminDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalEmployees: 100,
        totalDocuments: 500,
        pendingApprovals: 5,
        departments: 10,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      
      // Mock the count queries
      mockQuery.eq.mockResolvedValue({ count: 100, error: null });
      mockQuery.ne.mockResolvedValue({ count: 5, error: null });

      const result = await EmployeeService.getAdminDashboardStats({});

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(result).toEqual(expect.objectContaining({
        totalEmployees: expect.any(Number),
        totalDocuments: expect.any(Number),
        pendingApprovals: expect.any(Number),
        departments: expect.any(Number),
      }));
    });
  });

  describe('getEmployeeDistributionByCompany', () => {
    it('should return employee distribution by company', async () => {
      const mockDistribution = [
        { company_name: 'Company A', count: 50 },
        { company_name: 'Company B', count: 30 },
        { company_name: 'Company C', count: 20 },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.ne.mockResolvedValue({
        data: mockDistribution,
        error: null,
      });

      const result = await EmployeeService.getEmployeeDistributionByCompany({});

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(result).toEqual(mockDistribution);
    });
  });

  describe('getExpiringVisasSummary', () => {
    it('should return expiring visas summary', async () => {
      const mockExpiringVisas = [
        {
          id: 'emp-1',
          name: 'John Doe',
          visa_expiry_date: '2024-02-01',
          days_until_expiry: 5,
        },
        {
          id: 'emp-2',
          name: 'Jane Smith',
          visa_expiry_date: '2024-02-15',
          days_until_expiry: 19,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.limit.mockResolvedValue({
        data: mockExpiringVisas,
        error: null,
      });

      const result = await EmployeeService.getExpiringVisasSummary(30);

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(result).toEqual(mockExpiringVisas);
    });
  });
});

