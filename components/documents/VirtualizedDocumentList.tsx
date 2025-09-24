'use client';

import React, { useMemo, useState } from 'react';
import VirtualList from '@/components/performance/VirtualList';
// DocumentCard doesn't exist - will create inline component
import { Document } from '@/lib/services/documents';
import { Folder, File, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FolderItem {
  type: 'folder' | 'document';
  name: string;
  path: string;
  document_id?: string;
  employee_id?: string;
  company_name?: string;
  file_name?: string;
  file_type?: string;
  created_at?: string;
  file_size?: number;
  lastModified?: string;
  documentCount?: number;
}

interface VirtualizedDocumentListProps {
  items: FolderItem[];
  loading?: boolean;
  onItemClick: (item: FolderItem) => void;
  onDocumentView?: (item: FolderItem) => void;
  onDocumentDownload?: (item: FolderItem) => void;
  onDocumentDelete?: (item: FolderItem) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  loadingDocumentId?: string | null;
  searchTerm?: string;
  containerHeight?: number;
  className?: string;
}

const ITEM_HEIGHT = 100; // Height of each item in pixels

const VirtualizedDocumentList: React.FC<VirtualizedDocumentListProps> = ({
  items,
  loading = false,
  onItemClick,
  onDocumentView,
  onDocumentDownload,
  onDocumentDelete,
  selectedIds = new Set(),
  onToggleSelect,
  loadingDocumentId,
  searchTerm = '',
  containerHeight = 600,
  className = ''
}) => {
  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(searchLower) ||
      item.file_name?.toLowerCase().includes(searchLower) ||
      item.company_name?.toLowerCase().includes(searchLower) ||
      item.employee_id?.toLowerCase().includes(searchLower)
    );
  }, [items, searchTerm]);

  // Render function for each item
  const renderItem = (item: FolderItem, index: number) => {
    if (item.type === 'folder') {
      return (
        <div
          key={`${item.company_name}-${item.employee_id}-${index}`}
          onClick={() => onItemClick(item)}
          className="w-full h-full cursor-pointer"
        >
          <FolderCard item={item} />
        </div>
      );
    } else {
      return (
        <div
          key={item.document_id || `doc-${index}`}
          className="w-full h-full"
        >
          <DocumentItemCard
            item={item}
            onView={() => onDocumentView?.(item)}
            onDownload={() => onDocumentDownload?.(item)}
            onDelete={() => onDocumentDelete?.(item)}
            onSelect={() => onToggleSelect?.(item.document_id!)}
            isSelected={!!item.document_id && selectedIds.has(item.document_id)}
            loadingDocumentId={loadingDocumentId}
          />
        </div>
      );
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 p-4">
      {Array.from({ length: Math.min(8, Math.ceil(containerHeight / ITEM_HEIGHT)) }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
      {searchTerm ? (
        <>
          <Search className="w-16 h-16" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No matching documents found
            </h3>
            <p className="text-sm">
              No documents found matching &quot;{searchTerm}&quot;. Try searching by employee name, file name, or company.
            </p>
          </div>
        </>
      ) : (
        <>
          <Folder className="w-16 h-16" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No documents found
            </h3>
            <p className="text-sm">Upload some documents to get started</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={cn('w-full', className)}>
      <VirtualList
        items={filteredItems}
        renderItem={renderItem}
        itemHeight={ITEM_HEIGHT}
        containerHeight={containerHeight}
        loading={loading}
        loadingComponent={<LoadingSkeleton />}
        emptyComponent={<EmptyState />}
        overscan={3}
        className="rounded-lg border border-gray-200 dark:border-gray-700"
      />
      
      {/* Performance info for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Showing {filteredItems.length} of {items.length} items
          {searchTerm && ` (filtered by "${searchTerm}")`}
        </div>
      )}
    </div>
  );
};

// Document item card component
const DocumentItemCard: React.FC<{ 
  item: FolderItem; 
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  loadingDocumentId: string | null | undefined;
}> = ({ item, onView, onDownload, onDelete, onSelect, isSelected, loadingDocumentId }) => (
  <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
      <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
    
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-gray-900 dark:text-white truncate">
        {item.file_name || item.name}
      </h3>
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{item.file_type}</span>
        {item.created_at && (
          <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
        )}
      </div>
    </div>
    
    <div className="flex items-center space-x-2">
      <button
        onClick={onView}
        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
      >
        View
      </button>
      <button
        onClick={onDownload}
        className="text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
      >
        Download
      </button>
    </div>
  </div>
);

// Folder card component
const FolderCard: React.FC<{ item: FolderItem }> = ({ item }) => (
  <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group">
    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
      <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </div>
    
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-gray-900 dark:text-white truncate">
        {item.name}
      </h3>
      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{item.company_name}</span>
        {item.documentCount && (
          <span>{item.documentCount} document{item.documentCount !== 1 ? 's' : ''}</span>
        )}
        {item.lastModified && (
          <span>Modified {new Date(item.lastModified).toLocaleDateString()}</span>
        )}
      </div>
    </div>
    
    <div className="flex items-center space-x-2">
      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
        Folder
      </span>
    </div>
  </div>
);

export default React.memo(VirtualizedDocumentList);
