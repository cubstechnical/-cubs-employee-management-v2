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

// Validation schema for the employee form - adapted to our schema
const employeeSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email_id: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  mobile_number: z.string().optional(),
  trade: z.string().min(1, 'Trade/Position is required'),
  company_name: z.string().min(1, 'Company is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  status: z.string().min(1, 'Status is required'),
  visa_expiry_date: z.string().optional(),
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
          console.error('Error loading companies:', error);
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
        console.error('Error loading companies:', error);
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Generate unique employee ID
  const generateEmployeeId = (companyName: string): string => {
    const timestamp = Date.now().toString().slice(-4);
    const companyPrefix = getCompanyPrefix(companyName);
    return `${companyPrefix}${timestamp}`;
  };

  // Generate company prefix from company name
  const getCompanyPrefix = (companyName: string): string => {
    const prefixMap: { [key: string]: string } = {
      'AL HANA TOURS & TRAVELS': 'ALHT',
      'AL HANA TOURS': 'ALHT',
      'COMPANY_DOCS': 'COMP',
      'Company Documents': 'COMP',
      'AL ASHBAL AJMAN': 'AL ASHBAL',
      'ASHBAL AL KHALEEJ': 'AAK',
      'CUBS CONTRACTING': 'CCS',
      'CUBS CONTRACTING & SERVICES W L L': 'CCS',
      'FLUID ENGINEERING': 'FE',
      'GOLDEN CUBS': 'GCGC',
      'AL MACEN': 'ALM',
      'RUKIN AL ASHBAL': 'RAA',
      'CUBS': 'CUB'
    };

    // Check for exact match first
    if (prefixMap[companyName]) {
      return prefixMap[companyName];
    }
    
    // Generate prefix from company name
    const words = companyName
      .replace(/[&]/g, 'and')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .toUpperCase()
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (words.length >= 2) {
      // Take first 2 characters from first 2 words
      return words.slice(0, 2).map(word => word.substring(0, 2)).join('');
    } else if (words.length === 1) {
      // Take first 4 characters from single word
      return words[0].substring(0, 4);
    }

    // Fallback
    return 'EMP';
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    
    try {
      // Generate a unique employee ID
      const employeeId = generateEmployeeId(data.company_name);
      
      // Prepare the data for insertion - only use fields that exist in our schema
      const employeeData = {
        employee_id: employeeId,
        name: data.name,
        email_id: data.email_id || null,
        mobile_number: data.mobile_number || null,
        trade: data.trade,
        company_name: data.company_name,
        nationality: data.nationality,
        status: data.status,
        is_active: data.status === 'active',
        visa_expiry_date: data.visa_expiry_date || null,
        created_at: new Date().toISOString(),
      };

      console.log('💾 Creating employee:', employeeData);

      const { data: employee, error } = await supabase
        .from('employee_table')
        .insert(employeeData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating employee:', error);
        toast.error(`Failed to create employee: ${error.message}`);
        return;
      }

      // Log audit trail
      if (employee) {
        const userInfo = await AuditService.getCurrentUserInfo();
        await AuditService.logAudit({
          table_name: 'employee_table',
          record_id: employee.id as string,
          action: 'CREATE',
          old_values: undefined,
          new_values: employee,
          user_id: userInfo.id,
          user_email: userInfo.email,
        });
      }

      console.log('✅ Employee created successfully:', employee);
      toast.success('Employee added successfully!');
      router.push('/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
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
          {/* Form Fields in Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
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
                  Mobile Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter mobile number"
                  {...register('mobile_number')}
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
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
                  Visa Expiry Date
                </label>
                <Input
                  type="date"
                  {...register('visa_expiry_date')}
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
