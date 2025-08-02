import { ReactNode, forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helper,
  icon,
  endIcon,
  className,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
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
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'block w-full rounded-lg border transition-all duration-300 ease-in-out',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'border-gray-300 dark:border-gray-600',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:scale-[1.01]',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
            'disabled:bg-gray-50 disabled:text-gray-500',
            'dark:disabled:bg-gray-700 dark:disabled:text-gray-400',
            'hover:border-gray-400 dark:hover:border-gray-500',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600 dark:focus:border-red-400 dark:focus:ring-red-400/20'
              : '',
            icon ? 'pl-10' : 'pl-4',
            endIcon ? 'pr-10' : 'pr-4',
            'py-2.5',
            className
          )}
          {...props}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
              {endIcon}
            </div>
          </div>
        )}
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

Input.displayName = 'Input';

export default Input; 