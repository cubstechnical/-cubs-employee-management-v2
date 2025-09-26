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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
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
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                className="flex-1"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={selectedCount === 0}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedCount})
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onBulkExport}
                disabled={selectedCount === 0 || isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <FileText className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export ({selectedCount})
                  </>
                )}
              </Button>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Selection Progress</span>
                <span>{selectedCount}/{totalEmployees}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#d3194f] to-[#b0173a] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedCount / totalEmployees) * 100}%` }}
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