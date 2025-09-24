'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/badge/Badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2,
  Users,
  Building,
  Calendar,
  MapPin,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditService } from '@/lib/services/audit';
import { EmployeeService } from '@/lib/services/employees';
import VirtualizedEmployeeList from '@/components/employees/VirtualizedEmployeeList';

interface Employee {
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
}

interface EmployeeCounts {
  all: number;
  active: number;
  inactive: number;
}

interface DeleteConfirmationState {
  isOpen: boolean;
  employee: Employee | null;
  isDeleting: boolean;
}


export default function EmployeesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    employee: null,
    isDeleting: false
  });
  const [useVirtualizedList, setUseVirtualizedList] = useState(false);

  // Debounce search term with longer delay for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Increased from 300ms to 500ms for better performance

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const pageSize = 10; // Show only 10 employees per page

  // Fetch unique company names for filter
  const { data: companies = [] } = useQuery<string[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('employee_table')
          .select('company_name')
          .not('company_name', 'is', null)
          .order('company_name');

        if (error) {
          console.error('❌ Error fetching companies:', error);
          return [];
        }

        // Get unique company names
        const uniqueCompanies = [...new Set(data.map((item: { company_name: unknown }) => item.company_name as string))];
        return uniqueCompanies;
      } catch (err) {
        console.error('❌ Error in companies query:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch accurate employee counts for filters
  const { data: employeeCounts = { all: 0, active: 0, inactive: 0 } } = useQuery<EmployeeCounts>({
    queryKey: ['employee-counts', debouncedSearchTerm, filterCompany],
    queryFn: async () => {
      try {
        // Base query
        let baseQuery = supabase
          .from('employee_table')
          .select('is_active', { count: 'exact' });

        // Apply search filter if present
        if (debouncedSearchTerm.trim()) {
          const searchPattern = `%${debouncedSearchTerm.trim()}%`;
          baseQuery = baseQuery.or(`name.ilike.${searchPattern},email_id.ilike.${searchPattern},company_name.ilike.${searchPattern},trade.ilike.${searchPattern},employee_id.ilike.${searchPattern}`);
        }

        // Apply company filter if present
        if (filterCompany !== 'all') {
          baseQuery = baseQuery.eq('company_name', filterCompany);
        }

        // Get all count
        const { count: allCount } = await baseQuery;

        // Get active count
        const { count: activeCount } = await baseQuery.eq('is_active', true);

        // Get inactive count
        const { count: inactiveCount } = await baseQuery.eq('is_active', false);

        return {
          all: allCount || 0,
          active: activeCount || 0,
          inactive: inactiveCount || 0
        };
      } catch (err) {
        console.error('❌ Error fetching employee counts:', err);
        return { all: 0, active: 0, inactive: 0 };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch employees data with pagination
  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees', selectedEmployee?.id, debouncedSearchTerm, filterStatus, filterCompany, currentPage],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching employees with search:', debouncedSearchTerm, 'filter:', filterStatus, 'selected:', selectedEmployee?.name, 'page:', currentPage);
        
        // If a specific employee is selected, show only that employee
        if (selectedEmployee) {
          console.log('🔍 Fetching selected employee:', selectedEmployee.id);
          const { data, error } = await supabase
            .from('employee_table')
            .select('*')
            .eq('id', selectedEmployee.id)
            .single();

          if (error) {
            console.error('❌ Error fetching selected employee:', error);
            throw new Error(`Failed to fetch selected employee: ${error.message}`);
          }
          
          console.log('✅ Selected employee fetched:', data?.name);
          setTotalPages(1);
          setTotalEmployees(1);
          return [(data as unknown) as Employee];
        }

        // Otherwise, perform paginated search
        console.log('🔍 Performing paginated search...');
        let query = supabase
          .from('employee_table')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        // Apply search filter
        if (debouncedSearchTerm.trim()) {
          const searchPattern = `%${debouncedSearchTerm.trim()}%`;
          console.log('🔍 Applying search pattern:', searchPattern);
          query = query.or(`name.ilike.${searchPattern},email_id.ilike.${searchPattern},company_name.ilike.${searchPattern},trade.ilike.${searchPattern},employee_id.ilike.${searchPattern}`);
        }

        // Apply status filter
        if (filterStatus !== 'all') {
          console.log('🔍 Applying status filter:', filterStatus);
          query = query.eq('is_active', filterStatus === 'active');
        }

        // Apply company filter
        if (filterCompany !== 'all') {
          console.log('🔍 Applying company filter:', filterCompany);
          query = query.eq('company_name', filterCompany);
        }

        // Apply pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) {
          console.error('❌ Error fetching employees:', error);
          throw new Error(`Database query failed: ${error.message}`);
        }
        
        // Update pagination info
        const total = count || 0;
        const pages = Math.ceil(total / pageSize);
        setTotalPages(pages);
        setTotalEmployees(total);
        
        console.log(`✅ Employees fetched: ${data?.length || 0} of ${total} (page ${currentPage}/${pages})`);
        return (data as unknown) as Employee[];
      } catch (err) {
        console.error('❌ Query function error:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true, // Always enabled
    retry: 1, // Only retry once on failure
  });

  // Extract suggestions from main results (first 8 for autocomplete)
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    return employees.slice(0, 8);
  }, [employees, searchTerm]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus, filterCompany]);

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      console.log('🗑️ Deleting employee:', employeeId);
      
      // Use EmployeeService.deleteEmployee which properly handles document deletion
      const result = await EmployeeService.deleteEmployee(employeeId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete employee');
      }
      
      console.log('✅ Employee deleted successfully');
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-counts'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      toast.success('Employee deleted successfully!');
      setDeleteConfirmation({ isOpen: false, employee: null, isDeleting: false });
    },
    onError: (error) => {
      console.error('❌ Delete mutation error:', error);
      toast.error(`Failed to delete employee: ${error.message}`);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    },
  });

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length >= 2);
    setSelectedEmployee(null); // Clear selection when typing
    setHighlightedIndex(-1); // Reset highlight
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
          handleSuggestionSelect(searchSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(employee.name);
    setShowSuggestions(false);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Handle search input blur (with delay to allow clicks)
  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Clear search and selection
  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterStatus('all');
    setFilterCompany('all');
    setSelectedEmployee(null);
    setShowSuggestions(false);
  };

  // Handle delete employee
  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteConfirmation({
      isOpen: true,
      employee,
      isDeleting: false
    });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmation.employee) {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));
      deleteEmployeeMutation.mutate(deleteConfirmation.employee.id);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, employee: null, isDeleting: false });
  };

  // Get first letter of name for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVisaStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'unknown', color: 'info' as const };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'error' as const };
    if (daysUntilExpiry <= 30) return { status: 'expiring', color: 'warning' as const };
    return { status: 'valid', color: 'success' as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
        </div>
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <Users className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Employees
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load employee data'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your workforce across all companies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseVirtualizedList(!useVirtualizedList)}
            className={useVirtualizedList ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
          >
            {useVirtualizedList ? '📊 Virtualized' : '📋 Standard'}
          </Button>
          <Button 
            className="bg-[#d3194f] hover:bg-[#b0173a] text-white"
            onClick={() => router.push('/employees/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search Results Info */}
      {(selectedEmployee || searchTerm || filterStatus !== 'all' || filterCompany !== 'all') && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {selectedEmployee ? (
                  <>
                    Showing: <strong>{selectedEmployee.name}</strong>
                    {filterStatus !== 'all' && ` • Filtered by ${filterStatus}`}
                    {filterCompany !== 'all' && ` • Company: ${filterCompany}`}
                  </>
                ) : (
                  <>
                    {searchTerm ? `Searching for "${searchTerm}"` : ''}
                    {searchTerm && (filterStatus !== 'all' || filterCompany !== 'all') ? ' • ' : ''}
                    {filterStatus !== 'all' ? `Filtered by ${filterStatus}` : ''}
                    {filterStatus !== 'all' && filterCompany !== 'all' ? ' • ' : ''}
                    {filterCompany !== 'all' ? `Company: ${filterCompany}` : ''}
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {employees.length} result{employees.length !== 1 ? 's' : ''}
              </span>
              {selectedEmployee && (
                <button
                  onClick={clearSearch}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search employees by name, company, trade, or employee ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Google-style Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchSuggestions.map((employee, index) => (
                  <div
                    key={employee.id}
                    onClick={() => handleSuggestionSelect(employee)}
                    className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                      index === highlightedIndex 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 bg-[#d3194f]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-[#d3194f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {employee.name}
                        </p>
                        <Badge color={employee.is_active ? 'success' : 'error'} className="text-xs">
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        ID: {employee.employee_id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {employee.company_name}
                        </span>
                        {employee.trade && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {employee.trade}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                
                {/* Show more results link */}
                {searchSuggestions.length >= 8 && (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Press Enter to see all results for &quot;{searchTerm}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* No suggestions found */}
            {showSuggestions && searchTerm.length >= 2 && searchSuggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                <div className="text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No employees found for &quot;{searchTerm}&quot;
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Try a different search term
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-500" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
            >
              <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All ({employeeCounts.all})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Active ({employeeCounts.active})
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'primary' : 'outline'}
              onClick={() => setFilterStatus('inactive')}
              size="sm"
            >
              Inactive ({employeeCounts.inactive})
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results Indicator */}
      {(searchTerm || filterStatus !== 'all' || filterCompany !== 'all') && employees.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {searchTerm ? (
                  `Found ${totalEmployees} employees matching "${searchTerm}"`
                ) : (
                  `Showing ${totalEmployees} ${filterStatus} employees${filterCompany !== 'all' ? ` from ${filterCompany}` : ''}`
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Employee List */}
      {useVirtualizedList ? (
        <VirtualizedEmployeeList
          searchTerm={debouncedSearchTerm}
          filterStatus={filterStatus}
          filterCompany={filterCompany}
          onDeleteEmployee={handleDeleteEmployee}
          height={600}
        />
      ) : (
        <div className="grid gap-4">
          {employees.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Employees Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first employee'}
              </p>
              <Button 
                className="bg-[#d3194f] hover:bg-[#b0173a] text-white"
                onClick={() => router.push('/employees/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </Card>
          ) : (
            employees.map((employee) => {
              const visaStatus = getVisaStatus(employee.visa_expiry_date);
              return (
                <Card key={employee.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#d3194f]/10 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-[#d3194f]">
                          {getInitials(employee.name)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          ID: {employee.employee_id}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Building className="w-3 h-3" />
                            {employee.company_name}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {employee.nationality || 'N/A'}
                          </div>
                          {employee.trade && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <span className="w-3 h-3">🔧</span>
                              {employee.trade}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge color={employee.is_active ? 'success' : 'error'}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="mt-1">
                          <Badge color={visaStatus.color}>
                            Visa {visaStatus.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/employees/${employee.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {employee.visa_expiry_date && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Visa expires: {formatDate(employee.visa_expiry_date)}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEmployees)} of {totalEmployees} employees
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Employee
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {deleteConfirmation.employee?.name}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Employee ID: {deleteConfirmation.employee?.employee_id}
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={deleteConfirmation.isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                disabled={deleteConfirmation.isDeleting}
              >
                {deleteConfirmation.isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 