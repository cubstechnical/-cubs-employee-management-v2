'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog } from '@headlessui/react';
import { X, Calendar, Save, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { EmployeeService } from '@/lib/services/employees';
import { log } from '@/lib/utils/productionLogger';

interface VisaRenewalModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: {
        id: string;
        name: string;
        visa_expiry_date: string;
        company_name: string;
    } | null;
    onSuccess: () => void;
}

const renewalSchema = z.object({
    newExpiryDate: z.string().min(1, 'New expiry date is required'),
    notes: z.string().optional(),
});

type RenewalFormData = z.infer<typeof renewalSchema>;

export default function VisaRenewalModal({ isOpen, onClose, employee, onSuccess }: VisaRenewalModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<RenewalFormData>({
        resolver: zodResolver(renewalSchema),
    });

    if (!isOpen || !employee) return null;

    const onSubmit = async (data: RenewalFormData) => {
        setIsSubmitting(true);
        try {
            log.info(`🔄 Renewing visa for ${employee.name} (${employee.id})`);

            // 1. Update Employee Record
            const updateResult = await EmployeeService.updateEmployee({
                employee_id: employee.id,
                visa_expiry_date: data.newExpiryDate,
            } as any);

            if (updateResult) {
                toast.success(`✅ Visa renewed for ${employee.name}`);
                log.info('✅ Visa renewal successful');
                reset();
                onSuccess();
                onClose();
            } else {
                throw new Error('Failed to update employee record');
            }
        } catch (error) {
            log.error('❌ Error renewing visa:', error);
            toast.error('Failed to renew visa. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Renew Visa
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.name} • {employee.company_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Current Expiry:</span>
                        </div>
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300 pl-6">
                            {new Date(employee.visa_expiry_date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>

                    <Input
                        type="date"
                        label="New Visa Expiry Date"
                        {...register('newExpiryDate')}
                        error={errors.newExpiryDate?.message}
                        min={new Date().toISOString().split('T')[0]} // Cannot be in past
                    />

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Renewal Notes (Optional)
                        </label>
                        <textarea
                            {...register('notes')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm"
                            rows={3}
                            placeholder="e.g., Renewed for 2 years, payment ref #12345"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Renewal
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
