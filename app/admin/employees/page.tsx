'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  Globe,
  CreditCard
} from 'lucide-react';
import { Employee } from '@/types';
import { formatDate, getVisaStatus } from '@/utils/date';
import { cn } from '@/utils/cn';
import Logo from '@/components/ui/Logo';

// Mock data - replace with real API calls
const mockEmployees: Employee[] = [
  {
    id: '1',
    employee_id: 'EMP001',
    name: 'John Doe',
    trade: 'Electrician',
    nationality: 'Indian',
    joining_date: '2023-01-15',
    passport_no: 'A12345678',
    passport_expiry: '2025-01-15',
    labourcard_no: 'LC123456',
    labourcard_expiry: '2024-01-15',
    visastamping_date: '2023-01-20',
    visa_expiry_date: '2024-01-20',
    eid: 'EID123456',
    leave_date: undefined,
    wcc: 'WCC123456',
    lulu_wps_card: 'LULU123456',
    basic_salary: '3500',
    company_name: 'CUBS Technical',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    passport_number: 'A12345678',
    visa_number: 'V123456',
    visa_type: 'Employment Visa',
    visa_status: 'active',
    dob: '1990-05-15',
    date_of_birth: '1990-05-15',
    join_date: '2023-01-15',
    mobile_number: '+971-50-123-4567',
    home_phone_number: '+971-4-123-4567',
    email_id: 'john.doe@cubstechnical.com',
    company_id: 'COMP001',
    status: 'Active',
    is_active: true
  },
  {
    id: '2',
    employee_id: 'EMP002',
    name: 'Jane Smith',
    trade: 'Plumber',
    nationality: 'Pakistani',
    joining_date: '2023-02-01',
    passport_no: 'B87654321',
    passport_expiry: '2026-02-01',
    labourcard_no: 'LC654321',
    labourcard_expiry: '2024-02-01',
    visastamping_date: '2023-02-05',
    visa_expiry_date: '2024-02-05',
    eid: 'EID654321',
    leave_date: undefined,
    wcc: 'WCC654321',
    lulu_wps_card: 'LULU654321',
    basic_salary: '4000',
    company_name: 'GOLDEN CUBS',
    created_at: '2023-02-01T00:00:00Z',
    updated_at: '2023-02-01T00:00:00Z',
    passport_number: 'B87654321',
    visa_number: 'V654321',
    visa_type: 'Employment Visa',
    visa_status: 'active',
    dob: '1988-08-20',
    date_of_birth: '1988-08-20',
    join_date: '2023-02-01',
    mobile_number: '+971-50-987-6543',
    home_phone_number: '+971-4-987-6543',
    email_id: 'jane.smith@goldencubs.com',
    company_id: 'COMP002',
    status: 'Active',
    is_active: true
  },
  {
    id: '3',
    employee_id: 'EMP003',
    name: 'Mike Johnson',
    trade: 'Carpenter',
    nationality: 'Bangladeshi',
    joining_date: '2023-02-10',
    passport_no: 'C11223344',
    passport_expiry: '2025-02-10',
    labourcard_no: 'LC112233',
    labourcard_expiry: '2024-02-10',
    visastamping_date: '2023-02-05',
    visa_expiry_date: '2024-03-15',
    eid: 'EID112233',
    leave_date: undefined,
    wcc: 'WCC112233',
    lulu_wps_card: 'LULU112233',
    basic_salary: '4500',
    company_name: 'CUBS Technical',
    created_at: '2023-02-10T00:00:00Z',
    updated_at: '2023-02-10T00:00:00Z',
    passport_number: 'C11223344',
    visa_number: 'V112233',
    visa_type: 'Employment Visa',
    visa_status: 'active',
    dob: '1992-12-10',
    date_of_birth: '1992-12-10',
    join_date: '2023-02-10',
    mobile_number: '+971-50-555-1234',
    home_phone_number: '+971-4-555-1234',
    email_id: 'mike.johnson@cubstechnical.com',
    company_id: 'COMP001',
    status: 'Active',
    is_active: true
  },
];

export default function EmployeesManagement() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVisaStatus, setSelectedVisaStatus] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = !selectedCompany || employee.company_name === selectedCompany;
    const matchesStatus = !selectedStatus || employee.status === selectedStatus;
    const matchesVisaStatus = !selectedVisaStatus || employee.visa_status === selectedVisaStatus;
    const matchesTrade = !selectedTrade || employee.trade === selectedTrade;
    const matchesNationality = !selectedNationality || employee.nationality === selectedNationality;

    return matchesSearch && matchesCompany && matchesStatus && matchesVisaStatus && matchesTrade && matchesNationality;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'inactive': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      case 'terminated': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getVisaStatusColor = (expiryDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (daysUntilExpiry <= 30) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
  };

  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {employee.name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {employee.employee_id}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">{employee.trade}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">{employee.company_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">{employee.nationality}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400 truncate">AED {employee.basic_salary}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={cn(
              "text-xs font-medium px-2 py-1 rounded-full transition-all duration-200",
              getStatusColor(employee.status)
            )}>
              {employee.status}
            </div>
            <div className={cn(
              "text-xs font-medium px-2 py-1 rounded-full mt-1 transition-all duration-200",
              getVisaStatusColor(employee.visa_expiry_date)
            )}>
              Visa: {getVisaStatus(employee.visa_expiry_date)}
            </div>
          </div>
          
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button size="sm" variant="ghost" className="p-2">
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2 text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage employee information and records
              </p>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/admin/employees/new'} className="hover:shadow-lg transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Companies</option>
              {Array.from(new Set(mockEmployees.map(emp => emp.company_name))).map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              {['Active', 'Inactive', 'Terminated'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={selectedVisaStatus}
              onChange={(e) => setSelectedVisaStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Visa Statuses</option>
              {['active', 'expiring_soon', 'expired'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Trades</option>
              {Array.from(new Set(mockEmployees.map(emp => emp.trade))).map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
            <select
              value={selectedNationality}
              onChange={(e) => setSelectedNationality(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Nationalities</option>
              {Array.from(new Set(mockEmployees.map(emp => emp.nationality))).map(nationality => (
                <option key={nationality} value={nationality}>{nationality}</option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </Card>

        {/* Employees List */}
        <div className="space-y-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <Card className="p-4">
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No employees found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No employees match your current filters.' : 'No employees have been added yet.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
} 