'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/badge/Badge';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Building,
  MapPin,
  Calendar,
  FileText,
  Phone,
  Mail,
  CreditCard,
  Shield,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuditService } from '@/lib/services/audit';
import { EmployeeService } from '@/lib/services/employees';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email_id?: string;
  mobile_number?: string;
  trade: string;
  company_name: string;
  nationality: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  visa_expiry_date?: string;
}

interface DeleteConfirmationState {
  isOpen: boolean;
  isDeleting: boolean;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    isDeleting: false
  });

  // Fetch employee data
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      console.log('🔍 Fetching employee details for ID:', employeeId);
      
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('❌ Error fetching employee:', error);
        throw new Error(`Failed to fetch employee: ${error.message}`);
      }
      
      console.log('✅ Employee fetched:', data?.name);
      return (data as unknown) as Employee;
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
      router.push('/employees');
    },
    onError: (error) => {
      console.error('❌ Delete mutation error:', error);
      toast.error(`Failed to delete employee: ${error.message}`);
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    },
  });

  // Handle delete employee
  const handleDeleteEmployee = () => {
    setDeleteConfirmation({ isOpen: true, isDeleting: false });
  };

  // Confirm delete
  const confirmDelete = () => {
    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));
    deleteEmployeeMutation.mutate(employeeId);
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, isDeleting: false });
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED'
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Employee Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The employee you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.push('/employees')}>
            Back to Employees
          </Button>
        </Card>
      </div>
    );
  }

  const visaStatus = getVisaStatus(employee.visa_expiry_date || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete information for {employee.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/employees/${employee.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Employee
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
            onClick={handleDeleteEmployee}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Employee Overview */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[#d3194f]/10 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-[#d3194f]">
              {getInitials(employee.name)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee.name}
              </h2>
              <Badge color={employee.is_active ? 'success' : 'error'}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge color={visaStatus.color}>
                Visa {visaStatus.status}
              </Badge>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {employee.trade} • {employee.company_name}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {employee.company_name}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {employee.nationality}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                ID: {employee.employee_id}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
            <p className="text-gray-900 dark:text-white">{employee.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</label>
            <p className="text-gray-900 dark:text-white">{employee.employee_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
            <p className="text-gray-900 dark:text-white">{employee.nationality}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Trade/Position</label>
            <p className="text-gray-900 dark:text-white">{employee.trade}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
            <p className="text-gray-900 dark:text-white">{employee.status}</p>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Number</label>
            <p className="text-gray-900 dark:text-white">{employee.mobile_number || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email ID</label>
            <p className="text-gray-900 dark:text-white">{employee.email_id || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Employment Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Employment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
            <p className="text-gray-900 dark:text-white">{employee.company_name}</p>
          </div>
        </div>
      </Card>


      {/* Visa Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Visa Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visa Status</label>
            <div className="flex items-center gap-2">
              <Badge color={visaStatus.color}>
                {visaStatus.status}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Visa Expiry Date</label>
            <p className="text-gray-900 dark:text-white">{formatDate(employee.visa_expiry_date || '')}</p>
          </div>
        </div>
        
        {visaStatus.status === 'expiring' && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Visa expires soon! Please renew before {formatDate(employee.visa_expiry_date || '')}
              </p>
            </div>
          </div>
        )}
        
        {visaStatus.status === 'expired' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200 font-medium">
                Visa has expired! Immediate action required.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
            <p className="text-gray-900 dark:text-white">{formatDate(employee.created_at)}</p>
          </div>
        </div>
      </Card>

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
                  {employee?.name}
                </span>
                ?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Employee ID: {employee?.employee_id}
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
