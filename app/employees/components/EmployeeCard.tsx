'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/badge/Badge';
import { 
  Edit, 
  Trash2, 
  Building, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Employee, cardVariants, buttonVariants } from '../types';

interface EmployeeCardProps {
  employee: Employee;
  onDelete: (employee: Employee) => void;
  onSelect: (employeeId: string, selected: boolean) => void;
  isSelected: boolean;
  index: number;
}

const EmployeeCard = memo(({ 
  employee, 
  onDelete, 
  onSelect, 
  isSelected, 
  index 
}: EmployeeCardProps) => {
  const router = useRouter();

  const getVisaStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'unknown', color: 'info' as const };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'error' as const };
    if (daysUntilExpiry <= 30) return { status: 'expiring', color: 'warning' as const };
    return { status: 'valid', color: 'success' as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const visaStatus = getVisaStatus(employee.visa_expiry_date);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group ${
          isSelected ? 'ring-2 ring-[#d3194f] bg-gradient-to-r from-[#d3194f]/5 to-[#b0173a]/5' : ''
        }`}
        onClick={() => onSelect(employee.id, !isSelected)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Selection Checkbox */}
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex-shrink-0"
            >
              {isSelected ? (
                <CheckCircle2 className="w-6 h-6 text-[#d3194f]" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300 hover:text-[#d3194f] transition-colors" />
              )}
            </motion.div>

            {/* Avatar with Gradient Background */}
            <div className="w-12 h-12 bg-gradient-to-br from-[#d3194f] to-[#b0173a] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-lg">
                {getInitials(employee.name)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#d3194f] transition-colors">
                {employee.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                ID: {employee.employee_id}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Building className="w-3 h-3" />
                  {employee.company_name}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {employee.nationality || 'N/A'}
                </div>
                {employee.trade && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <span className="w-3 h-3">🔧</span>
                    {employee.trade}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <Badge 
                color={employee.is_active ? 'success' : 'error'}
                className="mb-1"
              >
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <div>
                <Badge color={visaStatus.color}>
                  Visa {visaStatus.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e?.stopPropagation();
                    router.push(`/employees/${employee.id}`);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onDelete(employee);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
        
        {employee.visa_expiry_date && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-3 h-3" />
              Visa expires: {formatDate(employee.visa_expiry_date)}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';

export default EmployeeCard;
