'use client';

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';

// Lazy load heavy components for faster initial load
const DocumentPreview = lazy(() => import('@/components/documents/DocumentPreview'));
const LazyUploadModal = lazy(() => import('@/components/documents/UploadModal'));

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Search, Folder, File, ChevronRight, Download, Eye, Trash2, FileText, Image, FileVideo, FileAudio, Archive, Loader2, X } from 'lucide-react';
import { saveAs } from 'file-saver';
import { DocumentService } from '@/lib/services/documents';
import { useDocumentFolders, useEmployeeFolders, useEmployeeDocuments, useCompanyDocuments, useDocumentSearch, useRefreshDocuments } from '@/lib/hooks/useDocuments';
import SearchAutocomplete from '@/components/documents/SearchAutocomplete';
// UploadModal is now lazy loaded as LazyUploadModal
import toast from 'react-hot-toast';

interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  notes?: string;
}

interface FolderItem {
  name: string;
  type: 'folder' | 'document';
  employeeId?: string;
  documentCount?: number;
  path: string;
  file_size?: number;
  file_url?: string;
  document_id?: string;
  file_type?: string;
  employeeName?: string;
  companyName?: string;
}

// Mobile-optimized document card component
const DocumentCard = ({ item, onView, onDownload, onDelete, onSelect, isSelected, loadingDocumentId }: {
  item: FolderItem;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  loadingDocumentId: string | null;
}) => {
  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileType?.toLowerCase();
    
    // PDF files
    if (extension === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '') || 
        mimeType?.includes('image')) {
      return <Image className="w-8 h-8 text-green-500" />;
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '') || 
        mimeType?.includes('video')) {
      return <FileVideo className="w-8 h-8 text-purple-500" />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '') || 
        mimeType?.includes('audio')) {
      return <FileAudio className="w-8 h-8 text-blue-500" />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '') || 
        mimeType?.includes('archive') || mimeType?.includes('compressed')) {
      return <Archive className="w-8 h-8 text-orange-500" />;
    }
    
    // Default file icon
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isLoading = loadingDocumentId === item.document_id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {item.type === 'folder' ? (
            <Folder className="w-8 h-8 text-[#d3194f]" />
          ) : (
            getFileIcon(item.name, item.file_type)
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight"
                title={item.name} // Show full filename on hover
            >
              {item.name}
            </h3>
            {item.type === 'document' && item.file_size && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.file_size)}
              </p>
            )}

            {item.type === 'document' && (item.employeeName || item.companyName) && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.employeeName && item.companyName 
                  ? `${item.employeeName} • ${item.companyName}`
                  : item.employeeName || item.companyName
                }
              </p>
            )}
          </div>
        </div>
        {item.type === 'document' && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        )}
      </div>

      {/* Actions */}
      {item.type === 'document' && (
        <div className="flex flex-wrap gap-2">
            <button
              onClick={onView}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-sm">View</span>
            </button>
            
            <button
              onClick={onDownload}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-sm">Download</span>
            </button>
          
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="text-sm">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Loading skeleton component
const DocumentSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mt-1"></div>
        </div>
      </div>
      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
    <div className="flex space-x-2">
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
    </div>
  </div>
);

function DocumentsContent() {
  const [currentPath, setCurrentPath] = useState('/');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use TanStack Query hooks for data fetching
  const { 
    data: foldersData, 
    isLoading: foldersLoading, 
    error: foldersError 
  } = useDocumentFolders();

  const pathParts = currentPath.split('/').filter(Boolean);
  const companyName = pathParts[0];
  const employeeId = pathParts[1];

  const { 
    data: employeeFoldersData, 
    isLoading: employeeFoldersLoading, 
    error: employeeFoldersError 
  } = useEmployeeFolders(companyName || '');

  const { 
    data: employeeDocumentsData, 
    isLoading: employeeDocumentsLoading, 
    error: employeeDocumentsError 
  } = useEmployeeDocuments(employeeId || '');

  const { 
    data: companyDocumentsData, 
    isLoading: companyDocumentsLoading, 
    error: companyDocumentsError 
  } = useCompanyDocuments(companyName || '');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { 
    data: searchData, 
    isLoading: isSearching, 
    error: searchError 
  } = useDocumentSearch(debouncedSearchTerm);

  const refreshDocuments = useRefreshDocuments();

  // Determine which data to display based on current path
  let items: FolderItem[] = [];
  let loading = false;
  let error: string | null = null;

  if (currentPath === '/') {
    // Root path - show company folders
    items = foldersData?.folders?.map(folder => ({
      name: folder.name,
      type: 'folder' as const,
      path: folder.path,
      documentCount: folder.documentCount
    })) || [];
    loading = foldersLoading;
    error = foldersError?.message || null;
  } else if (pathParts.length === 1) {
    // Company level
    if (companyName === 'Company Documents') {
      // Show company documents directly
      items = companyDocumentsData?.documents?.map(doc => ({
        name: doc.file_name,
        type: 'document' as const,
        path: doc.file_path,
        file_size: doc.file_size,
        file_url: doc.file_url,
        document_id: doc.id,
        file_type: doc.file_type
      })) || [];
      loading = companyDocumentsLoading;
      error = companyDocumentsError?.message || null;
    } else {
      // Show employee folders
      items = employeeFoldersData?.folders?.map(folder => ({
        name: folder.name,
        type: 'folder' as const,
        employeeId: folder.employeeId,
        path: folder.path,
        documentCount: folder.documentCount
      })) || [];
      loading = employeeFoldersLoading;
      error = employeeFoldersError?.message || null;
    }
  } else if (pathParts.length === 2) {
    // Employee level - show documents
    items = employeeDocumentsData?.documents?.map(doc => ({
      name: doc.file_name,
      type: 'document' as const,
      path: doc.file_path,
      file_size: doc.file_size,
      file_url: doc.file_url,
      document_id: doc.id,
      file_type: doc.file_type
    })) || [];
    loading = employeeDocumentsLoading;
    error = employeeDocumentsError?.message || null;
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Simplified navigation handling with TanStack Query
  const handleItemClick = (item: FolderItem) => {
    if (item.type === 'folder') {
      console.log('📁 Folder clicked:', item.name, 'Path:', item.path);
      setCurrentPath(item.path);
      setSelectedIds(new Set());
    }
  };

  // Background preloading for better UX (simplified)
  const preloadCompanyData = useCallback(async (companyName: string) => {
    // TanStack Query handles preloading automatically
    console.log('⚡ Preloading employees for:', companyName);
  }, []);

  const toggleSelect = (docId?: string) => {
    if (!docId) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  };

  const downloadSelectedAsZip = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkDownloading(true);
      const ids = Array.from(selectedIds);
      const res = await fetch('/api/documents/bulk-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to prepare zip');
      }
      const blob = await res.blob();
      saveAs(blob, 'documents.zip');
      toast.success('Download started');
      refreshDocuments();
    } catch (e) {
      console.error('Bulk download error', e);
      toast.error('Failed to prepare zip');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const selectAllInView = () => {
    const next = new Set<string>();
    items.forEach((i: FolderItem) => { if (i.type === 'document' && i.document_id) next.add(i.document_id); });
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Handle search results
  const searchResults: FolderItem[] = searchData?.documents?.map((doc: any) => ({
          name: doc.file_name,
    type: 'document' as const,
          path: doc.file_path,
          file_size: doc.file_size,
          file_url: doc.file_url,
          document_id: doc.id,
          file_type: doc.mime_type,
          employeeId: doc.employee_id,
          employeeName: doc.employee_name,
          companyName: doc.company_name
  })) || [];



  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    refreshDocuments();
  };

  const handleDocumentView = async (item: FolderItem) => {
    if (!item.document_id) {
      toast.error('Document ID not found');
      return;
    }

    try {
      setLoadingDocumentId(item.document_id);
      console.log('👁️ Opening document:', item.document_id, item.name);

      // Try to open in new tab
      const newTab = window.open(
        `/api/documents/${item.document_id}/view`,
        '_blank',
        'noopener,noreferrer'
      );

      if (newTab) {
        // Tab opened successfully
        newTab.focus();
        console.log('✅ Document opened in new tab');
        toast.success(`Opening ${item.name}...`);

        // Check if tab is blocked after a short delay
        setTimeout(() => {
          try {
            if (newTab.closed) {
              console.warn('⚠️ Document tab was closed immediately (possibly blocked)');
              toast.error('Document popup was blocked. Please allow popups for this site and try again.');
            }
          } catch (e) {
            // Ignore errors when checking if tab is closed
          }
        }, 1000);
      } else {
        console.warn('⚠️ Failed to open document tab (popup blocked?)');

        // Fallback: try to open directly (might work for some browsers)
        try {
          const link = document.createElement('a');
          link.href = `/api/documents/${item.document_id}/view`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.click();
          toast.success(`Opening ${item.name}...`);
        } catch (fallbackError) {
          console.error('❌ Fallback opening also failed:', fallbackError);
          toast.error('Failed to open document. Please check popup settings and try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error opening document viewer:', error);
      toast.error('Failed to open document viewer. Please try again.');
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const handleDocumentDownload = async (item: FolderItem) => {
    if (!item.document_id) return;

    try {
      setLoadingDocumentId(item.document_id);
      const res = await fetch(`/api/documents/${item.document_id}/download`);
      if (!res.ok) {
        throw new Error('Failed to download document');
      }
      const blob = await res.blob();
      saveAs(blob, item.name);
      toast.success('Download started');
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const handleDocumentDelete = async (item: FolderItem) => {
    if (!item.document_id || !confirm('Are you sure you want to delete this document?')) return;

    try {
      setLoadingDocumentId(item.document_id);
      console.log('🗑️ Deleting document:', item.document_id);
      
      const res = await fetch(`/api/documents/${item.document_id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete document');
      }
      
      console.log('✅ Document deleted successfully');
              toast.success('Document deleted successfully');
      refreshDocuments();
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setLoadingDocumentId(null);
    }
  };

  const navigateBack = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    
    if (pathParts.length === 1) {
      // Go back to root from company level
      setCurrentPath('/');
    } else {
      // Go back one level
      setCurrentPath('/' + pathParts.slice(0, -1).join('/'));
    }
      setSelectedIds(new Set());
  };

  const breadcrumbParts = currentPath.split('/').filter(Boolean);
  
  // Show search results when searching, otherwise show regular filtered items
  const filteredItems = debouncedSearchTerm.trim() 
    ? searchResults 
    : items.filter((item: FolderItem) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage employee documents and files</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:ml-4">
            {selectedIds.size > 0 && (
                <>
                  <Button
                  onClick={downloadSelectedAsZip}
                  disabled={isBulkDownloading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isBulkDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparing ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Selected ({selectedIds.size})
                    </>
                  )}
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                  >
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                  </Button>
                </>
              )}
              
            {currentPath !== '/' && (
                <Button
                onClick={selectAllInView}
                variant="outline"
                disabled={items.filter(i => i.type === 'document').length === 0}
              >
                Select All ({items.filter(i => i.type === 'document').length})
              </Button>
            )}
            
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
                </Button>
          </div>
              </div>

        {/* Search and Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <SearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={setSearchTerm}
              placeholder="Search documents by name, employee, or company..."
              className="w-full"
            />
          </div>
            
          {/* Quick Back to Root Button */}
          {currentPath !== '/' && (
            <div className="mb-4">
              <button
                onClick={() => {
                  console.log('🔄 "Back to Companies" button clicked - navigating to root');
                  setCurrentPath('/');
                  setSelectedIds(new Set());
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Companies</span>
              </button>
            </div>
          )}

          {/* Enhanced Breadcrumb Navigation */}
          {currentPath !== '/' && (
            <nav className="flex items-start space-x-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              {/* Back Button */}
              <button
                onClick={() => {
                  const pathParts = currentPath.split('/').filter(Boolean);
                  if (pathParts.length > 1) {
                    // Go back to company level
                    const companyPath = '/' + pathParts[0];
                    setCurrentPath(companyPath);
                    setSelectedIds(new Set());
                  } else {
                    // Go back to root
                    setCurrentPath('/');
                    setSelectedIds(new Set());
                  }
                }}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setCurrentPath('/');
                    setSelectedIds(new Set());
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Home
                </button>
                {breadcrumbParts.map((part: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => {
                        const newPath = '/' + breadcrumbParts.slice(0, index + 1).join('/');
                        setCurrentPath(newPath);
                        setSelectedIds(new Set());
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline max-w-48 truncate font-medium"
                      title={part} // Show full text on hover
                    >
                      {part}
                    </button>
            </div>
                ))}
          </div>
            </nav>
          )}
            </div>

        {/* Content */}
        <Card>
          {loading || isSearching ? (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                <DocumentSkeleton key={i} />
              ))}
            </div>
              </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="w-16 h-16 text-[#d3194f] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {debouncedSearchTerm.trim() ? 'No matching documents found' : 'No documents found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {debouncedSearchTerm.trim() 
                  ? `No documents found matching "${debouncedSearchTerm}". Try searching by employee name, file name, or company.` 
                  : 'Upload some documents to get started'
                }
              </p>
            </div>
                   ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filteredItems.map((item: FolderItem, index: number) => (
                  <div key={index} onClick={() => handleItemClick(item)} className="cursor-pointer">
                     <DocumentCard
                       item={item}
                      onView={() => handleDocumentView(item)}
                      onDownload={() => handleDocumentDownload(item)}
                      onDelete={() => handleDocumentDelete(item)}
                       onSelect={() => toggleSelect(item.document_id)}
                      isSelected={!!item.document_id && selectedIds.has(item.document_id)}
                       loadingDocumentId={loadingDocumentId}
                     />
                 </div>
               ))}
             </div>
        </div>
          )}
        </Card>

        {/* Upload Modal */}
        <Suspense fallback={<div>Loading upload modal...</div>}>
          <LazyUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadComplete={handleUploadComplete}
            currentPath={currentPath}
          />
        </Suspense>
      </div>
  );
}

export default function DocumentsOptimized() {
  return (
    <Suspense fallback={<DocumentSkeleton />}>
      <DocumentsContent />
    </Suspense>
  );
}