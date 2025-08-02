'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building2,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { EmployeeService } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import { formatDate } from '@/utils/date';
import toast from 'react-hot-toast';

export default function EmployeeDetail() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const employeeId = params.id as string;

  useEffect(() => {
    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const emp = await EmployeeService.getEmployeeById(employeeId);
      
      if (!emp) {
        toast.error('Failed to load employee details');
        router.push('/employees');
        return;
      }

      setEmployee(emp);
    } catch (error) {
      toast.error('Failed to load employee details');
      router.push('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;

    if (!confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const success = await EmployeeService.deleteEmployee(employeeId);
      
      if (success) {
        toast.success('Employee deleted successfully');
        router.push('/employees');
      } else {
        toast.error('Failed to delete employee');
      }
    } catch (error) {
      toast.error('Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getVisaStatusBadge = (visaStatus: string | null, visaExpiry: string | null) => {
    if (!visaStatus) return null;

    const today = new Date();
    const expiryDate = visaExpiry ? new Date(visaExpiry) : null;
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

    switch (visaStatus.toLowerCase()) {
      case 'active':
        if (daysUntilExpiry && daysUntilExpiry <= 30) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Expiring Soon
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            {visaStatus}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading employee details...</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we fetch the employee information.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Employee not found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The employee you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/employees')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Employees
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{employee.name || 'Unknown Employee'}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Employee ID: {employee.employee_id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/employees/${employeeId}/edit`)}
              icon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/employees/${employeeId}/documents`)}
              icon={<FileText className="w-4 h-4" />}
            >
              Documents
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <p className="text-gray-900 dark:text-white">{employee.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee ID</label>
                  <p className="text-gray-900 dark:text-white">{employee.employee_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.dob ? formatDate(employee.dob) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nationality</label>
                  <p className="text-gray-900 dark:text-white">{employee.nationality || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trade</label>
                  <p className="text-gray-900 dark:text-white">{employee.trade || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
                  <p className="text-gray-900 dark:text-white">{employee.company_name || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <p className="text-gray-900 dark:text-white">{employee.email_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mobile Number</label>
                  <p className="text-gray-900 dark:text-white">{employee.mobile_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Home Phone</label>
                  <p className="text-gray-900 dark:text-white">{employee.home_phone_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">EID</label>
                  <p className="text-gray-900 dark:text-white">{employee.eid || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Employment Details */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Employment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Joining Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.joining_date ? formatDate(employee.joining_date) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Leave Date</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.leave_date ? formatDate(employee.leave_date) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Basic Salary</label>
                  <p className="text-gray-900 dark:text-white">{employee.basic_salary || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(employee.status)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Cards */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employee Status</label>
                  {getStatusBadge(employee.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visa Status</label>
                  {getVisaStatusBadge(employee.visa_status, employee.visa_expiry_date)}
                </div>
              </div>
            </Card>

            {/* Document Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passport Number</label>
                  <p className="text-gray-900 dark:text-white">{employee.passport_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passport Expiry</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.passport_expiry ? formatDate(employee.passport_expiry) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labour Card</label>
                  <p className="text-gray-900 dark:text-white">{employee.labourcard_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labour Card Expiry</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.labourcard_expiry ? formatDate(employee.labourcard_expiry) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visa Number</label>
                  <p className="text-gray-900 dark:text-white">{employee.visa_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visa Expiry</label>
                  <p className="text-gray-900 dark:text-white">
                    {employee.visa_expiry_date ? formatDate(employee.visa_expiry_date) : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/employees/${employeeId}/edit`)}
                  icon={<Edit className="w-4 h-4" />}
                >
                  Edit Employee
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/employees/${employeeId}/documents`)}
                  icon={<FileText className="w-4 h-4" />}
                >
                  View Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<Download className="w-4 h-4" />}
                >
                  Export Data
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 

