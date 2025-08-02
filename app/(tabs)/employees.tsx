'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EmployeeService, PaginationParams, EmployeeFilters, FilterOptions } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import { formatDate } from '@/utils/date';
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
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Employees() {
  return (
    <ProtectedRoute>
      <EmployeesContent />
    </ProtectedRoute>
  );
}

function EmployeesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const params: PaginationParams = {
        page: currentPage,
        pageSize: 10
      };

      const result = await EmployeeService.getEmployees(params, {
        ...filters,
        search: searchTerm
      });
      
      setEmployees(result.employees);
      setTotalPages(result.totalPages);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const options = await EmployeeService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await EmployeeService.deleteEmployee(employeeId);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-gray-500">N/A</span>;
    
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Inactive': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Suspended': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };

    const className = statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {status}
      </span>
    );
  };

  const getVisaStatusBadge = (visaStatus: string | null) => {
    if (!visaStatus) return null;
    
    const statusConfig = {
      'Valid': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Expired': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Expiring Soon': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };

    const className = statusConfig[visaStatus as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {visaStatus}
      </span>
    );
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === currentPage
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employees</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your employee database
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="temporary"
                  checked={filters.is_temporary}
                  onChange={(e) => handleFilterChange('is_temporary', e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="temporary" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temporary Workers
                </label>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <select
                value={filters.company_name}
                onChange={(e) => handleFilterChange('company_name', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Companies</option>
                {filterOptions.companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>

              <select
                value={filters.trade}
                onChange={(e) => handleFilterChange('trade', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Trades</option>
                {filterOptions.trades.map(trade => (
                  <option key={trade} value={trade}>{trade}</option>
                ))}
              </select>

              <select
                value={filters.nationality}
                onChange={(e) => handleFilterChange('nationality', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Nationalities</option>
                {filterOptions.nationalities.map(nationality => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Status</option>
                {filterOptions.statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={filters.visa_status}
                onChange={(e) => handleFilterChange('visa_status', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Visa Status</option>
                {filterOptions.visaStatuses.map(visaStatus => (
                  <option key={visaStatus} value={visaStatus}>{visaStatus}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Employees Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Visa Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p>Loading employees...</p>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {employees.map((employee) => (
                      <tr key={employee.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.employee_id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {employee.nationality || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.trade || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.company_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {employee.visa_expiry_date ? formatDate(employee.visa_expiry_date) : 'N/A'}
                          </div>
                          {employee.visa_status && (
                            <div className="mt-1">
                              {getVisaStatusBadge(employee.visa_status)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(employee.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEmployee(employee.employee_id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              {renderPagination()}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
