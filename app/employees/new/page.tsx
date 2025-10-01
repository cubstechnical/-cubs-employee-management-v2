'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Phone, Calendar, Building2, Briefcase } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { AuditService } from '@/lib/services/audit';
import { EmployeeService } from '@/lib/services/employees';
import { log } from '@/lib/utils/productionLogger';
import { generateNextEmployeeId, previewNextEmployeeId, getCompanyPrefix } from '@/lib/utils/employeeIdGenerator';

// Comprehensive validation schema for the employee form
const employeeSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Full name is required'),
  email_id: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  mobile_number: z.string().optional(),
  phone: z.string().optional(),
  home_phone_number: z.string().optional(),
  address: z.string().optional(),
  
  // Employment Details
  trade: z.string().min(1, 'Trade/Position is required'),
  company_name: z.string().min(1, 'Company is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  status: z.string().min(1, 'Status is required'),
  joining_date: z.string().optional(),
  basic_salary: z.string().optional(),
  salary: z.number().optional(),
  
  // Personal Information
  dob: z.string().optional(),
  date_of_birth: z.string().optional(),
  
  // Passport Information
  passport_no: z.string().optional(),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
  
  // Visa Information
  visa_expiry_date: z.string().optional(),
  visa_number: z.string().optional(),
  visa_type: z.string().optional(),
  visa_status: z.string().optional(),
  visastamping_date: z.string().optional(),
  
  // Work Permits
  labourcard_no: z.string().optional(),
  labourcard_expiry: z.string().optional(),
  eid: z.string().optional(),
  wcc: z.string().optional(),
  lulu_wps_card: z.string().optional(),
  
  // Additional Information
  leave_date: z.string().optional(),
  is_temporary: z.boolean().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

// Status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on-leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
];

