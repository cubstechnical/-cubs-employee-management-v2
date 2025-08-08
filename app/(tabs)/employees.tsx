'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EmployeeService, PaginationParams, EmployeeFilters, FilterOptions } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import { formatDate } from '@/utils/date';
import { useDebounce } from '@/hooks/usePerformance';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Loader2,
  RefreshCw,
  SortAsc,
  SortDesc,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Columns,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Employee', visible: true, sortable: true, width: 'w-36' },
  { key: 'company_name', label: 'Company', visible: true, sortable: true, width: 'w-32' },
  { key: 'trade', label: 'Trade', visible: true, sortable: true, width: 'w-28' },
  { key: 'nationality', label: 'Nationality', visible: true, sortable: true, width: 'w-24' },
  { key: 'status', label: 'Status', visible: true, sortable: true, width: 'w-20' },
  { key: 'visa_status', label: 'Visa Status', visible: true, sortable: true, width: 'w-24' },
  { key: 'visa_expiry_date', label: 'Visa Expiry', visible: true, sortable: true, width: 'w-28' },
  { key: 'passport_expiry', label: 'Passport Expiry', visible: false, sortable: true, width: 'w-28' },
  { key: 'mobile_number', label: 'Phone', visible: false, sortable: false, width: 'w-28' },
  { key: 'email_id', label: 'Email', visible: false, sortable: false, width: 'w-40' },
  { key: 'basic_salary', label: 'Salary', visible: false, sortable: true, width: 'w-20' },
  { key: 'created_at', label: 'Created', visible: false, sortable: true, width: 'w-28' }
];

export default function Employees() {
  return (
    <ProtectedRoute>
      <EmployeesContent />
    </ProtectedRoute>
  );
}

