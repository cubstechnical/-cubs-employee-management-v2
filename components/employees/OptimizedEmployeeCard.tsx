'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/Button';
import { 
  Calendar, 
  Building2, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Employee } from '@/types';

interface OptimizedEmployeeCardProps {
  employee: Employee & {
    is_active?: boolean;
    position?: string;
    phone_number?: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
}

// Memoized visa status calculation
const calculateVisaStatus = (visaExpiryDate: string | null) => {
  if (!visaExpiryDate) return { status: 'unknown', color: 'gray', icon: Clock };
  
  const expiryDate = new Date(visaExpiryDate);
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  if (expiryDate < today) {
    return { status: 'expired', color: 'red', icon: AlertTriangle };
  } else if (expiryDate <= thirtyDaysFromNow) {
    return { status: 'expiring', color: 'yellow', icon: Clock };
  } else {
    return { status: 'valid', color: 'green', icon: CheckCircle };
  }
};

// Memoized employee card component
export const OptimizedEmployeeCard = memo(function OptimizedEmployeeCard({
  employee,
  onEdit,
  onDelete,
  onView,
  showActions = true
}: OptimizedEmployeeCardProps) {
  const router = useRouter();

  // Memoize expensive calculations
  const visaStatus = useMemo(() => 
    calculateVisaStatus(employee.visa_expiry_date), 
    [employee.visa_expiry_date]
  );

  const formattedVisaDate = useMemo(() => {
    if (!employee.visa_expiry_date) return 'Not set';
    return new Date(employee.visa_expiry_date).toLocaleDateString();
  }, [employee.visa_expiry_date]);

  const daysUntilExpiry = useMemo(() => {
    if (!employee.visa_expiry_date) return null;
    const expiryDate = new Date(employee.visa_expiry_date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [employee.visa_expiry_date]);

  // Memoized event handlers
  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(employee.id);
    } else {
      router.push(`/employees/${employee.id}/edit`);
    }
  }, [employee.id, onEdit, router]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(employee.id);
    }
  }, [employee.id, onDelete]);

  const handleView = useCallback(() => {
    if (onView) {
      onView(employee.id);
    } else {
      router.push(`/employees/${employee.id}`);
    }
  }, [employee.id, onView, router]);

  const handleCardClick = useCallback(() => {
    router.push(`/employees/${employee.id}`);
  }, [employee.id, router]);

  const StatusIcon = visaStatus.icon;

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {employee.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {employee.employee_id}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              color={employee.is_active ? "success" : "info"}
            >
              {employee.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge 
              color={
                visaStatus.color === 'red' ? 'error' :
                visaStatus.color === 'yellow' ? 'warning' :
                visaStatus.color === 'green' ? 'success' :
                'info'
              }
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {visaStatus.status}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
        {/* Company and Position */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Building2 className="w-4 h-4" />
          <span>{employee.company_name}</span>
        </div>

        {employee.position && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Position:</span> {employee.position}
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-2">
          {employee.email_id && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span className="truncate">{employee.email_id}</span>
            </div>
          )}
          {employee.phone_number && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{employee.phone_number}</span>
            </div>
          )}
        </div>

        {/* Visa Information */}
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Visa expires: {formattedVisaDate}
          </span>
          {daysUntilExpiry !== null && (
            <span className={`text-xs px-2 py-1 rounded ${
              daysUntilExpiry < 0 ? 'bg-red-100 text-red-800' :
              daysUntilExpiry <= 30 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)} days overdue` :
               daysUntilExpiry === 0 ? 'Expires today' :
               `${daysUntilExpiry} days left`}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e?.stopPropagation();
                handleView();
              }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e?.stopPropagation();
                handleEdit();
              }}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e?.stopPropagation();
                handleDelete();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        </div>
      </div>
    </Card>
  );
});

export default OptimizedEmployeeCard;
