'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Building2, User, Briefcase, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EmployeeService, Employee } from '@/lib/services/employees';
import { DocumentService } from '@/lib/services/documents';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { log } from '@/lib/utils/productionLogger';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email_id: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  mobile_number: z.string().optional(),
  trade: z.string().min(1, 'Trade/Position is required'),
  company_name: z.string().min(1, 'Company is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  visa_expiry_date: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeDocuments {
  id: string;
  file_name: string;
  file_path: string;
  file_url?: string;
  document_type?: string;
  created_at: string;
  file_size?: number;
  mime_type?: string;
}

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  const fetchEmployeeDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const employeeData = await EmployeeService.getEmployeeById(employeeId);

      if (employeeData && employeeData.employee) {
        setEmployee(employeeData.employee);
        // Populate form with existing data
        reset({
          name: employeeData.employee.name || '',
          email_id: employeeData.employee.email_id || '',
          mobile_number: employeeData.employee.mobile_number || '',
          trade: employeeData.employee.trade || '',
          company_name: employeeData.employee.company_name || '',
          nationality: employeeData.employee.nationality || '',
          visa_expiry_date: employeeData.employee.visa_expiry_date || '',
        });
      } else if (employeeData && typeof employeeData === 'object' && 'id' in employeeData) {
        // Handle case where employeeData is the employee directly
        setEmployee(employeeData as unknown as Employee);
        const employee = employeeData as unknown as Employee;
        reset({
          name: employee.name || '',
          email_id: employee.email_id || '',
          mobile_number: employee.mobile_number || '',
          trade: employee.trade || '',
          company_name: employee.company_name || '',
          nationality: employee.nationality || '',
          visa_expiry_date: employee.visa_expiry_date || '',
        });
      } else {
        log.info('⚠️ Employee not found for ID:', employeeId);
        setError('Employee not found');
      }
    } catch (error) {
      log.info('⚠️ Error fetching employee details:', error);
      // Don't show error immediately - let user try again
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, reset]);

  const fetchEmployeeDocuments = useCallback(async () => {
    // Don't fetch documents until we have employee data
    if (!employee) return;

    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employee.employee_id) // Use the actual employee_id, not the UUID
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error fetching documents:', error);
        return;
      }

      // Cast the data to the correct type safely
      setDocuments((data as unknown as EmployeeDocuments[]) || []);
    } catch (error) {
      log.info('⚠️ Error fetching documents:', error);
    }
  }, [employee]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);

  // Fetch documents when employee data is available
  useEffect(() => {
    if (employee) {
      fetchEmployeeDocuments();
    }
  }, [employee, fetchEmployeeDocuments]);

  const onSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;

    try {
      // Create the correct UpdateEmployeeData structure
      const updateData = {
        employee_id: employee.employee_id, // Use the actual employee_id, not the UUID
        name: data.name,
        email_id: data.email_id,
        mobile_number: data.mobile_number,
        trade: data.trade,
        company_name: data.company_name,
        nationality: data.nationality,
        visa_expiry_date: data.visa_expiry_date,
      };

      const updatedEmployee = await EmployeeService.updateEmployee(updateData);

      if (updatedEmployee) {
        setEmployee(updatedEmployee);
        setEditing(false);
        log.info('✅ Employee updated successfully');
      } else {
        log.info('⚠️ Failed to update employee');
      }
    } catch (error) {
      log.info('⚠️ Error updating employee:', error);
    }
  };

  const handleDocumentDownload = async (document: EmployeeDocuments) => {
    if (!document.file_path) {
      toast.error('Document not available');
      return;
    }

    try {
      // Get a fresh signed URL from the DocumentService
      const { data: signedUrl, error } = await DocumentService.getDocumentPresignedUrl(document.id);

      if (error || !signedUrl) {
        log.error('Error getting signed URL:', error);
        toast.error('Failed to open document');
        return;
      }

      // Open document in new tab
      window.open(signedUrl, '_blank');
    } catch (error) {
      log.error('Error opening document:', error);
      toast.error('Failed to open document');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVisaStatus = () => {
    if (!employee?.visa_expiry_date) return { status: 'No visa', color: 'text-gray-500' };

    const expiryDate = new Date(employee.visa_expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: 'Expired', color: 'text-red-600' };
    } else if (daysLeft <= 30) {
      return { status: `Expires in ${daysLeft} days`, color: 'text-orange-600' };
    } else if (daysLeft <= 90) {
      return { status: `Expires in ${daysLeft} days`, color: 'text-yellow-600' };
    } else {
      return { status: 'Valid', color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Employee Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The employee you&apos;re looking for could not be found.
          </p>
          <Button onClick={() => router.push('/employees')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>
        </Card>
      </div>
    );
  }

  const visaInfo = getVisaStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/employees')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Employee Details
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage employee information
                </p>
              </div>
            </div>
            <Button onClick={() => setEditing(!editing)}>
              <Edit className="w-4 h-4 mr-2" />
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Basic Information
              </h3>

              {editing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                    <Input
                      label="Email"
                      type="email"
                      {...register('email_id')}
                      error={errors.email_id?.message}
                    />
                    <Input
                      label="Mobile Number"
                      {...register('mobile_number')}
                      error={errors.mobile_number?.message}
                    />
                    <Input
                      label="Trade/Position"
                      {...register('trade')}
                      error={errors.trade?.message}
                    />
                    <Input
                      label="Company"
                      {...register('company_name')}
                      error={errors.company_name?.message}
                    />
                    <Input
                      label="Nationality"
                      {...register('nationality')}
                      error={errors.nationality?.message}
                    />
                  </div>
                  <Input
                    label="Visa Expiry Date"
                    type="date"
                    {...register('visa_expiry_date')}
                    error={errors.visa_expiry_date?.message}
                  />
                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.email_id || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.mobile_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.trade || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.company_name || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Visa Status</p>
                      <p className={`font-medium ${visaInfo.color}`}>{visaInfo.status}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Documents */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Documents ({documents.length})
              </h3>

              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No documents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.document_type && `${doc.document_type} • `}{formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDocumentDownload(doc)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Quick Stats
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {employee.status || 'Active'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nationality</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {employee.nationality || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visa Expiry</p>
                  <p className={`font-medium ${visaInfo.color}`}>
                    {formatDate(employee.visa_expiry_date || '')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(employee.created_at || '')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(employee.updated_at || '')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