function EmployeesContent() {
  usePerformanceMonitoring('EmployeesPage');
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    companies: [],
    trades: [],
    nationalities: [],
    statuses: [],
    visaStatuses: []
  });
  const localCacheTTLms = 5 * 60 * 1000; // 5 minutes
  
  const [filters, setFilters] = useState<EmployeeFilters>({
    status: '',
    company_name: '',
    trade: '',
    nationality: '',
    visa_status: '',
    is_temporary: false
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // local cache first
        if (typeof window !== 'undefined') {
          const cached = window.localStorage.getItem('employees:filterOptions');
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as { data: FilterOptions; ts: number };
              if (Date.now() - parsed.ts < localCacheTTLms) {
                setFilterOptions(parsed.data);
              }
            } catch {}
          }
        }
        const options = await EmployeeService.getFilterOptions();
        setFilterOptions(options);
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem('employees:filterOptions', JSON.stringify({ data: options, ts: Date.now() })); } catch {}
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  const latestReqRef = useRef(0);
  const fetchEmployees = useCallback(async (page: number = currentPage, search: string = debouncedSearchTerm, filterOpts: EmployeeFilters = filters) => {
    const reqId = ++latestReqRef.current;
    try {
      setLoading(true);
      
      const params: PaginationParams = {
        page,
        pageSize: 25
      };

      // try local cache first
      const cacheKey = `employees:list:${params.page}:${params.pageSize}:${JSON.stringify(filterOpts)}:${search}`;
      if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { data: any; ts: number };
            if (Date.now() - parsed.ts < localCacheTTLms) {
              if (latestReqRef.current === reqId) {
                setEmployees(parsed.data.employees);
                setTotalPages(parsed.data.totalPages);
                setTotalEmployees(parsed.data.total);
              }
            }
          } catch {}
        }
      }

      const result = await EmployeeService.getEmployees(params, {
        ...filterOpts,
        search
      });
      
      if (latestReqRef.current === reqId) {
        setEmployees(result.employees);
        setTotalPages(result.totalPages);
        setTotalEmployees(result.total);
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })); } catch {}
        }
      }
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      if (latestReqRef.current === reqId) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [currentPage, debouncedSearchTerm, filters]);

  useEffect(() => {
    if (!initialLoading) {
      fetchEmployees(1, debouncedSearchTerm, filters);
    }
  }, [debouncedSearchTerm, filters, fetchEmployees, initialLoading]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchEmployees(page);
  }, [fetchEmployees]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: keyof EmployeeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleColumnToggle = useCallback((columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  }, []);

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEmployees();
    setIsRefreshing(false);
      toast.success('Employees refreshed');
  }, [fetchEmployees]);

  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      company_name: '',
      trade: '',
      nationality: '',
      visa_status: '',
      is_temporary: false
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisaStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'valid': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring_soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderCellContent = (employee: Employee, columnKey: string) => {
    switch (columnKey) {
      
      case 'name':
    return (
        <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {employee.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <div>
              <button 
                onClick={() => router.push(`/admin/employees/${encodeURIComponent(employee.employee_id)}`)}
                className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white text-sm">{employee.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {employee.employee_id}</div>
              </button>
            </div>
          </div>
        );
      case 'company_name':
        return (
          <div className="flex items-center space-x-1">
            <Building className="w-3 h-3 text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">{employee.company_name}</span>
          </div>
        );
      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
            {employee.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
            {employee.status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
            {employee.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {employee.status?.charAt(0)?.toUpperCase()}{employee.status?.slice(1)}
          </span>
        );
      case 'visa_status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVisaStatusColor(employee.visa_status)}`}>
            {employee.visa_status === 'valid' && <CheckCircle className="w-3 h-3 mr-1" />}
            {employee.visa_status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
            {employee.visa_status === 'expiring_soon' && <AlertCircle className="w-3 h-3 mr-1" />}
            {employee.visa_status?.replace('_', ' ').charAt(0)?.toUpperCase()}{employee.visa_status?.replace('_', ' ').slice(1)}
          </span>
        );
      case 'visa_expiry_date':
      case 'passport_expiry':
      case 'created_at':
        const date = employee[columnKey as keyof Employee] as string;
        return date ? (
          <div className="text-sm text-gray-900 dark:text-white">
            {formatDate(new Date(date))}
        </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        );
      case 'basic_salary':
        return employee.basic_salary ? (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            AED {parseInt(employee.basic_salary).toLocaleString()}
        </div>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        );
      default:
        const value = employee[columnKey as keyof Employee];
        return (
          <div className="text-sm text-gray-900 dark:text-white">
            {value || '-'}
      </div>
    );
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Loading employees...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Users className="w-8 h-8" />
                <span>Employee Management</span>
              </h1>
              <p className="text-blue-100 mt-2">
                Manage and monitor your workforce with advanced filtering and insights
            </p>
          </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalEmployees}</div>
              <div className="text-blue-100">Total Employees</div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowColumnConfig(!showColumnConfig)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Columns className="w-4 h-4" />
                <span>Columns</span>
              </Button>
              
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {filters.company_name && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Button>

              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              <Button
                onClick={() => router.push('/admin/employees/new')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </Button>
            </div>
          </div>

          {/* Column Configuration Panel */}
          {showColumnConfig && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Configure Columns</h3>
                <Button
                  onClick={() => setShowColumnConfig(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {columns.map((column) => (
                  <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => handleColumnToggle(column.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filters Panel */}
            {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Filter Employees</h3>
                <div className="flex space-x-2">
                  <Button onClick={resetFilters} variant="ghost" size="sm">
                    Reset
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <select
                    value={filters.company_name}
                    onChange={(e) => handleFilterChange('company_name', e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">All Companies</option>
                    {filterOptions.companies.map((company) => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Table Section */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <div className="inline-block min-w-full align-middle">
              <table data-testid="employee-table" className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.width || ''} ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                      }`}
                      onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            <SortAsc className={`w-3 h-3 ${sortField === column.key && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} />
                            <SortDesc className={`w-3 h-3 -mt-1 ${sortField === column.key && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                            )}
                          </div>
                        </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-gray-500 dark:text-gray-400">Loading employees...</span>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee, index) => (
                    <tr
                      key={employee.employee_id}
                      data-testid="employee-row"
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {visibleColumns.map((column) => (
                        <td key={column.key} className="px-3 py-3 whitespace-nowrap">
                          {renderCellContent(employee, column.key)}
                        </td>
                      ))}
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                              <Button
                            onClick={() => router.push(`/employees/${employee.employee_id}`)}
                                variant="ghost"
                                size="sm"
                            className="text-blue-600 hover:text-blue-800"
                              >
                              <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                            onClick={() => router.push(`/employees/${employee.employee_id}/edit`)}
                                variant="ghost"
                                size="sm"
                            className="text-gray-600 hover:text-gray-800"
                              >
                              <Edit className="w-4 h-4" />
                              </Button>
                          </div>
                        </td>
                      </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((currentPage - 1) * 25) + 1} to {Math.min(currentPage * 25, totalEmployees)} of {totalEmployees} employees
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                      if (pageNumber > totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          variant={currentPage === pageNumber ? "primary" : "outline"}
                          size="sm"
                          className="w-8 h-8"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}