'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EmployeeService, PaginationParams, EmployeeFilters, FilterOptions, Employee } from '@/lib/services/employees';
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
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Logo from '@/components/ui/Logo';
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

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
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Utility function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('employee-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, []);

  // Save search term to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;

    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('employee-recent-searches', JSON.stringify(updated));
    }
  };

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await EmployeeService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        log.error('Error fetching filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

      // Fetch employees with progressive loading
  const fetchEmployees = useCallback(async (page: number = currentPage, search: string = debouncedSearchTerm, filterOpts: EmployeeFilters = filters) => {
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const params: PaginationParams = {
        page,
        pageSize: 25
      };

      const result = await EmployeeService.getEmployees(params, {
        ...filterOpts,
        search
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Brief delay to show 100% progress
      setTimeout(() => {
        setEmployees(result.data);
        setTotalPages(result.totalPages);
        setTotalEmployees(result.total);
        setLoading(false);
        setInitialLoading(false);
        setLoadingProgress(0);
      }, 200);

    } catch (error) {
      log.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setLoading(false);
      setInitialLoading(false);
      setLoadingProgress(0);
    }
  }, [currentPage, debouncedSearchTerm, filters]);

  // Effects
  useEffect(() => {
    if (!initialLoading) {
      fetchEmployees(1, debouncedSearchTerm, filters);
      setCurrentPage(1);
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
  }, []);

  // Handle instant search for dropdown
  const handleInstantSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      // Get instant search results (limited to 5 for dropdown)
      const result = await EmployeeService.getEmployees(
        { page: 1, pageSize: 5 },
        { search: searchTerm.trim() }
      );

      if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      log.error('Instant search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced instant search
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      const timeoutId = setTimeout(() => {
        handleInstantSearch(searchTerm);
      }, 150); // Faster than main search for instant feel

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, handleInstantSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const EmployeeCardSkeleton = () => (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const EmployeeCard = ({ employee }: { employee: Employee }) => {
    return (
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
          <Button variant="outline" size="sm" onClick={() => router.push(`/employees/${employee.id}`)}>
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
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
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
            <Button onClick={() => router.push('/employees/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search employees by name, ID, trade, or company..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchTerm && setShowSearchDropdown(true)}
                  className="pl-10"
                />

                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Search Results
                        </div>
                        {searchResults.slice(0, 5).map((employee, index) => (
                          <button
                            key={employee.id || employee.employee_id}
                            onClick={() => {
                              setSearchTerm(employee.name || '');
                              setShowSearchDropdown(false);
                              saveRecentSearch(employee.name || '');
                              router.push(`/employees/${employee.id}`);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 group"
                          >
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {highlightSearchTerm(employee.name || '', searchTerm)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {highlightSearchTerm(employee.employee_id || '', searchTerm)} • {highlightSearchTerm(employee.company_name || '', searchTerm)} • {highlightSearchTerm(employee.trade || '', searchTerm)}
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                        {searchResults.length > 5 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            +{searchResults.length - 5} more results...
                          </div>
                        )}
                      </div>
                    ) : searchTerm && recentSearches.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Recent Searches
                        </div>
                        {recentSearches.slice(0, 3).map((recentTerm, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchTerm(recentTerm);
                              setShowSearchDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{recentTerm}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No results found' : 'Start typing to search employees'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
            <div className="space-y-4">
              {/* Progressive loading progress bar */}
              {loadingProgress > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Loading employees... {loadingProgress}%
                  </p>
                </div>
              )}

              {/* Show skeleton cards while loading */}
              {[...Array(6)].map((_, i) => (
                <EmployeeCardSkeleton key={i} />
              ))}
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
                <Button onClick={() => router.push('/employees/new')}>
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
  );
} 