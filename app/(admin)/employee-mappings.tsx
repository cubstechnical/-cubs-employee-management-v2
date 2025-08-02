'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, UserPlus, UserMinus, Edit, Trash2, Search, Filter, ArrowRight, UserCheck, UserX } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface EmployeeMapping {
  id: string;
  employee_id: string;
  employee_name: string;
  company_name: string;
  supervisor_id?: string;
  supervisor_name?: string;
  department?: string;
  role: string;
  team?: string;
  project?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'transferred';
  created_at: string;
  updated_at: string;
}

// Mock employee mappings data
const mockMappings: EmployeeMapping[] = [
  {
    id: '1',
    employee_id: 'EMP001',
    employee_name: 'John Smith',
    company_name: 'CUBS Technical',
    supervisor_id: 'EMP010',
    supervisor_name: 'Sarah Manager',
    department: 'Engineering',
    role: 'Software Engineer',
    team: 'Frontend Team',
    project: 'CUBS Portal',
    start_date: '2023-01-15',
    status: 'active',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z'
  },
  {
    id: '2',
    employee_id: 'EMP002',
    employee_name: 'Emily Davis',
    company_name: 'CUBS Technical',
    supervisor_id: 'EMP011',
    supervisor_name: 'Mike Lead',
    department: 'HR',
    role: 'HR Specialist',
    team: 'HR Team',
    project: 'Employee Management',
    start_date: '2023-02-01',
    status: 'active',
    created_at: '2023-02-01T00:00:00Z',
    updated_at: '2023-02-01T00:00:00Z'
  },
  {
    id: '3',
    employee_id: 'EMP003',
    employee_name: 'Michael Johnson',
    company_name: 'CUBS Technical',
    role: 'Senior Developer',
    team: 'Backend Team',
    project: 'CUBS Portal',
    start_date: '2023-01-10',
    status: 'active',
    created_at: '2023-01-10T00:00:00Z',
    updated_at: '2023-01-10T00:00:00Z'
  },
  {
    id: '4',
    employee_id: 'EMP004',
    employee_name: 'Lisa Wang',
    company_name: 'GOLDEN CUBS',
    supervisor_id: 'EMP012',
    supervisor_name: 'David Lead',
    department: 'Finance',
    role: 'Accountant',
    team: 'Finance Team',
    project: 'Financial Reporting',
    start_date: '2023-03-01',
    end_date: '2023-12-31',
    status: 'transferred',
    created_at: '2023-03-01T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z'
  },
  {
    id: '5',
    employee_id: 'EMP005',
    employee_name: 'David Brown',
    company_name: 'CUBS Technical',
    supervisor_id: 'EMP013',
    supervisor_name: 'Alex Supervisor',
    department: 'Marketing',
    role: 'Marketing Specialist',
    team: 'Digital Marketing',
    project: 'Brand Campaign',
    start_date: '2023-04-01',
    status: 'inactive',
    created_at: '2023-04-01T00:00:00Z',
    updated_at: '2023-04-01T00:00:00Z'
  }
];

const companyOptions = [
  { value: 'all', label: 'All Companies' },
  { value: 'CUBS Technical', label: 'CUBS Technical' },
  { value: 'GOLDEN CUBS', label: 'GOLDEN CUBS' }
];

const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' }
];

