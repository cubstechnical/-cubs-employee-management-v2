'use client';

import { log } from '@/lib/utils/productionLogger';

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Search, Folder, File, ChevronRight, Download, Eye, Trash2, FileText, Image, FileVideo, FileAudio, Archive, Loader2, X, Filter } from 'lucide-react';
import { saveAs } from 'file-saver';
import { DocumentService } from '@/lib/services/documents';
import UploadModal from '@/components/documents/UploadModal';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/usePerformance';

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
}

// Optimized document card component with memoization
const DocumentCard = React.memo(({ item, onView, onDownload, onDelete, onSelect, isSelected, loadingDocumentId, onItemClick }: {
  item: FolderItem;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
  loadingDocumentId: string | null;
  onItemClick: () => void;
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
      return <Image className="w-8 h-8 text-green-500" />; // eslint-disable-line jsx-a11y/alt-text
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
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow ${
        item.type === 'folder' ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''
      }`}
      onClick={item.type === 'folder' ? onItemClick : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {item.type === 'folder' ? (
            <Folder className="w-8 h-8 text-blue-500" />
          ) : (
            getFileIcon(item.name, item.file_type)
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {item.name}
            </h3>
            {item.type === 'document' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.file_size || 0)}
              </p>
            )}
          </div>
        </div>
        
        {/* Selection checkbox for documents */}
        {item.type === 'document' && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        )}
      </div>

      {/* Action buttons */}
      {item.type === 'document' && (
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
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
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
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
  });

  DocumentCard.displayName = 'DocumentCard';

// Optimized loading skeleton with memoization
const DocumentSkeleton = React.memo(() => (
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
 ));

 DocumentSkeleton.displayName = 'DocumentSkeleton';

// Virtual scrolling component for large lists
const VirtualList = React.memo(({ items, renderItem, itemHeight = 80, containerHeight = 600 }: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="space-y-4"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

export default function DocumentsOptimized() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DocumentSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function DocumentsContent() {
  const [items, setItems] = useState<FolderItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const viewerRef = useRef<Window | null>(null);
  const shouldRefreshOnFocusRef = useRef(false);
  const shouldBypassCacheRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'documents'>('all');
  const hasClearedCacheRef = useRef(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize cache only if needed (no aggressive clearing)
  useEffect(() => {
    // Only clear cache if it's been more than 1 hour since last clear
    const lastClearTime = localStorage.getItem('docs:last-clear-time');
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (!lastClearTime || (now - parseInt(lastClearTime)) > oneHour) {
      DocumentService.clearCache();
      localStorage.setItem('docs:last-clear-time', now.toString());
      log.info('🧹 Cleared document cache (time-based refresh)');
    } else {
      log.info('📦 Using existing document cache');
    }
  }, []);

  const loadItems = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    try {
      log.info('🔄 Loading items for path:', currentPath);
      let showSpinner = true;
      
      if (currentPath === '/') {
        // Try local cache first for root folders
        const cacheKey = 'docs:root-folders';
        if (typeof window !== 'undefined' && !shouldBypassCacheRef.current) {
          const cached = window.localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as { items: FolderItem[]; ts: number };
              if (Date.now() - parsed.ts < 5 * 60 * 1000) { // 5 minutes cache
                setItems(parsed.items);
                showSpinner = false;
              }
            } catch {}
          }
        }
        // reset bypass after applying
        if (shouldBypassCacheRef.current) shouldBypassCacheRef.current = false;
        if (showSpinner) setLoading(true);
        // Load company folders
        const { folders, error } = await DocumentService.getDocumentFolders();
        if (error) {
          toast.error(error);
          return;
        }

        const folderItems: FolderItem[] = folders
          .filter(folder => folder.type === 'company')
          .map(folder => ({
            name: folder.name,
            type: 'folder',
            path: `/${folder.companyName}`
          }));
        if (latestRequestIdRef.current === requestId) {
          setItems(folderItems);
          // Save to local cache
          if (typeof window !== 'undefined') {
            try { window.localStorage.setItem(cacheKey, JSON.stringify({ items: folderItems, ts: Date.now() })); } catch {}
          }
        }
      } else {
        // Load documents for current path
        const pathParts = currentPath.split('/').filter(Boolean);
        const companyName = pathParts[0];
        
        if (pathParts.length === 1) {
          // Company level - show employee folders or documents
          if (companyName === 'Company Documents') {
            // For Company Documents, show documents directly
            const { documents, error } = await DocumentService.getCompanyDocuments();
            if (error) {
              toast.error(error);
              return;
            }

            const documentItems: FolderItem[] = documents.map(doc => ({
              name: doc.file_name,
              type: 'document',
              path: doc.file_path,
              file_size: doc.file_size,
              file_url: doc.file_url,
              document_id: doc.id,
              file_type: doc.file_type
            }));
            if (latestRequestIdRef.current === requestId) {
              setItems(documentItems);
            }
          } else {
            // For other companies, show employee folders
            // Try per-company local cache first
            const cacheKey = `docs:company:${companyName}`;
            if (typeof window !== 'undefined' && !shouldBypassCacheRef.current) {
              const cached = window.localStorage.getItem(cacheKey);
              if (cached) {
                try {
                  const parsed = JSON.parse(cached) as { items: FolderItem[]; ts: number };
                  if (Date.now() - parsed.ts < 5 * 60 * 1000) {
                    setItems(parsed.items);
                    showSpinner = false;
                  }
                } catch {}
              }
            }
            if (shouldBypassCacheRef.current) shouldBypassCacheRef.current = false;
            if (showSpinner) setLoading(true);

            const { folders, error } = await DocumentService.getEmployeeFolders(companyName);
            if (error) {
              toast.error(error);
              return;
            }

            const folderItems: FolderItem[] = folders
              .filter(folder => folder.type === 'employee')
              .map(folder => ({
                name: folder.employeeName || folder.name,
                type: 'folder',
                employeeId: folder.employeeId,
                path: `${currentPath}/${folder.employeeId}`
              }));
            if (latestRequestIdRef.current === requestId) {
              setItems(folderItems);
              if (typeof window !== 'undefined') {
                try { window.localStorage.setItem(cacheKey, JSON.stringify({ items: folderItems, ts: Date.now() })); } catch {}
              }
            }
          }
        } else {
          // Employee level - show documents
          const employeeId = pathParts[1];
          if (items.length > 0) showSpinner = false;
          if (showSpinner) setLoading(true);
          const { documents, error } = await DocumentService.getDocumentsForEmployee(employeeId);
          if (error) {
            toast.error(error);
            return;
          }

          const documentItems: FolderItem[] = documents.map(doc => ({
            name: doc.file_name,
            type: 'document',
            path: doc.file_path,
            file_size: doc.file_size,
            file_url: doc.file_url,
            document_id: doc.id,
            file_type: doc.file_type
          }));
          if (latestRequestIdRef.current === requestId) {
            setItems(documentItems);
          }
        }
      }
    } catch (error) {
      log.error('Error loading items:', error);
      toast.error('Failed to load documents');
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [currentPath, items.length]);

  const handleItemClick = useCallback((item: FolderItem) => {
    if (item.type === 'folder') {
      // Proactively close existing preview window to avoid blockers when switching folders
      try {
        if (viewerRef.current && !viewerRef.current.closed) {
          viewerRef.current.close();
        }
      } catch {}
      viewerRef.current = null;
      shouldRefreshOnFocusRef.current = false;
      shouldBypassCacheRef.current = true;
      setCurrentPath(item.path);
      // cancel inflight and clear selections
      latestRequestIdRef.current++;
      setSelectedIds(new Set());
    }
    // Document clicks are handled by action buttons
  }, []);

  const toggleSelect = useCallback((docId?: string) => {
    if (!docId) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId); else next.add(docId);
      return next;
    });
  }, []);

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
      // Ensure next navigation bypasses cache to avoid stale folder lists
      shouldBypassCacheRef.current = true;
    } catch (e) {
      log.error('Bulk download error', e);
      toast.error('Failed to prepare zip');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const selectAllInView = () => {
    const next = new Set<string>();
    items.forEach(i => { if (i.type === 'document' && i.document_id) next.add(i.document_id); });
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Initial and path change load
  useEffect(() => {
    loadItems();
  }, [currentPath, loadItems]);

  // After viewing a document in a separate window/tab, refresh when user returns
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => {
      if (shouldRefreshOnFocusRef.current) {
        shouldRefreshOnFocusRef.current = false;
        loadItems();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && shouldRefreshOnFocusRef.current) {
        shouldRefreshOnFocusRef.current = false;
        loadItems();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadItems]);

  const handleDocumentAction = useCallback(async (action: 'view' | 'download' | 'delete', item: FolderItem) => {
    if (!item.document_id) {
      toast.error('Document ID not available');
      return;
    }

    setLoadingDocumentId(item.document_id);

    try {
      switch (action) {
        case 'view':
          if (item.document_id) {
            // Ensure a persistent named window is opened synchronously to keep user gesture
            if (typeof window !== 'undefined') {
              if (!viewerRef.current || viewerRef.current.closed) {
                viewerRef.current = window.open('', 'docview');
              } else {
                try { viewerRef.current.focus(); } catch {}
              }
            }
            try {
              log.info('🔍 Attempting to get presigned URL for document:', item.document_id);
              // Mark that we should refresh when user returns to this tab
              shouldRefreshOnFocusRef.current = true;
              const { data: url, error } = await DocumentService.getDocumentPresignedUrl(item.document_id);
              const target = viewerRef.current;
              if (error) {
                log.error('❌ Presigned URL error:', error);
                if (item.file_url) {
                  log.info('🔄 Using fallback file_url:', item.file_url);
                  if (target && !target.closed) target.location.href = item.file_url; else window.open(item.file_url, 'docview');
                } else {
                  if (target && !target.closed) target.close();
                  toast.error('Document URL not available');
                }
              } else if (url) {
                log.info('✅ Opening presigned URL:', url);
                if (target && !target.closed) {
                  try {
                    target.location.href = url;
                  } catch (navErr) {
                    window.open(url, '_blank');
                  }
                } else {
                  const w = window.open(url, 'docview');
                  if (!w) {
                    window.location.href = url;
                  } else {
                    viewerRef.current = w;
                  }
                }
              } else {
                log.error('❌ No presigned URL returned');
                if (target && !target.closed) target.close();
                toast.error('Failed to open document');
              }
            } catch (err) {
              log.error('❌ Error opening document:', err);
              if (viewerRef.current && !viewerRef.current.closed) viewerRef.current.close();
              toast.error('Failed to open document');
            }
          } else {
            toast.error('Document ID not available');
          }
          break;
        case 'download':
          if (item.document_id) {
            log.info('🔍 Attempting to get download URL for document:', item.document_id);
            const { downloadUrl, error } = await DocumentService.downloadDocument(item.document_id);
            if (error) {
              log.error('❌ Download URL error:', error);
              // Fallback to stored file_url
              if (item.file_url) {
                log.info('🔄 Using fallback file_url for download:', item.file_url);
                const link = document.createElement('a');
                link.href = item.file_url;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                toast.error('Document URL not available');
              }
            } else if (downloadUrl) {
              log.info('✅ Downloading with URL:', downloadUrl);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = item.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              // Invalidate caches after a download to avoid stale states
              shouldBypassCacheRef.current = true;
            } else {
              log.error('❌ No download URL returned');
              // Fallback to stored file_url
              if (item.file_url) {
                log.info('🔄 Using fallback file_url for download:', item.file_url);
                const link = document.createElement('a');
                link.href = item.file_url;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                toast.error('Document URL not available');
              }
            }
          } else {
            toast.error('Document ID not available');
          }
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
            const { error } = await DocumentService.deleteDocument(item.document_id);
            if (error) {
              toast.error(error);
            } else {
              toast.success('Document deleted successfully');
              loadItems(); // Refresh the list
            }
          }
          break;
      }
    } catch (error) {
      log.error('Error handling document action:', error);
      toast.error('Failed to perform action');
    } finally {
      setLoadingDocumentId(null);
    }
  }, [loadItems]);

  const handleBackClick = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      // Go back to company level
      setCurrentPath(`/${pathParts[0]}`);
      shouldBypassCacheRef.current = true;
      setSelectedIds(new Set());
    } else if (pathParts.length === 1) {
      // Go back to root
      setCurrentPath('/');
      shouldBypassCacheRef.current = true;
      setSelectedIds(new Set());
    }
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', path: '/' }];
    
    let currentPathBuilder = '';
    parts.forEach((part, index) => {
      currentPathBuilder += `/${part}`;
      breadcrumbs.push({
        name: part,
        path: currentPathBuilder
      });
    });
    
    return breadcrumbs;
  };

  // Optimized filtering with memoization
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Apply type filter
    if (filterType === 'folders') {
      filtered = filtered.filter(item => item.type === 'folder');
    } else if (filterType === 'documents') {
      filtered = filtered.filter(item => item.type === 'document');
    }

    return filtered;
  }, [items, debouncedSearchTerm, filterType]);

  // Optimized render function for virtual list
  const renderItem = useCallback((item: FolderItem, index: number) => (
    <DocumentCard
      key={item.path}
      item={item}
      onView={() => handleDocumentAction('view', item)}
      onDownload={() => handleDocumentAction('download', item)}
      onDelete={() => handleDocumentAction('delete', item)}
      onSelect={() => toggleSelect(item.document_id)}
      isSelected={!!(item.document_id && selectedIds.has(item.document_id))}
      loadingDocumentId={loadingDocumentId}
      onItemClick={() => handleItemClick(item)}
    />
  ), [handleDocumentAction, toggleSelect, selectedIds, loadingDocumentId, handleItemClick]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and organize employee documents with enhanced performance and optimized rendering.
          </p>
        </div>

        {/* Breadcrumbs - Mobile Optimized */}
        <Card className="p-4 mb-6">
          <nav className="flex items-center space-x-2 overflow-x-auto">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={breadcrumb.path} className="flex items-center flex-shrink-0">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />}
                <button
                  onClick={() => setCurrentPath(breadcrumb.path)}
                  className={`text-sm font-medium whitespace-nowrap ${
                    breadcrumb.path === currentPath
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {breadcrumb.name}
                </button>
              </div>
            ))}
          </nav>
        </Card>

        {/* Header with Search and Actions - Mobile Optimized */}
        <Card className="p-4 lg:p-6 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            {/* Action Buttons - Stacked on mobile */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {filterType !== 'all' && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Button>

              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              
              {currentPath !== '/' && items.some(i => i.type === 'document') && (
                <>
                  <Button
                    onClick={selectAllInView}
                    className="flex items-center space-x-2"
                    variant="outline"
                  >
                    <span className="hidden sm:inline">Select All</span>
                    <span className="sm:hidden">Select</span>
                  </Button>
                  <Button
                    onClick={clearSelection}
                    className="flex items-center space-x-2"
                    variant="outline"
                  >
                    <span className="hidden sm:inline">Clear</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                </>
              )}
              
              {currentPath !== '/' && items.some(i => i.type === 'document') && (
                <Button
                  onClick={downloadSelectedAsZip}
                  disabled={selectedIds.size === 0 || isBulkDownloading}
                  className="flex items-center space-x-2"
                >
                  {isBulkDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Download Selected</span>
                  <span className="sm:hidden">Download</span>
                </Button>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Filter Documents</h3>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setFilterType('all')} 
                      variant={filterType === 'all' ? 'primary' : 'ghost'} 
                      size="sm"
                    >
                      All
                    </Button>
                    <Button 
                      onClick={() => setFilterType('folders')} 
                      variant={filterType === 'folders' ? 'primary' : 'ghost'} 
                      size="sm"
                    >
                      Folders
                    </Button>
                    <Button 
                      onClick={() => setFilterType('documents')} 
                      variant={filterType === 'documents' ? 'primary' : 'ghost'} 
                      size="sm"
                    >
                      Documents
                    </Button>
                    <Button
                      onClick={() => setShowFilters(false)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Content - Optimized with Virtual Scrolling for Large Lists */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <DocumentSkeleton key={i} />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">
                  {searchTerm ? 'No documents found matching your search.' : 'No documents found in this location.'}
                </p>
              </div>
            </Card>
          ) : (
            <div>
              {/* Use virtual scrolling for large lists (more than 50 items) */}
              {filteredItems.length > 50 ? (
                <VirtualList
                  items={filteredItems}
                  renderItem={renderItem}
                  itemHeight={80}
                  containerHeight={isMobile ? 400 : 600}
                />
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item, index) => renderItem(item, index))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={loadItems}
          currentPath={currentPath}
        />
      </div>
    </Layout>
  );
}

