// Enhanced types for the employees page
export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email_id?: string;
  mobile_number?: string;
  trade: string;
  company_name: string;
  visa_expiry_date: string;
  is_active: boolean;
  created_at: string;
  nationality: string;
  status: string;
}

export interface EmployeeCounts {
  all: number;
  active: number;
  inactive: number;
}

export interface DeleteConfirmationState {
  isOpen: boolean;
  employee: Employee | null;
  isDeleting: boolean;
}

export interface BulkActionState {
  selectedEmployees: Set<string>;
  isSelecting: boolean;
  showBulkActions: boolean;
}

export interface FilterState {
  status: 'all' | 'active' | 'inactive';
  company: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
  visaStatus: 'all' | 'valid' | 'expiring' | 'expired';
}

export interface SearchState {
  term: string;
  debouncedTerm: string;
  suggestions: Employee[];
  showSuggestions: boolean;
  highlightedIndex: number;
  selectedEmployee: Employee | null;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalEmployees: number;
  pageSize: number;
}

// Animation variants for Framer Motion
export const cardVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0
  },
  exit: { 
    opacity: 0, 
    scale: 0.98, 
    y: -20
  }
};

export const suggestionVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0
  },
  exit: { 
    opacity: 0, 
    y: -10
  }
};

export const buttonVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  transition: { duration: 0.1 }
};
