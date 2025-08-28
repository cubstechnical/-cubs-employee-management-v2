'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
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
          <span className="text-gray-700 dark:text-gray-300 truncate">
            {employee.visa_expiry_date ? formatDate(new Date(employee.visa_expiry_date)) : '-'}
          </span>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
          {employee.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
          {employee.status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
          {employee.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
          {employee.status?.charAt(0)?.toUpperCase()}{employee.status?.slice(1)}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getVisaStatusColor(employee.visa_status)}`}>
          {employee.visa_status === 'valid' && <CheckCircle className="w-3 h-3 mr-1" />}
          {employee.visa_status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
          {employee.visa_status === 'expiring_soon' && <AlertCircle className="w-3 h-3 mr-1" />}
          {employee.visa_status?.replace('_', ' ').charAt(0)?.toUpperCase()}{employee.visa_status?.replace('_', ' ').slice(1)}
        </span>
      </div>
    </div>
  );
};

// Loading skeleton component
const EmployeeSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mt-1"></div>
        </div>
      </div>
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
    <div className="flex gap-2">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
    </div>
  </div>
);

export default function EmployeesOptimized() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<EmployeeSkeleton />}>
        <EmployeesContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function EmployeesContent() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isMobile, setIsMobile] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    companies: [],
    trades: [],
    nationalities: [],
    statuses: [],
    visaStatuses: []
  });
  
  const [filters, setFilters] = useState<EmployeeFilters>({
    status: '',
    company_name: '',
    trade: '',
    nationality: '',
    visa_status: '',
    is_temporary: false
  });

  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimized data fetching with better caching
  const latestReqRef = useRef(0);
  const fetchEmployees = useCallback(async (page: number = currentPage, search: string = debouncedSearchTerm, filterOpts: EmployeeFilters = filters) => {
    const reqId = ++latestReqRef.current;
    try {
      setLoading(true);
      
      const params: PaginationParams = {
        page,
        pageSize: isMobile ? 20 : 25 // Smaller page size for mobile
      };

      // Enhanced caching with mobile consideration
      const cacheKey = `employees:list:${params.page}:${params.pageSize}:${JSON.stringify(filterOpts)}:${search}:${isMobile}`;
      if (typeof window !== 'undefined') {
        const cached = window.localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { data: any; ts: number };
            if (Date.now() - parsed.ts < 5 * 60 * 1000) { // 5 minutes cache
              if (latestReqRef.current === reqId) {
                setEmployees(parsed.data.employees);
                setTotalPages(parsed.data.totalPages);
                setTotalEmployees(parsed.data.total);
                return;
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
  }, [currentPage, debouncedSearchTerm, filters, isMobile]);

  useEffect(() => {
    if (!initialLoading) {
      fetchEmployees(1, debouncedSearchTerm, filters);
    }
  }, [debouncedSearchTerm, filters, fetchEmployees, initialLoading]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
      <div className="space-y-4 lg:space-y-6">
        {/* Header Section - Mobile Optimized */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold flex items-center space-x-2 lg:space-x-3">
                <Users className="w-6 h-6 lg:w-8 lg:h-8" />
                <span>Employee Management</span>
              </h1>
              <p className="text-blue-100 mt-1 lg:mt-2 text-sm lg:text-base">
                Manage and monitor your workforce with advanced filtering and insights
              </p>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-2xl lg:text-3xl font-bold">{totalEmployees}</div>
              <div className="text-blue-100 text-sm lg:text-base">Total Employees</div>
            </div>
          </div>
        </div>

        {/* Controls Section - Mobile Optimized */}
        <Card className="p-4 lg:p-6">
          <div className="flex flex-col space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Action Buttons - Stacked on mobile */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
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
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                onClick={() => router.push('/admin/employees/new')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

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
          </div>
        </Card>

        {/* Content Section - Mobile Card View */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <EmployeeSkeleton key={i} />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No employees found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {employees.map((employee) => (
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