export default function NewEmployee() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>('');
  const [generatingId, setGeneratingId] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: 'active',
    },
  });

  // Watch form values for conditional rendering
  const watchedValues = watch();
  const selectedCompany = watch('company_name');

  // Load companies from database
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('employee_table')
          .select('company_name')
          .not('company_name', 'is', null)
          .order('company_name');

        if (error) {
          log.error('Error loading companies:', error);
          setLoadingCompanies(false);
          return;
        }

        // Get unique company names
        const uniqueCompanies = [...new Set(data.map((item: any) => item.company_name))];
        
        // Convert to select options format
        const companyOptions = uniqueCompanies.map((company: any) => ({
          value: company as string,
          label: company as string
        }));
        
        setCompanies(companyOptions);
        setLoadingCompanies(false);
      } catch (error) {
        log.error('Error loading companies:', error);
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Preview employee ID when company is selected
  useEffect(() => {
    const loadPreviewId = async () => {
      if (!selectedCompany) {
        setPreviewEmployeeId('');
        return;
      }

      setGeneratingId(true);
      try {
        const preview = await previewNextEmployeeId(selectedCompany);
        if (preview) {
          setPreviewEmployeeId(preview);
          log.info(`Preview employee ID: ${preview} for company: ${selectedCompany}`);
        } else {
          setPreviewEmployeeId('');
          log.warn(`No preview available for company: ${selectedCompany}`);
        }
      } catch (error) {
        log.error('Error generating preview ID:', error);
        setPreviewEmployeeId('');
      } finally {
        setGeneratingId(false);
      }
    };

    loadPreviewId();
  }, [selectedCompany]);

  // Generate unique employee ID using the new employeeIdGenerator utility
  const generateEmployeeId = async (companyName: string, employeeName?: string): Promise<string> => {
    try {
      const employeeId = await generateNextEmployeeId(companyName);
      if (employeeId) {
        log.info(`✅ Generated employee ID: ${employeeId} for company: ${companyName}`);
        return employeeId;
      }
      
      // Fallback to old method if new generator fails
      log.warn('Falling back to old employee ID generation method');
      if (employeeName) {
        return await EmployeeService.generateEmployeeId(companyName, employeeName);
      }
      // If no employee name provided, use timestamp
      const timestamp = Date.now().toString().slice(-4);
      const companyPrefix = getCompanyPrefix(companyName) || EmployeeService.generateCompanyPrefix(companyName);
      return `${companyPrefix}${timestamp}`;
    } catch (error) {
      log.error('Error generating employee ID:', error);
      // Ultimate fallback to timestamp-based ID
      const timestamp = Date.now().toString().slice(-4);
      const companyPrefix = getCompanyPrefix(companyName) || EmployeeService.generateCompanyPrefix(companyName);
      return `${companyPrefix}${timestamp}`;
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    
    try {
      // Generate a unique employee ID based on company
      const employeeId = await generateEmployeeId(data.company_name, data.name);
      
      if (!employeeId) {
        toast.error('Failed to generate employee ID. Please try again.');
        return;
      }
      
      log.info(`🆔 Using employee ID: ${employeeId} for new employee: ${data.name}`);
      
      // Prepare the data for insertion with all available fields
      const employeeData = {
        employee_id: employeeId,
        name: data.name,
        email_id: data.email_id || null,
        mobile_number: data.mobile_number || null,
        phone: data.phone || null,
        home_phone_number: data.home_phone_number || null,
        address: data.address || null,
        trade: data.trade,
        company_name: data.company_name,
        nationality: data.nationality,
        status: data.status,
        is_active: data.status === 'active',
        joining_date: data.joining_date || null,
        basic_salary: data.basic_salary || null,
        salary: data.salary || null,
        dob: data.dob || data.date_of_birth || null,
        passport_no: data.passport_no || data.passport_number || null,
        passport_expiry: data.passport_expiry || null,
        visa_expiry_date: data.visa_expiry_date || null,
        visa_number: data.visa_number || null,
        visa_type: data.visa_type || null,
        visa_status: data.visa_status || null,
        visastamping_date: data.visastamping_date || null,
        labourcard_no: data.labourcard_no || null,
        labourcard_expiry: data.labourcard_expiry || null,
        eid: data.eid || null,
        wcc: data.wcc || null,
        lulu_wps_card: data.lulu_wps_card || null,
        leave_date: data.leave_date || null,
        is_temporary: data.is_temporary || false,
        created_at: new Date().toISOString(),
      };

      log.info('💾 Creating employee:', employeeData);

      const { data: employee, error } = await supabase
        .from('employee_table')
        .insert(employeeData as any)
        .select()
        .single();

      if (error) {
        log.error('❌ Error creating employee:', error);
        toast.error(`Failed to create employee: ${error.message}`);
        return;
      }

      // Log audit trail
      if (employee) {
        const userInfo = await AuditService.getCurrentUserInfo();
        await AuditService.logAudit({
          table_name: 'employee_table',
          record_id: (employee as any).id as string,
          action: 'CREATE',
          old_values: undefined,
          new_values: employee as any,
          user_id: userInfo.id,
          user_email: userInfo.email,
        });
      }

      log.info('✅ Employee created successfully:', employee);
      toast.success('Employee added successfully!');
      router.push('/employees');
    } catch (error) {
      log.error('Error creating employee:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/employees')} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Employee</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new employee record</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <Input
                  placeholder="Enter full name"
                  className={errors.name ? 'border-red-500' : ''}
                  {...register('name')}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email ID
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  className={errors.email_id ? 'border-red-500' : ''}
                  {...register('email_id')}
                />
                {errors.email_id && <p className="text-red-500 text-sm mt-1">{errors.email_id.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  {...register('mobile_number')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  {...register('phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Home Phone
                </label>
                <Input
                  type="tel"
                  placeholder="Enter home phone number"
                  {...register('home_phone_number')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  {...register('dob')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  {...register('address')}
                  placeholder="Enter address"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Employment Details Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trade/Position *
                </label>
                <Input
                  placeholder="Enter trade/position"
                  className={errors.trade ? 'border-red-500' : ''}
                  {...register('trade')}
                />
                {errors.trade && <p className="text-red-500 text-sm mt-1">{errors.trade.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company *
                </label>
                <select
                  {...register('company_name')}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent ${errors.company_name ? 'border-red-500' : ''}`}
                  disabled={loadingCompanies}
                >
                  <option value="">
                    {loadingCompanies ? "Loading companies..." : "Select company"}
                  </option>
                  {companies.map((company) => (
                    <option key={company.value} value={company.value}>
                      {company.label}
                    </option>
                  ))}
                </select>
                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>}
                
                {/* Employee ID Preview */}
                {selectedCompany && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
                          Employee ID will be:
                        </p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {generatingId ? (
                            <span className="flex items-center gap-2">
                              <span className="animate-spin">⏳</span>
                              Generating...
                            </span>
                          ) : previewEmployeeId ? (
                            previewEmployeeId
                          ) : (
                            'Auto-generated on save'
                          )}
                        </p>
                      </div>
                      <div className="text-2xl">
                        {previewEmployeeId ? '🆔' : '⚡'}
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      {previewEmployeeId 
                        ? 'This ID will be automatically assigned when you save the employee.'
                        : 'ID will be generated based on company selection.'
                      }
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nationality *
                </label>
                <Input
                  placeholder="Enter nationality"
                  className={errors.nationality ? 'border-red-500' : ''}
                  {...register('nationality')}
                />
                {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  {...register('status')}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d3194f] focus:border-transparent ${errors.status ? 'border-red-500' : ''}`}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Joining Date
                </label>
                <Input
                  type="date"
                  {...register('joining_date')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Basic Salary
                </label>
                <Input
                  type="text"
                  placeholder="Enter basic salary"
                  {...register('basic_salary')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Salary (Numeric)
                </label>
                <Input
                  type="number"
                  placeholder="Enter salary amount"
                  {...register('salary', { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_temporary')}
                  className="h-4 w-4 text-[#d3194f] focus:ring-[#d3194f] border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Temporary Employee
                </label>
              </div>
            </div>
          </div>

          {/* Passport Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Passport Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passport Number
                </label>
                <Input
                  placeholder="Enter passport number"
                  {...register('passport_no')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passport Expiry Date
                </label>
                <Input
                  type="date"
                  {...register('passport_expiry')}
                />
              </div>
            </div>
          </div>

          {/* Visa Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visa Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Number
                </label>
                <Input
                  placeholder="Enter visa number"
                  {...register('visa_number')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Type
                </label>
                <Input
                  placeholder="Enter visa type"
                  {...register('visa_type')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Status
                </label>
                <Input
                  placeholder="Enter visa status"
                  {...register('visa_status')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Expiry Date
                </label>
                <Input
                  type="date"
                  {...register('visa_expiry_date')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visa Stamping Date
                </label>
                <Input
                  type="date"
                  {...register('visastamping_date')}
                />
              </div>
            </div>
          </div>

          {/* Work Permits Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work Permits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Labour Card Number
                </label>
                <Input
                  placeholder="Enter labour card number"
                  {...register('labourcard_no')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Labour Card Expiry
                </label>
                <Input
                  type="date"
                  {...register('labourcard_expiry')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  EID Number
                </label>
                <Input
                  placeholder="Enter EID number"
                  {...register('eid')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WCC Number
                </label>
                <Input
                  placeholder="Enter WCC number"
                  {...register('wcc')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lulu WPS Card
                </label>
                <Input
                  placeholder="Enter Lulu WPS card number"
                  {...register('lulu_wps_card')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leave Date
                </label>
                <Input
                  type="date"
                  {...register('leave_date')}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/employees')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#d3194f] hover:bg-[#b0173a] text-white"
            >
              {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
