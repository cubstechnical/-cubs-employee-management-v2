'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmployeeService, Employee } from '@/lib/services/employees';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Edit, Mail, Phone, Calendar, Building2, User, Briefcase, FileText, Download } from 'lucide-react';
import { log } from '@/lib/utils/productionLogger';

export default function MobileEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        // Get employee ID from URL search params
        const employeeId = searchParams.get('id');
        
        if (!employeeId) {
          setError('Employee ID not found');
          setLoading(false);
          return;
        }

        log.info('Loading employee for mobile:', { employeeId });
        
        const result = await EmployeeService.getEmployeeById(employeeId);
        if (result.error) {
          setError(result.error);
        } else {
          setEmployee(result.employee);
        }
      } catch (err) {
        log.error('Failed to load employee:', err);
        setError('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d3194f] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Employee not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Employee Details
          </h1>
        </div>

        {/* Employee Card */}
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-[#d3194f] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {employee.name?.[0] || 'E'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{employee.trade}</p>
              <p className="text-gray-500 dark:text-gray-500">{employee.company_name}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{employee.email_id || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{employee.mobile_number || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {employee.visa_expiry_date ? new Date(employee.visa_expiry_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{employee.company_name}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
