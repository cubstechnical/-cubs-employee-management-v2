'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/badge/Badge';
import { 
  Users, 
  Building2, 
  MapPin, 
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface EmployeeMapping {
  id: string;
  employeeId: string;
  employeeName: string;
  company: string;
  location: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function EmployeeMappings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [mappings, setMappings] = useState<EmployeeMapping[]>([
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      company: 'CUBS Technical UAE',
      location: 'Dubai',
      department: 'Engineering',
      status: 'active'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      company: 'CUBS Technical Qatar',
      location: 'Doha',
      department: 'HR',
      status: 'active'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Ahmed Al-Rashid',
      company: 'CUBS Technical KSA',
      location: 'Riyadh',
      department: 'Finance',
      status: 'pending'
    }
  ]);

  const companies = [
    'CUBS Technical UAE',
    'CUBS Technical Qatar',
    'CUBS Technical KSA',
    'CUBS Technical Oman'
  ];

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = mapping.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !selectedCompany || mapping.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Employee Mappings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage employee assignments across CUBS Technical companies
            </p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />}>
            Add Mapping
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Search Employees"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                label="Filter by Company"
                placeholder="All Companies"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                options={[
                  { value: '', label: 'All Companies' },
                  ...companies.map(company => ({ value: company, label: company }))
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCompany('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mappings.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Mappings
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mappings.filter(m => m.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Mappings
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <MapPin className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mappings.filter(m => m.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Mappings
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {companies.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Companies
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Mappings Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Company
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {mapping.employeeName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {mapping.employeeId}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white">
                      {mapping.company}
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white">
                      {mapping.location}
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-white">
                      {mapping.department}
                    </td>
                    <td className="py-4 px-4">
                      <Badge color={getStatusColor(mapping.status)}>
                        {mapping.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
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

          {filteredMappings.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No mappings found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or add a new mapping.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
