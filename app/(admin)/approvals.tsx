'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Building2, Eye, Download, AlertTriangle, Filter, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface ApprovalItem {
  id: string;
  type: 'document' | 'employee' | 'visa' | 'leave';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_by: string;
  submitted_at: string;
  company_name: string;
  employee_id?: string;
  employee_name?: string;
  document_type?: string;
  file_url?: string;
  file_size?: number;
  reviewer_notes?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// Mock approvals data
const mockApprovals: ApprovalItem[] = [
  {
    id: '1',
    type: 'document',
    title: 'Passport Copy Upload',
    description: 'Passport copy for employee John Doe (EMP001)',
    status: 'pending',
    priority: 'high',
    submitted_by: 'John Doe',
    submitted_at: '2024-01-15T10:30:00Z',
    company_name: 'CUBS Technical',
    employee_id: 'EMP001',
    employee_name: 'John Doe',
    document_type: 'Passport',
    file_url: '/documents/passport-emp001.pdf',
    file_size: 2048576
  },
  {
    id: '2',
    type: 'employee',
    title: 'New Employee Registration',
    description: 'Registration for new employee Sarah Smith',
    status: 'pending',
    priority: 'medium',
    submitted_by: 'HR Manager',
    submitted_at: '2024-01-15T09:15:00Z',
    company_name: 'GOLDEN CUBS',
    employee_id: 'EMP002',
    employee_name: 'Sarah Smith'
  },
  {
    id: '3',
    type: 'visa',
    title: 'Visa Extension Request',
    description: 'Visa extension request for employee Michael Johnson',
    status: 'approved',
    priority: 'urgent',
    submitted_by: 'Michael Johnson',
    submitted_at: '2024-01-14T16:00:00Z',
    company_name: 'CUBS Technical',
    employee_id: 'EMP003',
    employee_name: 'Michael Johnson',
    reviewer_notes: 'All documents verified. Visa extension approved.',
    reviewed_at: '2024-01-15T11:00:00Z',
    reviewed_by: 'Admin User'
  },
  {
    id: '4',
    type: 'document',
    title: 'Labour Card Copy',
    description: 'Labour card copy for employee Lisa Wang',
    status: 'rejected',
    priority: 'high',
    submitted_by: 'Lisa Wang',
    submitted_at: '2024-01-14T14:30:00Z',
    company_name: 'GOLDEN CUBS',
    employee_id: 'EMP004',
    employee_name: 'Lisa Wang',
    document_type: 'Labour Card',
    file_url: '/documents/labourcard-emp004.pdf',
    file_size: 1536000,
    reviewer_notes: 'Document is blurry and unreadable. Please upload a clear copy.',
    reviewed_at: '2024-01-15T10:00:00Z',
    reviewed_by: 'Admin User'
  },
  {
    id: '5',
    type: 'leave',
    title: 'Annual Leave Request',
    description: 'Annual leave request for 5 days from January 20-24, 2024',
    status: 'pending',
    priority: 'low',
    submitted_by: 'David Brown',
    submitted_at: '2024-01-15T08:00:00Z',
    company_name: 'CUBS Technical',
    employee_id: 'EMP005',
    employee_name: 'David Brown'
  }
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'document', label: 'Document' },
  { value: 'employee', label: 'Employee' },
  { value: 'visa', label: 'Visa' },
  { value: 'leave', label: 'Leave' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

export default function AdminApprovals() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals);
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalItem[]>(mockApprovals);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Filter approvals based on search and filters
  useEffect(() => {
    let filtered = approvals;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(approval =>
        approval.title.toLowerCase().includes(searchLower) ||
        approval.description.toLowerCase().includes(searchLower) ||
        approval.submitted_by.toLowerCase().includes(searchLower) ||
        approval.employee_name?.toLowerCase().includes(searchLower) ||
        approval.company_name.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(approval => approval.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(approval => approval.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(approval => approval.priority === selectedPriority);
    }

    setFilteredApprovals(filtered);
  }, [approvals, searchTerm, selectedType, selectedStatus, selectedPriority]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'employee':
        return <User className="w-5 h-5 text-green-500" />;
      case 'visa':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'leave':
        return <Clock className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`}>Pending</span>;
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>Rejected</span>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (priority) {
      case 'urgent':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>Urgent</span>;
      case 'high':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`}>High</span>;
      case 'medium':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`}>Medium</span>;
      case 'low':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>Low</span>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and manage pending approvals
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search approvals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={typeOptions}
            />
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
            />
            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              options={priorityOptions}
            />
          </div>
        </Card>

        {/* Approvals List */}
        <div className="space-y-4">
          {filteredApprovals.map((approval) => (
            <Card key={approval.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    {getTypeIcon(approval.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {approval.title}
                      </h3>
                      {getStatusBadge(approval.status)}
                      {getPriorityBadge(approval.priority)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {approval.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Submitted by: {approval.submitted_by}</span>
                      <span>Company: {approval.company_name}</span>
                      <span>Date: {new Date(approval.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredApprovals.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No approvals found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No approvals match your current filters.
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
