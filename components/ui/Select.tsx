import { ReactNode, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  required?: boolean;
  options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helper,
  icon,
  className,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  options,
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
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          </div>
        )}
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={cn(
            'block w-full rounded-lg border transition-colors duration-200',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'border-gray-300 dark:border-gray-600',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
            'disabled:bg-gray-50 disabled:text-gray-500',
            'dark:disabled:bg-gray-700 dark:disabled:text-gray-400',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600 dark:focus:border-red-400 dark:focus:ring-red-400/20'
              : '',
            icon ? 'pl-10' : 'pl-4',
            'pr-10 py-2.5',
            'appearance-none',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select; 