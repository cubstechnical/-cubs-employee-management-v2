'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/badge/Badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building2,
  FileText,
  Edit,
  Save,
  X,
  ArrowLeft
} from 'lucide-react';

export default function EmployeeDetail() {
  const params = useParams();
  const employeeId = params?.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [employee, setEmployee] = useState({
    id: employeeId,
    name: 'John Doe',
    email: 'john.doe@cubstechnical.com',
    phone: '+971 50 123 4567',
    position: 'Senior Software Engineer',
    department: 'Engineering',
    company: 'CUBS Technical UAE',
    location: 'Dubai',
    visaExpiry: '2024-12-31',
    status: 'active',
    joinDate: '2022-01-15',
    documents: [
      { name: 'Passport', status: 'uploaded', expiry: '2025-06-15' },
      { name: 'Visa', status: 'uploaded', expiry: '2024-12-31' },
      { name: 'Emirates ID', status: 'pending', expiry: '2024-08-20' }
    ]
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save the changes to the backend
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'primary';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      default: return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => window.history.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Employee Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Employee ID: {employeeId}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  icon={<X className="w-4 h-4" />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={handleEdit}
              >
                Edit Employee
              </Button>
            )}
          </div>
        </div>

        {/* Employee Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Full Name"
                value={employee.name}
                onChange={(e) => setEmployee({...employee, name: e.target.value})}
                disabled={!isEditing}
                icon={<User className="w-4 h-4" />}
              />
            </div>
            <div>
              <Input
                label="Email Address"
                type="email"
                value={employee.email}
                onChange={(e) => setEmployee({...employee, email: e.target.value})}
                disabled={!isEditing}
                icon={<Mail className="w-4 h-4" />}
              />
            </div>
            <div>
              <Input
                label="Phone Number"
                value={employee.phone}
                onChange={(e) => setEmployee({...employee, phone: e.target.value})}
                disabled={!isEditing}
                icon={<Phone className="w-4 h-4" />}
              />
            </div>
            <div>
              <Input
                label="Position"
                value={employee.position}
                onChange={(e) => setEmployee({...employee, position: e.target.value})}
                disabled={!isEditing}
                icon={<User className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                label="Department"
                value={employee.department}
                onChange={(e) => setEmployee({...employee, department: e.target.value})}
                disabled={!isEditing}
                options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'HR', label: 'Human Resources' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Sales', label: 'Sales' }
                ]}
              />
            </div>
            <div>
              <Select
                label="Company"
                value={employee.company}
                onChange={(e) => setEmployee({...employee, company: e.target.value})}
                disabled={!isEditing}
                options={[
                  { value: 'CUBS Technical UAE', label: 'CUBS Technical UAE' },
                  { value: 'CUBS Technical Qatar', label: 'CUBS Technical Qatar' },
                  { value: 'CUBS Technical KSA', label: 'CUBS Technical KSA' },
                  { value: 'CUBS Technical Oman', label: 'CUBS Technical Oman' }
                ]}
              />
            </div>
            <div>
              <Input
                label="Location"
                value={employee.location}
                onChange={(e) => setEmployee({...employee, location: e.target.value})}
                disabled={!isEditing}
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div>
              <Input
                label="Join Date"
                type="date"
                value={employee.joinDate}
                onChange={(e) => setEmployee({...employee, joinDate: e.target.value})}
                disabled={!isEditing}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
          </div>
        </Card>

        {/* Visa Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Visa Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Visa Expiry Date"
                type="date"
                value={employee.visaExpiry}
                onChange={(e) => setEmployee({...employee, visaExpiry: e.target.value})}
                disabled={!isEditing}
                icon={<Calendar className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                label="Status"
                value={employee.status}
                onChange={(e) => setEmployee({...employee, status: e.target.value})}
                disabled={!isEditing}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' }
                ]}
              />
            </div>
          </div>
          <div className="mt-4">
            <Badge color={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
          </div>
        </Card>

        {/* Documents */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Documents
          </h2>
          <div className="space-y-4">
            {employee.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {doc.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expires: {doc.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge color={getDocumentStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
