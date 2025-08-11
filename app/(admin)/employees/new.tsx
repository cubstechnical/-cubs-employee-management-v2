'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Phone, Calendar, Building2, Briefcase } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { EmployeeService, CreateEmployeeData } from '@/lib/services/employees';
import toast from 'react-hot-toast';

// Validation schema for the employee form
const employeeSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  job_title: z.string().min(1, 'Job title is required'),
  phone_number: z.string().optional(),
  hire_date: z.date({
    message: 'Hire date is required',
  }),
  company_id: z.string().min(1, 'Company is required'),
  status: z.string().min(1, 'Status is required'),
  visa_expiry_date: z.date().nullable().optional(),
  date_of_birth: z.date().nullable().optional(),
  nationality: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

// Company options will be loaded dynamically from the database
// This ensures we only show active, correct company names
const companyOptions: { value: string; label: string }[] = [];

// Status options
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
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
        const { companies: companyList } = await EmployeeService.getFilterOptions();
        
        // Convert to select options format
        const companyOptions = companyList.map(company => ({
          value: company,
          label: company
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

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    
    try {
      // Generate a unique employee ID
      const employeeId = `EMP${Date.now()}`;
      
      // Prepare the data for the service - strictly matching CreateEmployeeData interface
      const employeeData: CreateEmployeeData = {
        employee_id: employeeId,
        name: data.full_name,
        dob: data.date_of_birth?.toISOString().split('T')[0] || '',
        trade: data.job_title,
        nationality: data.nationality || '',
        joining_date: data.hire_date.toISOString().split('T')[0],
        passport_no: '',
        passport_expiry: '',
        labourcard_no: '',
        labourcard_expiry: '',
        visastamping_date: '',
        visa_expiry_date: data.visa_expiry_date?.toISOString().split('T')[0] || '',
        eid: '',
        wcc: '',
        lulu_wps_card: '',
        basic_salary: '',
        company_name: data.company_id, // Using company_id as company_name
        visa_status: 'active',
        status: data.status,
        is_active: true,
      };

      const employee = await EmployeeService.createEmployee(employeeData);

      if (!employee) {
        toast.error('Failed to add employee. Please try again.');
        return;
      }

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
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/employees')} 
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Employee</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new employee record</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Form Fields in Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1 */}
              <div className="space-y-6">
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  error={errors.full_name?.message}
                  required
                  icon={<User className="w-4 h-4" />}
                  {...register('full_name')}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter email address"
                  error={errors.email?.message}
                  required
                  icon={<Mail className="w-4 h-4" />}
                  {...register('email')}
                />

                <Input
                  label="Job Title"
                  placeholder="Enter job title"
                  error={errors.job_title?.message}
                  required
                  icon={<Briefcase className="w-4 h-4" />}
                  {...register('job_title')}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter phone number"
                  error={errors.phone_number?.message}
                  icon={<Phone className="w-4 h-4" />}
                  {...register('phone_number')}
                />

                <DatePicker
                  label="Hire Date"
                  placeholder="Select hire date"
                  error={errors.hire_date?.message}
                  required
                  value={watchedValues.hire_date}
                  onChange={(date) => setValue('hire_date', date || new Date())}
                  maxDate={new Date()}
                />
              </div>

              {/* Column 2 */}
              <div className="space-y-6">
                <Select
                  label="Company"
                  placeholder={loadingCompanies ? "Loading companies..." : "Select company"}
                  error={errors.company_id?.message}
                  required
                  options={companies}
                  value={watchedValues.company_id}
                  onChange={(e) => setValue('company_id', e.target.value)}
                  disabled={loadingCompanies}
                />

                <Select
                  label="Status"
                  placeholder="Select status"
                  error={errors.status?.message}
                  required
                  options={statusOptions}
                  value={watchedValues.status}
                  onChange={(e) => setValue('status', e.target.value)}
                />

                <DatePicker
                  label="Visa Expiry Date"
                  placeholder="Select visa expiry date"
                  error={errors.visa_expiry_date?.message}
                  value={watchedValues.visa_expiry_date}
                  onChange={(date) => setValue('visa_expiry_date', date)}
                  minDate={new Date()}
                />
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
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Employee...' : 'Add Employee'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
} 