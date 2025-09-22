'use client'

import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/badge/Badge'
import { User, Mail, Phone, Building2, Calendar, Edit, Trash2 } from 'lucide-react'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  position: string
  department?: string
  hire_date: string
  status: 'active' | 'inactive'
  company_id: string
  created_at: string
  updated_at: string
}

interface EmployeeCardProps {
  employee: Employee
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
}

export default function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const formatPhone = (phone?: string) => {
    if (!phone) return 'N/A'
    // Simple phone formatting
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDelete = () => {
    onDelete(employee.id)
    setShowDeleteConfirm(false)
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-sm text-gray-500">{employee.employee_id}</p>
          </div>
        </div>
        <Badge
          color={employee.status === 'active' ? 'success' : 'error'}
        >
          {employee.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{employee.email}</span>
        </div>
        
        {employee.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{formatPhone(employee.phone)}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{employee.position}</span>
        </div>
        
        {employee.department && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{employee.department}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Hired: {formatDate(employee.hire_date)}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(employee)}
          className="flex items-center space-x-1"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </Button>
        
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center space-x-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 mb-3">
            Are you sure you want to delete this employee? This action cannot be undone.
          </p>
          <div className="flex space-x-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                    >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
