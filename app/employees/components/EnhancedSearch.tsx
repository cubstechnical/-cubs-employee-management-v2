'use client';

import React, { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Input from '@/components/ui/Input';
import { Search, X } from 'lucide-react';
import { Employee, SearchState, suggestionVariants } from '../types';

interface EnhancedSearchProps {
  searchState: SearchState;
  onSearchChange: (term: string) => void;
  onSuggestionSelect: (employee: Employee) => void;
  onClearSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const EnhancedSearch = memo(({
  searchState,
  onSearchChange,
  onSuggestionSelect,
  onClearSearch,
  onKeyDown,
  onFocus,
  onBlur
}: EnhancedSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search employees by name, company, trade, or employee ID..."
          value={searchState.term}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className="pl-10 pr-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-[#d3194f] focus:ring-[#d3194f]/20 transition-all duration-200"
        />
        {searchState.term && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Enhanced Search Suggestions */}
      <AnimatePresence>
        {searchState.showSuggestions && searchState.suggestions.length > 0 && (
          <motion.div
            variants={suggestionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            {searchState.suggestions.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSuggestionSelect(employee)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#d3194f]/5 hover:to-[#b0173a]/5 ${
                  index === searchState.highlightedIndex 
                    ? 'bg-gradient-to-r from-[#d3194f]/10 to-[#b0173a]/10 border-[#d3194f]/20' 
                    : ''
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#d3194f] to-[#b0173a] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {employee.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {employee.name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    ID: {employee.employee_id}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {employee.company_name}
                    </span>
                    {employee.trade && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {employee.trade}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Show more results indicator */}
            {searchState.suggestions.length >= 8 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Press Enter to see all results for &quot;{searchState.term}&quot;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No suggestions found */}
      <AnimatePresence>
        {searchState.showSuggestions && searchState.term.length >= 2 && searchState.suggestions.length === 0 && (
          <motion.div
            variants={suggestionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-6"
          >
            <div className="text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No employees found for &quot;{searchState.term}&quot;
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Try a different search term
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

EnhancedSearch.displayName = 'EnhancedSearch';

export default EnhancedSearch;


