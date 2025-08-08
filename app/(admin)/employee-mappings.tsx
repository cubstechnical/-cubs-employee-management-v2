'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Search, Filter, Edit, Trash2, UserPlus, Users, UserCheck, UserX, ArrowRight } from 'lucide-react';
import { EmployeeMappingService, EmployeeMapping } from '@/lib/services/employeeMappings';
import toast from 'react-hot-toast';

export default function AdminEmployeeMappings() {
  const [mappings, setMappings] = useState<EmployeeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    loadMappings();
    loadCompanies();
  }, []);

  const loadMappings = async () => {
    try {
      setLoading(true);
      const { mappings: data, error } = await EmployeeMappingService.getMappings();
      
      if (error) {
        toast.error(error);
        return;
      }
      
      setMappings(data);
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast.error('Failed to load employee mappings');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { companies: companyList } = await EmployeeMappingService.getFilterOptions();
      setCompanies(companyList);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = mapping.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mapping.role && mapping.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCompany = selectedCompany === 'all' || mapping.company_name === selectedCompany;
    
    return matchesSearch && matchesCompany;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'transferred':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Mappings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage employee organizational relationships and assignments.
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Companies' },
                ...companies.map(company => ({ value: company, label: company }))
              ]}
              value={selectedCompany}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCompany(e.target.value)}
            />
            <Button onClick={() => toast.success('Add mapping functionality')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </Card>

        {/* Mappings Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading mappings...</p>
            </div>
          ) : filteredMappings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No mappings found matching your search.' : 'No employee mappings found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
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
                          <div className="font-medium text-gray-900 dark:text-white">{mapping.employee_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{mapping.employee_id}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.company_name}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.department || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{mapping.role || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mapping.status)}`}>
                          {mapping.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDate(mapping.start_date)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success('Edit functionality')}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success('Delete functionality')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
} 

