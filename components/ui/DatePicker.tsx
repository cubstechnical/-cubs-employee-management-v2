import { forwardRef } from 'react';
import DatePickerLib from 'react-datepicker';
import { cn } from '@/utils/cn';

interface DatePickerProps {
  label?: string;
  error?: string;
  helper?: string;
  className?: string;
  placeholder?: string;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker = forwardRef<DatePickerLib, DatePickerProps>(({
  label,
  error,
  helper,
  className,
  placeholder = 'Select date',
  value,
  onChange,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <DatePickerLib
          ref={ref}
          selected={value}
          onChange={(date, event) => onChange?.(Array.isArray(date) ? date[0] : date)}
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          dateFormat="yyyy-MM-dd"
          className={cn(
            'block w-full rounded-lg border transition-colors duration-200',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'border-gray-300 dark:border-gray-600',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
            'disabled:bg-gray-50 disabled:text-gray-500',
            'dark:disabled:bg-gray-700 dark:disabled:text-gray-400',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600 dark:focus:border-red-400 dark:focus:ring-red-400/20'
              : '',
            'pl-4 pr-4 py-2.5',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
        }
        .react-datepicker-popper {
          z-index: 1000;
        }
        .react-datepicker {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .dark .react-datepicker {
          background-color: #1f2937;
          border-color: #4b5563;
          color: white;
        }
        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
        }
        .dark .react-datepicker__header {
          background-color: #374151;
          border-color: #4b5563;
        }
        .react-datepicker__current-month {
          color: #111827;
          font-weight: 600;
        }
        .dark .react-datepicker__current-month {
          color: white;
        }
        .react-datepicker__day-name {
          color: #6b7280;
        }
        .dark .react-datepicker__day-name {
          color: #9ca3af;
        }
        .react-datepicker__day {
          color: #111827;
          border-radius: 4px;
        }
        .dark .react-datepicker__day {
          color: white;
        }
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
        }
        .dark .react-datepicker__day:hover {
          background-color: #4b5563;
        }
        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
        }
        .react-datepicker__day--keyboard-selected {
        }
        .react-datepicker__day--disabled {
          color: #d1d5db;
        }
        .dark .react-datepicker__day--disabled {
          color: #6b7280;
        }
        .react-datepicker__navigation {
          color: #6b7280;
        }
        .dark .react-datepicker__navigation {
          color: #9ca3af;
        }
        .react-datepicker__navigation:hover {
          color: #111827;
        }
        .dark .react-datepicker__navigation:hover {
          color: white;
        }
      `}</style>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker; 
