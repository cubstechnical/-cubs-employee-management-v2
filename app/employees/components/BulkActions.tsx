'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { 
  Download, 
  Trash2, 
  X, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { BulkActionState } from '../types';

interface BulkActionsProps {
  bulkState: BulkActionState;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  totalEmployees: number;
  isExporting?: boolean;
}

const BulkActions = memo(({
  bulkState,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkExport,
  totalEmployees,
  isExporting = false
}: BulkActionsProps) => {
  const selectedCount = bulkState.selectedEmployees.size;
  const isAllSelected = selectedCount === totalEmployees;

  return (
    <AnimatePresence>
      {bulkState.showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#d3194f] to-[#b0173a] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedCount} employee{selectedCount !== 1 ? 's' : ''} selected
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose an action to perform
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDeselectAll}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex items-center gap-3">
              {/* Select All/Deselect All */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isAllSelected ? onDeselectAll : onSelectAll}
                  className="text-xs"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </motion.div>

              {/* Export Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkExport}
                  disabled={isExporting}
                  className="text-xs flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <FileText className="w-3 h-3" />
                      </motion.div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Export CSV
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Delete Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDelete}
                  className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Selected
                </Button>
              </motion.div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Selection Progress</span>
                <span>{selectedCount} / {totalEmployees}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(selectedCount / totalEmployees) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#d3194f] to-[#b0173a] h-1.5 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

BulkActions.displayName = 'BulkActions';

export default BulkActions;

