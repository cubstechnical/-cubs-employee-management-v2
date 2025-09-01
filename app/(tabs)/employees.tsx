'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Metadata } from 'next';
import { EmployeeService, PaginationParams, EmployeeFilters, FilterOptions } from '@/lib/services/employees';

export const metadata: Metadata = {
  title: 'Employees',
  description: 'View and manage employee information, track visa status, and maintain comprehensive employee records.',
  keywords: ['employees', 'employee management', 'visa tracking', 'employee database', 'HR management'],
};
import { Employee } from '@/lib/supabase/client';
import { formatDate } from '@/utils/date';
import { useDebounce } from '@/hooks/usePerformance';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Edit,
  Plus,
  Loader2,
  RefreshCw,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mobile-optimized employee card component
const EmployeeCard = ({ employee, onView, onEdit }: { 
  employee: Employee; 
  onView: () => void; 
  onEdit: () => void; 
}) => {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {employee.name?.charAt(0)?.toUpperCase() || 'N'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{employee.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {employee.employee_id}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onView}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 truncate">{employee.company_name || '-'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 dark:text-gray-300 truncate">{employee.trade || '-'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 dark:text-gray-300 truncate">{employee.nationality || '-'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 dark:text-gray-300 truncate">{employee.visa_type || '-'}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
          {employee.status || 'Unknown'}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVisaStatusColor(employee.visa_status)}`}>
          {employee.visa_status || 'Unknown'}
        </span>
      </div>
    </div>
  );
};

// Main Employees component
function EmployeesOptimized() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [filters, setFilters] = useState<EmployeeFilters>({
    company_name: '',
    status: '',
    visa_status: '',
    nationality: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    companies: [],
    statuses: [],
    visaStatuses: [],
    nationalities: [],
    trades: []
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchEmployees = useCallback(async (page?: number, search?: string, filterOpts?: EmployeeFilters) => {
    const pageToFetch = page || currentPage;
    const searchToUse = search !== undefined ? search : debouncedSearchTerm;
    const filtersToUse = filterOpts || filters;

      setLoading(true);
    try {
      const params: PaginationParams = {
        page: pageToFetch,
        pageSize: 10
      };

      const result = await EmployeeService.getEmployees(params, {
        ...filtersToUse,
        search: searchToUse
      });
      
      if (result.employees) {
        setEmployees(result.employees);
        setTotalPages(result.totalPages || 1);
        setTotalEmployees(result.total || 0);
      }
    } catch (error) {
      toast.error('Failed to load employees');
    } finally {
        setLoading(false);
        setInitialLoading(false);
      }
  }, [currentPage, debouncedSearchTerm, filters]);

  const handleRefresh = useCallback(async () => {
    await fetchEmployees();
    toast.success('Employees refreshed');
  }, [fetchEmployees]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      company_name: '',
      status: '',
      visa_status: '',
      nationality: ''
    });
    setCurrentPage(1);
  };

  // Load employees when dependencies change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await EmployeeService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    loadFilterOptions();
  }, []);

  if (initialLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''} found
              </p>
            </div>
          <Button
            onClick={() => router.push('/admin/employees/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Search */}
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

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {Object.values(filters).some(v => v) && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </Button>

              {Object.values(filters).some(v => v) && (
              <Button
                  onClick={clearFilters}
                variant="outline"
                      size="sm"
                    >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                    </Button>
              )}
                </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company
                    </label>
                    <select
                      value={filters.company_name}
                      onChange={(e) => handleFilterChange('company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                    <option value="">All Companies</option>
                    {filterOptions.companies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Visa Status
                    </label>
                    <select
                      value={filters.visa_status}
                      onChange={(e) => handleFilterChange('visa_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Visa Statuses</option>
                    {filterOptions.visaStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nationality
                    </label>
                    <select
                      value={filters.nationality}
                      onChange={(e) => handleFilterChange('nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Nationalities</option>
                    {filterOptions.nationalities.map(nationality => (
                        <option key={nationality} value={nationality}>{nationality}</option>
                      ))}
                    </select>
                  </div>
                  </div>
            )}
          </div>
        </Card>

        {/* Employees List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No employees found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || Object.values(filters).some(v => v) 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first employee'
                }
              </p>
              {!searchTerm && !Object.values(filters).some(v => v) && (
                <Button
                  onClick={() => router.push('/admin/employees/new')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {employees.map(employee => (
                <EmployeeCard
                  key={employee.employee_id}
                  employee={employee}
                  onView={() => router.push(`/admin/employees/${employee.employee_id}`)}
                  onEdit={() => router.push(`/admin/employees/${employee.employee_id}`)}
                />
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
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
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function EmployeesPage() {
  return (
    <ErrorBoundary>
      <EmployeesOptimized />
    </ErrorBoundary>
  );
}
