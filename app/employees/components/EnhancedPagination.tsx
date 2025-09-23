'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationState, buttonVariants } from '../types';

interface EnhancedPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

const EnhancedPagination = memo(({ pagination, onPageChange }: EnhancedPaginationProps) => {
  const { currentPage, totalPages, totalEmployees, pageSize } = pagination;

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalEmployees);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between mt-8 px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
    >
      {/* Results Info */}
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
        <span>
          Showing <span className="font-semibold text-[#d3194f]">{startItem}</span> to{' '}
          <span className="font-semibold text-[#d3194f]">{endItem}</span> of{' '}
          <span className="font-semibold text-[#d3194f]">{totalEmployees}</span> employees
        </span>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* First Page */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronsLeft className="w-4 h-4" />
            <span className="hidden sm:inline">First</span>
          </Button>
        </motion.div>

        {/* Previous Page */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
        </motion.div>
        
        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  ...
                </span>
              ) : (
                <motion.div
                  key={page}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={`w-10 h-10 p-0 ${
                      currentPage === page 
                        ? 'bg-gradient-to-r from-[#d3194f] to-[#b0173a] text-white border-transparent' 
                        : ''
                    }`}
                  >
                    {page}
                  </Button>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Next Page */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* Last Page */}
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Last</span>
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
});

EnhancedPagination.displayName = 'EnhancedPagination';

export default EnhancedPagination;


