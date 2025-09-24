'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/badge/Badge';
import { 
  ArrowLeft,
  Save,
  X,
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

interface FormData {
  name: string;
  employee_id: string;
  email_id: string;
  mobile_number: string;
  trade: string;
  company_name: string;
  nationality: string;
  status: string;
  is_active: boolean;
  visa_expiry_date: string;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    employee_id: '',
    email_id: '',
    mobile_number: '',
    trade: '',
    company_name: '',
    nationality: '',
    status: '',
    is_active: true,
    visa_expiry_date: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch employee data
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      console.log('🔍 Fetching employee for edit, ID:', employeeId);
      
      const { data, error } = await supabase
        .from('employee_table')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('❌ Error fetching employee:', error);
        throw new Error(`Failed to fetch employee: ${error.message}`);
      }
      
      console.log('✅ Employee fetched for edit:', data?.name);
      return (data as unknown) as Employee;
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Populate form when employee data is loaded
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        employee_id: employee.employee_id || '',
        email_id: employee.email_id || '',
        mobile_number: employee.mobile_number || '',
        trade: employee.trade || '',
        company_name: employee.company_name || '',
        nationality: employee.nationality || '',
        status: employee.status || '',
        is_active: employee.is_active ?? true,
        visa_expiry_date: employee.visa_expiry_date || '',
      });
    }
  }, [employee]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: FormData) => {
      console.log('💾 Updating employee:', employeeId, updatedData);
      
      // Get current employee data for audit trail
      const { data: oldData } = await supabase
        .from('employee_table')
        .select('*')
        .eq('id', employeeId)
        .single();

      const { data, error } = await supabase
        .from('employee_table')
        .update({
          name: updatedData.name,
          employee_id: updatedData.employee_id,
          email_id: updatedData.email_id || null,
          mobile_number: updatedData.mobile_number || null,
          trade: updatedData.trade,
          company_name: updatedData.company_name,
          nationality: updatedData.nationality,
          status: updatedData.status,
          is_active: updatedData.is_active,
          visa_expiry_date: updatedData.visa_expiry_date || null,
        })
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating employee:', error);
        throw new Error(`Failed to update employee: ${error.message}`);
      }
      
      // Log audit trail
      if (oldData && data) {
        const userInfo = await AuditService.getCurrentUserInfo();
        await AuditService.logAudit({
          table_name: 'employee_table',
          record_id: employeeId,
          action: 'UPDATE',
          old_values: oldData,
          new_values: data,
          user_id: userInfo.id,
          user_email: userInfo.email,
        });
      }
      
      console.log('✅ Employee updated successfully:', data?.name);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch employee data
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      toast.success('Employee updated successfully!');
      setIsDirty(false);
      
      // Navigate back to employee details
      router.push(`/employees/${employeeId}`);
    },
    onError: (error) => {
      console.error('❌ Update mutation error:', error);
      toast.error(`Failed to update employee: ${error.message}`);
    },
  });

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required';
    }

    if (!formData.trade.trim()) {
      newErrors.trade = 'Trade/Position is required';
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required';
    }

    // Email validation
    if (formData.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_id)) {
      newErrors.email_id = 'Please enter a valid email address';
    }

    // Mobile number validation (basic)
    if (formData.mobile_number && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    updateMutation.mutate(formData);
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back();
      }
    } else {
      router.back();
    }
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
            The employee you&apos;re trying to edit doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.push('/employees')}>
            Back to Employees
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Employee
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update information for {employee.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={(e) => handleSubmit(e as any)}
            disabled={updateMutation.isPending || !isDirty}
            className="flex items-center gap-2 bg-[#d3194f] hover:bg-[#b0173a] text-white"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee ID *
              </label>
              <Input
                value={formData.employee_id}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                placeholder="Enter employee ID"
                className={errors.employee_id ? 'border-red-500' : ''}
              />
              {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nationality *
              </label>
              <Input
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="Enter nationality"
                className={errors.nationality ? 'border-red-500' : ''}
              />
              {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trade/Position *
              </label>
              <Input
                value={formData.trade}
                onChange={(e) => handleInputChange('trade', e.target.value)}
                placeholder="Enter trade/position"
                className={errors.trade ? 'border-red-500' : ''}
              />
              {errors.trade && <p className="text-red-500 text-sm mt-1">{errors.trade}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-[#d3194f] focus:ring-[#d3194f]"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Employee
                </span>
              </label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <Input
                value={formData.mobile_number}
                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                placeholder="Enter mobile number"
                className={errors.mobile_number ? 'border-red-500' : ''}
              />
              {errors.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email ID
              </label>
              <Input
                type="email"
                value={formData.email_id}
                onChange={(e) => handleInputChange('email_id', e.target.value)}
                placeholder="Enter email address"
                className={errors.email_id ? 'border-red-500' : ''}
              />
              {errors.email_id && <p className="text-red-500 text-sm mt-1">{errors.email_id}</p>}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company *
              </label>
              <Input
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter company name"
                className={errors.company_name ? 'border-red-500' : ''}
              />
              {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visa Expiry Date
              </label>
              <Input
                type="date"
                value={formData.visa_expiry_date}
                onChange={(e) => handleInputChange('visa_expiry_date', e.target.value)}
              />
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