export default function AdminEmployeeMappings() {
  const [mappings, setMappings] = useState<EmployeeMapping[]>(mockMappings);
  const [filteredMappings, setFilteredMappings] = useState<EmployeeMapping[]>(mockMappings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<EmployeeMapping | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filter mappings based on search and filters
  useEffect(() => {
    let filtered = mappings;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mapping =>
        mapping.employee_name.toLowerCase().includes(searchLower) ||
        mapping.supervisor_name?.toLowerCase().includes(searchLower) ||
        mapping.department?.toLowerCase().includes(searchLower) ||
        mapping.role.toLowerCase().includes(searchLower) ||
        mapping.team?.toLowerCase().includes(searchLower) ||
        mapping.project?.toLowerCase().includes(searchLower)
      );
    }

    // Company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(mapping => mapping.company_name === selectedCompany);
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(mapping => mapping.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(mapping => mapping.status === selectedStatus);
    }

    setFilteredMappings(filtered);
  }, [mappings, searchTerm, selectedCompany, selectedDepartment, selectedStatus]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'active':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>Active</span>;
      case 'inactive':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>Inactive</span>;
      case 'transferred':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>Transferred</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const addMapping = () => {
    // Simulate adding a new mapping
    toast.success('Add mapping functionality would be implemented here');
  };

  const editMapping = (mapping: EmployeeMapping) => {
    setSelectedMapping(mapping);
    setIsEditing(true);
  };

  const deleteMapping = async (mappingId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMappings(prev => prev.filter(mapping => mapping.id !== mappingId));
      
      toast.success('Employee mapping deleted successfully');
    } catch (error) {
      toast.error('Failed to delete employee mapping');
    } finally {
      setLoading(false);
    }
  };

  const saveMapping = async () => {
    if (!selectedMapping) return;

    try {
      setLoading(true);
      
      setMappings(prev => prev.map(mapping =>
        mapping.id === selectedMapping.id
          ? { ...selectedMapping, updated_at: new Date().toISOString() }
          : mapping
      ));
      
      setSelectedMapping(null);
      setIsEditing(false);
      toast.success('Employee mapping updated successfully');
    } catch (error) {
      toast.error('Failed to update employee mapping');
    }
  };

  const activeCount = mappings.filter(m => m.status === 'active').length;
  const inactiveCount = mappings.filter(m => m.status === 'inactive').length;
  const transferredCount = mappings.filter(m => m.status === 'transferred').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Mappings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage employee relationships and organizational structure</p>
          </div>
          <Button
            onClick={addMapping}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Mapping
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Mappings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{mappings.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{inactiveCount}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <UserX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transferred</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{transferredCount}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search mappings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <Select
              placeholder="Company"
              options={companyOptions}
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            />
            
            <Select
              placeholder="Department"
              options={departmentOptions}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            />
            
            <Select
              placeholder="Status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </Card>

        {/* Mappings List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Supervisor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Start Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{mapping.employee_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{mapping.employee_id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.company_name}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.supervisor_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.department || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.role}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.team || '-'}</td>
                    <td className="py-3 px-4">{getStatusBadge(mapping.status)}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDate(mapping.start_date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editMapping(mapping)}
                          icon={<Edit className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMapping(mapping.id)}
                          icon={<Trash2 className="w-4 h-4" />}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedMapping ? 'Edit Employee Mapping' : 'Add Employee Mapping'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee ID
                </label>
                <Input
                  value={selectedMapping?.employee_id || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, employee_id: e.target.value }))}
                  placeholder="Enter employee ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employee Name
                </label>
                <Input
                  value={selectedMapping?.employee_name || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, employee_name: e.target.value }))}
                  placeholder="Enter employee name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company
                </label>
                <Input
                  value={selectedMapping?.company_name || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, company_name: e.target.value }))}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supervisor ID
                </label>
                <Input
                  value={selectedMapping?.supervisor_id || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, supervisor_id: e.target.value }))}
                  placeholder="Enter supervisor ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <Input
                  value={selectedMapping?.department || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, department: e.target.value }))}
                  placeholder="Enter department"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <Input
                  value={selectedMapping?.role || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, role: e.target.value }))}
                  placeholder="Enter role"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team
                </label>
                <Input
                  value={selectedMapping?.team || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, team: e.target.value }))}
                  placeholder="Enter team"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={selectedMapping?.start_date || ''}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, start_date: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select
                  value={selectedMapping?.status || 'active'}
                  onChange={(e) => setSelectedMapping(prev => ({ ...prev!, status: e.target.value as any }))}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'transferred', label: 'Transferred' }
                  ]}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveMapping}>
                {selectedMapping?.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 

