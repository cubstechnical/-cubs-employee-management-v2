'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  File,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Document, Employee } from '@/types';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

// Mock data - replace with real API calls
const mockDocuments: Document[] = [
  {
    id: '1',
    employee_id: 'EMP001',
    name: 'John Doe - Passport',
    type: 'passport',
    file_url: 'https://example.com/passport.pdf',
    file_size: 2048576,
    mime_type: 'application/pdf',
    uploaded_by: 'john.doe@cubstechnical.com',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    employee_id: 'EMP001',
    name: 'John Doe - H1B Visa',
    type: 'visa',
    file_url: 'https://example.com/visa.pdf',
    file_size: 1536000,
    mime_type: 'application/pdf',
    uploaded_by: 'admin@cubstechnical.com',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    employee_id: 'EMP002',
    name: 'Jane Smith - Employment Contract',
    type: 'contract',
    file_url: 'https://example.com/contract.pdf',
    file_size: 512000,
    mime_type: 'application/pdf',
    uploaded_by: 'hr@cubstechnical.com',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
];

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
];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'passport', label: 'Passport' },
    { value: 'visa', label: 'Visa' },
    { value: 'contract', label: 'Employment Contract' },
    { value: 'id', label: 'ID Document' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' },
  ];

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map(emp => ({
      value: emp.employee_id,
      label: `${emp.name} (${emp.employee_id})`
    }))
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || doc.type === selectedType;
    const matchesEmployee = !selectedEmployee || doc.employee_id === selectedEmployee;
    
    return matchesSearch && matchesType && matchesEmployee;
  });

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      passport: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      visa: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      id: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      certificate: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getDocumentIcon = (type: string) => {
    const icons = {
      passport: <FileText className="w-4 h-4" />,
      visa: <FileText className="w-4 h-4" />,
      contract: <FileText className="w-4 h-4" />,
      id: <FileText className="w-4 h-4" />,
      certificate: <FileText className="w-4 h-4" />,
      other: <File className="w-4 h-4" />,
    };
    return icons[type as keyof typeof icons] || icons.other;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const DocumentCard = ({ document }: { document: Document }) => {
    const employee = employees.find(emp => emp.employee_id === document.employee_id);
    
    return (
      <Card key={document.id} className="hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              {getDocumentIcon(document.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {document.name}
                </h3>
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  getDocumentTypeColor(document.type)
                )}>
                  {document.type}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{employee ? employee.name : document.employee_id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Uploaded: {formatDate(document.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4" />
                  <span>{formatFileSize(document.file_size)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDocument(document)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and review employee documents
            </p>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {employeeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </Card>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <div className="text-center py-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No documents match your current filters.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
} 