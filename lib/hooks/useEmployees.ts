import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService, EmployeeFilters, PaginationParams, CreateEmployeeData, UpdateEmployeeData } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

// Query keys for consistent caching
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters, pagination: PaginationParams) => 
    [...employeeKeys.lists(), { filters, pagination }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  filterOptions: () => [...employeeKeys.all, 'filterOptions'] as const,
  dashboardStats: () => [...employeeKeys.all, 'dashboardStats'] as const,
};

// Hook for fetching employees with filters and pagination
export function useEmployees(filters: EmployeeFilters = {}, pagination: PaginationParams = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: employeeKeys.list(filters, pagination),
    queryFn: () => EmployeeService.getEmployees(pagination, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes (increased for better performance)
    gcTime: 15 * 60 * 1000, // 15 minutes (increased for better performance)
    retry: 2,
    // Optimize for performance
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Enable background updates
    refetchOnMount: true,
  });
}

// Hook for fetching a single employee
export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => EmployeeService.getEmployeeById(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching filter options
export function useEmployeeFilterOptions() {
  return useQuery({
    queryKey: employeeKeys.filterOptions(),
    queryFn: () => EmployeeService.getFilterOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour - filter options don't change often (increased)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours (increased)
    retry: 1, // Reduce retries for filter options
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Hook for dashboard stats
export function useEmployeeDashboardStats() {
  return useQuery({
    queryKey: employeeKeys.dashboardStats(),
    queryFn: () => EmployeeService.getAdminDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for creating a new employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeData) => EmployeeService.createEmployee(data),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate and refetch employee lists
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.filterOptions() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.dashboardStats() });
        toast.success('Employee created successfully');
      } else {
        toast.error(result.error || 'Failed to create employee');
      }
    },
    onError: (error) => {
      log.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    },
  });
}

// Hook for updating an employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEmployeeData) => EmployeeService.updateEmployee(data),
    onSuccess: (employee) => {
      if (employee) {
        // Update the specific employee in cache
        queryClient.setQueryData(employeeKeys.detail(employee.employee_id), { employee, error: null });
        // Invalidate lists to refetch with updated data
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.filterOptions() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.dashboardStats() });
        toast.success('Employee updated successfully');
      } else {
        toast.error('Failed to update employee');
      }
    },
    onError: (error) => {
      log.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    },
  });
}

// Hook for deleting an employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => EmployeeService.deleteEmployee(employeeId),
    onSuccess: (result, employeeId) => {
      if (result.success) {
        // Remove the employee from cache
        queryClient.removeQueries({ queryKey: employeeKeys.detail(employeeId) });
        // Invalidate lists to refetch without the deleted employee
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.filterOptions() });
        queryClient.invalidateQueries({ queryKey: employeeKeys.dashboardStats() });
        toast.success(`Employee deleted successfully${result.deletedDocuments ? ` (${result.deletedDocuments} documents removed)` : ''}`);
      } else {
        toast.error(result.error || 'Failed to delete employee');
      }
    },
    onError: (error) => {
      log.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    },
  });
}

// Hook for refreshing employee data
export function useRefreshEmployees() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    toast.success('Employee data refreshed');
  };
}
