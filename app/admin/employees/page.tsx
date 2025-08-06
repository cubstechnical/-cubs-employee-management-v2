'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EmployeeService, PaginationParams, EmployeeFilters, FilterOptions } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import { formatDate, getVisaStatus } from '@/utils/date';
import { useDebounce } from '@/hooks/usePerformance';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  Globe,
  CreditCard,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';

export default function AdminEmployees() {
  return (
    <ProtectedRoute>
      <AdminEmployeesContent />
    </ProtectedRoute>
  );
}

function AdminEmployeesContent() {
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

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await EmployeeService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async (page: number = currentPage, search: string = debouncedSearchTerm, filterOpts: EmployeeFilters = filters) => {
    try {
      setLoading(true);
      
      const params: PaginationParams = {
        page,
        pageSize: 25
      };

      const result = await EmployeeService.getEmployees(params, {
        ...filterOpts,
        search
      });
      
      setEmployees(result.employees);
      setTotalPages(result.totalPages);
      setTotalEmployees(result.total);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filters]);

  // Effects
  useEffect(() => {
    if (!initialLoading) {
      fetchEmployees(1, debouncedSearchTerm, filters);
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, filters]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchEmployees(page);
  }, [fetchEmployees]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEmployees(currentPage, debouncedSearchTerm, filters);
    setIsRefreshing(false);
    toast.success('Employee data refreshed');
  }, [fetchEmployees, currentPage, debouncedSearchTerm, filters]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'inactive': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      case 'terminated': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getVisaStatusColor = (expiryDate: string) => {
    if (!expiryDate) return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (daysUntilExpiry <= 30) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  };

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {employee.name}
              </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employee.employee_id} • {employee.trade}
            </p>
            </div>
              </div>
              <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/employees/${employee.id}`)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
              </div>
              </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {employee.company_name || 'N/A'}
            </p>
              </div>
            </div>

        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Nationality</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {employee.nationality || 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              getStatusColor(employee.status || 'N/A')
            )}>
              {employee.status || 'N/A'}
            </span>
          </div>
            </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Visa Expiry</p>
            {employee.visa_expiry_date ? (
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              getVisaStatusColor(employee.visa_expiry_date)
            )}>
                {formatDate(employee.visa_expiry_date)}
              </span>
            ) : (
              <span className="text-sm text-gray-500">N/A</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mobile</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {employee.mobile_number || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {employee.email_id || 'N/A'}
            </p>
            </div>
          </div>
          
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Join Date</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {employee.joining_date ? formatDate(employee.joining_date) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
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
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Employee Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all employee records
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/admin/employees/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
                  type="text"
                  placeholder="Search employees by name, ID, trade, or company..."
              value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalEmployees} total employees
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
            <select
                  value={filters.company_name}
                  onChange={(e) => setFilters(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
                  {filterOptions.companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trade
                </label>
                <select
                  value={filters.trade}
                  onChange={(e) => setFilters(prev => ({ ...prev, trade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Trades</option>
                  {filterOptions.trades.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nationality
                </label>
                <select
                  value={filters.nationality}
                  onChange={(e) => setFilters(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Nationalities</option>
                  {filterOptions.nationalities.map(nationality => (
                    <option key={nationality} value={nationality}>{nationality}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
            <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
                  {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Status
                </label>
            <select
                  value={filters.visa_status}
                  onChange={(e) => setFilters(prev => ({ ...prev, visa_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Visa Statuses</option>
                  {filterOptions.visaStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
              </div>
          </div>
          )}
        </Card>

        {/* Employee Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading employees...</span>
        </div>
          ) : employees.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No employees found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first employee'}
              </p>
              {!searchTerm && !Object.values(filters).some(f => f) && (
                <Button onClick={() => router.push('/admin/employees/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              )}
            </Card>
          ) : (
            <>
              {employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {currentPage} of {totalPages} ({totalEmployees} total employees)
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "px-3 py-1 text-sm rounded-md transition-colors",
                          page === currentPage 
                            ? "bg-blue-600 text-white" 
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
} 