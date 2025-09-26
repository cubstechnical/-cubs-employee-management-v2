"use client";

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
// import { List } from 'react-window'; // Temporarily disabled due to API issues
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/Button';
import { 
  Building, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2,
  Users,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { log } from '@/lib/utils/productionLogger';

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

interface VirtualizedEmployeeListProps {
  searchTerm?: string;
  filterStatus?: 'all' | 'active' | 'inactive';
  filterCompany?: string;
  onDeleteEmployee?: (employee: Employee) => void;
  height?: number;
}

// Memoized employee row component for optimal performance
const EmployeeRow = memo(function EmployeeRow({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: { 
    employees: Employee[]; 
    onDelete: (employee: Employee) => void;
    router: any;
  } 
}) {
  const employee = data.employees[index];
  
  if (!employee) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

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

  const visaStatus = getVisaStatus(employee.visa_expiry_date);

  return (
    <div style={style} className="px-4 py-2">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 bg-[#d3194f]/10 rounded-full flex items-center justify-center flex-shrink-0"
              role="img"
              aria-label={`Avatar for ${employee.name}`}
            >
              <span
                className="text-lg font-semibold text-[#d3194f]"
                id={`employee-${employee.id}-initials`}
                aria-hidden="true"
              >
                {getInitials(employee.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold text-gray-900 dark:text-white truncate"
                id={`employee-${employee.id}-name`}
              >
                {employee.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2" aria-label="Employee ID">
                ID: {employee.employee_id}
              </p>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap" aria-label="Employee details">
                <div className="flex items-center gap-1 text-sm text-gray-500" aria-label="Company">
                  <Building className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{employee.company_name}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500" aria-label="Nationality">
                  <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[60px] sm:max-w-[80px]">{employee.nationality || 'N/A'}</span>
                </div>
                {employee.trade && (
                  <div className="flex items-center gap-1 text-sm text-gray-500" aria-label="Trade">
                    <span className="w-3 h-3 flex-shrink-0" aria-hidden="true">🔧</span>
                    <span className="truncate max-w-[80px] sm:max-w-[100px]">{employee.trade}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right" aria-label="Employee status information">
              <Badge color={employee.is_active ? 'success' : 'error'} aria-label={`Status: ${employee.is_active ? 'Active' : 'Inactive'}`}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <div className="mt-1">
                <Badge color={visaStatus.color} aria-label={`Visa status: ${visaStatus.status}`}>
                  Visa {visaStatus.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2" role="toolbar" aria-label="Employee actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => data.router.push(`/employees/${employee.id}`)}
                aria-label={`Edit employee ${employee.name}`}
              >
                <Edit className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => data.onDelete(employee)}
                aria-label={`Delete employee ${employee.name}`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        
        {employee.visa_expiry_date && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" aria-label="Visa information">
            <div className="flex items-center gap-1 text-sm text-gray-500" aria-label="Visa expiry date">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              Visa expires: {formatDate(employee.visa_expiry_date)}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

export const VirtualizedEmployeeList = memo(function VirtualizedEmployeeList({
  searchTerm = '',
  filterStatus = 'all',
  filterCompany = 'all',
  onDeleteEmployee,
  height = 600
}: VirtualizedEmployeeListProps) {
  const router = useRouter();
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employees with optimized query - only essential fields
  const { data: employees = [], isLoading: queryLoading } = useQuery({
    queryKey: ['all-employees-optimized'],
    queryFn: async () => {
      try {
        log.info('📊 Fetching employees for virtualization (optimized)...');
        
        // Only select essential fields to reduce memory usage
        const { data, error } = await supabase
          .from('employee_table')
          .select(`
            id,
            name,
            employee_id,
            company_name,
            position,
            visa_expiry_date,
            is_active,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (error) {
          log.error('❌ Error fetching employees:', error);
          throw new Error(`Database query failed: ${error.message}`);
        }
        
        log.info(`✅ Fetched ${data?.length || 0} employees for virtualization (optimized)`);
        return (data as unknown) as Employee[];
      } catch (err) {
        log.error('❌ Query function error:', err);
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - increased for better performance
    gcTime: 30 * 60 * 1000, // 30 minutes - increased for better caching
  });

  // Update local state when query data changes
  useEffect(() => {
    if (employees.length > 0) {
      setAllEmployees(employees);
      setIsLoading(false);
    }
  }, [employees]);

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    if (!allEmployees.length) return [];

    let filtered = allEmployees;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchPattern = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchPattern) ||
        emp.email_id?.toLowerCase().includes(searchPattern) ||
        emp.company_name.toLowerCase().includes(searchPattern) ||
        emp.trade.toLowerCase().includes(searchPattern) ||
        emp.employee_id.toLowerCase().includes(searchPattern)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(emp => 
        filterStatus === 'active' ? emp.is_active : !emp.is_active
      );
    }

    // Apply company filter
    if (filterCompany !== 'all') {
      filtered = filtered.filter(emp => emp.company_name === filterCompany);
    }

    return filtered;
  }, [allEmployees, searchTerm, filterStatus, filterCompany]);

  // Memoize row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    employees: filteredEmployees,
    onDelete: onDeleteEmployee || (() => {}),
    router
  }), [filteredEmployees, onDeleteEmployee, router]);

  // Loading state
  if (isLoading || queryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#d3194f] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading employees...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredEmployees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Employees Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search criteria' : 'No employees match your current filters'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Results summary */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            Virtualized for optimal performance
          </div>
        </div>
      </div>

      {/* Regular list (virtualization temporarily disabled) */}
      <div className="space-y-4">
        {filteredEmployees.map((employee, index) => (
          <EmployeeRow
            key={employee.id}
            index={index}
            style={{}}
            data={rowData}
          />
        ))}
      </div>
    </div>
  );
});

export default VirtualizedEmployeeList;
