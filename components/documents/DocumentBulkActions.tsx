'use client';

import { useState } from 'react';
import { Download, Trash2, Archive, Share, MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface DocumentBulkActionsProps {
  selectedCount: number;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkShare: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
}

export default function DocumentBulkActions({
  selectedCount,
  onBulkDownload,
  onBulkDelete,
  onBulkArchive,
  onBulkShare,
  onClearSelection,
  disabled = false
}: DocumentBulkActionsProps) {
  const [showActions, setShowActions] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDownload = () => {
    if (selectedCount > 10) {
      toast.error('Cannot download more than 10 files at once');
      return;
    }
    onBulkDownload();
  };

  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} document(s)?`)) {
      return;
    }
    onBulkDelete();
  };

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{selectedCount}</span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Primary Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDownload}
            disabled={disabled || selectedCount > 10}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkShare}
            disabled={disabled}
            className="flex items-center space-x-2"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              disabled={disabled}
              className="flex items-center space-x-2"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </Button>

            {showActions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onBulkArchive();
                      setShowActions(false);
                    }}
                    disabled={disabled}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive</span>
                  </button>
                  <button
                    onClick={() => {
                      handleBulkDelete();
                      setShowActions(false);
                    }}
                    disabled={disabled}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={disabled}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Download Limit Warning */}
      {selectedCount > 10 && (
        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ Download is limited to 10 files at once. Please select fewer files or download in batches.
        </div>
      )}
    </Card>
  );
}


