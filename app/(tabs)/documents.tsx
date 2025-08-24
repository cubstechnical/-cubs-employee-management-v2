'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Search, Folder, File, ChevronRight, Download, Eye, Trash2, FileText, Image, FileVideo, FileAudio, Archive } from 'lucide-react';
import { saveAs } from 'file-saver';
import { DocumentService } from '@/lib/services/documents';
import UploadModal from '@/components/documents/UploadModal';
import toast from 'react-hot-toast';
import { VirtualGrid } from '@/components/ui/VirtualGrid';

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

export default function Documents() {
  const [items, setItems] = useState<FolderItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const viewerRef = useRef<Window | null>(null);
  const shouldRefreshOnFocusRef = useRef(false);
  const shouldBypassCacheRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const localCacheTTLms = 5 * 60 * 1000; // 5 minutes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [docTypeFilter, setDocTypeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasClearedCacheRef = useRef(false);

  // Clear cache on initial load to ensure fresh employee names
  useEffect(() => {
    if (!hasClearedCacheRef.current) {
      DocumentService.clearCache();
      hasClearedCacheRef.current = true;
      console.log('🧹 Cleared document cache on initial load');
    }
  }, []);

  // Initial and path change load
  // (moved below) effects will run after loadItems is defined

  // (moved below) focus/visibility refresh effect will be defined after loadItems

  const loadItems = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    try {
      console.log('🔄 Loading items for path:', currentPath);
      let showSpinner = true;
      
      if (currentPath === '/') {
        // Try local cache first for root folders
        const cacheKey = 'docs:root-folders';
        if (typeof window !== 'undefined' && !shouldBypassCacheRef.current) {
          const cached = window.localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as { items: FolderItem[]; ts: number };
              if (Date.now() - parsed.ts < localCacheTTLms) {
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
             const { documents, error } = await DocumentService.getCompanyDocuments(); // No company name to get all company documents
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
                  if (Date.now() - parsed.ts < localCacheTTLms) {
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
            // Prefetch presigned URLs in background for faster first open
            try {
              const filePaths = documents.map(d => d.file_path).filter(Boolean).slice(0, 50);
              if (filePaths.length > 0) {
                fetch('/api/documents/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filePaths })
                }).catch(() => {});
                // Also request a prefix token for this employee to enable fast streaming
                const folderPrefix = `EMP_${employeeId}/`;
                fetch('/api/documents/preview', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filePath: folderPrefix })
                }).catch(() => {});
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load documents');
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [currentPath]);

  const handleItemClick = (item: FolderItem) => {
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
  };

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
      // Ensure next navigation bypasses cache to avoid stale folder lists
      shouldBypassCacheRef.current = true;
    } catch (e) {
      console.error('Bulk download error', e);
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

  // measure container width for virtualization
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      setContainerWidth(containerRef.current.clientWidth);
    };
    handleResize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const executeSearch = useCallback(async () => {
    try {
      setIsSearching(true);
      const company = currentPath.split('/').filter(Boolean)[0] || '';
      const query = new URLSearchParams();
      if (searchTerm) query.set('q', searchTerm);
      if (docTypeFilter) query.set('type', docTypeFilter);
      if (fromDate) query.set('from', new Date(fromDate).toISOString());
      if (toDate) query.set('to', new Date(toDate).toISOString());
      if (company && company !== 'Company Documents') query.set('company', company);
      const res = await fetch(`/api/documents/search?${query.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      const documentItems: FolderItem[] = (json.results || []).map((doc: any) => ({
        name: doc.file_name,
        type: 'document',
        path: doc.file_path,
        file_size: doc.file_size,
        file_url: doc.file_url,
        document_id: doc.id,
        file_type: doc.file_type
      }));
      setItems(documentItems);
    } catch (e) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, docTypeFilter, fromDate, toDate, currentPath]);

  // Initial and path change load (after loadItems is declared)
  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

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

  const handleDocumentAction = async (action: 'view' | 'download' | 'delete', item: FolderItem) => {
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
              console.log('🔍 Attempting to get presigned URL for document:', item.document_id);
              // Mark that we should refresh when user returns to this tab
              shouldRefreshOnFocusRef.current = true;
              const { url, error } = await DocumentService.getDocumentPresignedUrl(item.document_id);
              const target = viewerRef.current;
              if (error) {
                console.error('❌ Presigned URL error:', error);
                if (item.file_url) {
                  console.log('🔄 Using fallback file_url:', item.file_url);
                  if (target && !target.closed) target.location.href = item.file_url; else window.open(item.file_url, 'docview');
                } else {
                  if (target && !target.closed) target.close();
                  toast.error('Document URL not available');
                }
              } else if (url) {
                console.log('✅ Opening presigned URL:', url);
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
                console.error('❌ No presigned URL returned');
                // Try prefix token stream if available via service helper
                try {
                  const streamResp = await DocumentService.getStreamUrlByPath(item.path, item.path.split('/')[1]);
                  if (streamResp) {
                    if (target && !target.closed) target.location.href = streamResp; else window.open(streamResp, 'docview');
                  } else {
                    if (target && !target.closed) target.close();
                    toast.error('Failed to open document');
                  }
                } catch {
                  if (target && !target.closed) target.close();
                  toast.error('Failed to open document');
                }
              }
            } catch (err) {
              console.error('❌ Error opening document:', err);
              if (viewerRef.current && !viewerRef.current.closed) viewerRef.current.close();
              toast.error('Failed to open document');
            }
          } else {
            toast.error('Document ID not available');
          }
          break;
        case 'download':
          if (item.document_id) {
            console.log('🔍 Attempting to get download URL for document:', item.document_id);
            const { downloadUrl, error } = await DocumentService.downloadDocument(item.document_id);
            if (error) {
              console.error('❌ Download URL error:', error);
              // Fallback to stored file_url
              if (item.file_url) {
                console.log('🔄 Using fallback file_url for download:', item.file_url);
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
              console.log('✅ Downloading with URL:', downloadUrl);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = item.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              // Invalidate caches after a download to avoid stale states
              shouldBypassCacheRef.current = true;
            } else {
              console.error('❌ No download URL returned');
              // Fallback to stored file_url
              if (item.file_url) {
                console.log('🔄 Using fallback file_url for download:', item.file_url);
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
      console.error('Error handling document action:', error);
      toast.error('Failed to perform action');
    } finally {
      setLoadingDocumentId(null);
    }
  };

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

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType?: string, size: 'sm' | 'md' = 'md') => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileType?.toLowerCase();
    
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-12 h-12 mb-2'
    };
    
    // PDF files
    if (extension === 'pdf' || mimeType?.includes('pdf')) {
      return <FileText className={`${sizeClasses[size]} text-red-500`} />;
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '') || 
        mimeType?.includes('image')) {
      return <Image className={`${sizeClasses[size]} text-green-500`} />;
    }
    
    // Video files
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '') || 
        mimeType?.includes('video')) {
      return <FileVideo className={`${sizeClasses[size]} text-purple-500`} />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '') || 
        mimeType?.includes('audio')) {
      return <FileAudio className={`${sizeClasses[size]} text-blue-500`} />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '') || 
        mimeType?.includes('archive') || mimeType?.includes('compressed')) {
      return <Archive className={`${sizeClasses[size]} text-orange-500`} />;
    }
    
    // Word documents
    if (['doc', 'docx'].includes(extension || '') || 
        mimeType?.includes('word') || mimeType?.includes('document')) {
      return <FileText className={`${sizeClasses[size]} text-blue-600`} />;
    }
    
    // Excel files
    if (['xls', 'xlsx'].includes(extension || '') || 
        mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <FileText className={`${sizeClasses[size]} text-green-600`} />;
    }
    
    // Default file icon
    return <File className={`${sizeClasses[size]} text-gray-500`} />;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleItemClick(item)}
          className="group relative cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200"
        >
          <div className="flex flex-col items-center text-center">
            {item.type === 'folder' ? (
              <Folder className="w-12 h-12 text-blue-500 mb-2" />
            ) : (
              getFileIcon(item.name, item.file_type)
            )}
            <h3 className="font-medium text-gray-900 dark:text-white text-sm w-full break-words">
              {item.name}
              </h3>
            {item.type === 'document' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatFileSize(item.file_size || 0)}
              </p>
            )}
          </div>
          
          {/* Selection checkbox for documents */}
          {item.type === 'document' && (
            <input
              type="checkbox"
              checked={!!(item.document_id && selectedIds.has(item.document_id))}
              onChange={(e) => { e.stopPropagation(); toggleSelect(item.document_id); }}
              className="absolute left-2 top-2 w-4 h-4"
              title="Select"
            />
          )}

          {/* Document action buttons */}
          {item.type === 'document' && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocumentAction('view', item);
                  }}
                  disabled={loadingDocumentId === item.document_id}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View"
                >
                  {loadingDocumentId === item.document_id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocumentAction('download', item);
                  }}
                  disabled={loadingDocumentId === item.document_id}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download"
                >
                  {loadingDocumentId === item.document_id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocumentAction('delete', item);
                  }}
                  disabled={loadingDocumentId === item.document_id}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  {loadingDocumentId === item.document_id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
          </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleItemClick(item)}
          className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200"
        >
          {item.type === 'folder' ? (
            <Folder className="w-6 h-6 text-blue-500 mr-3" />
          ) : (
            getFileIcon(item.name, item.file_type, 'sm')
          )}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white break-words">
              {item.name}
            </h3>
            {item.type === 'document' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(item.file_size || 0)}
              </p>
            )}
          </div>
          
          {/* Document action buttons */}
          {item.type === 'document' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentAction('view', item);
                }}
                disabled={loadingDocumentId === item.document_id}
                className="p-1 text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="View"
              >
                {loadingDocumentId === item.document_id ? (
                  <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentAction('download', item);
                }}
                disabled={loadingDocumentId === item.document_id}
                className="p-1 text-green-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download"
              >
                {loadingDocumentId === item.document_id ? (
                  <div className="w-4 h-4 border border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDocumentAction('delete', item);
                }}
                disabled={loadingDocumentId === item.document_id}
                className="p-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete"
              >
                {loadingDocumentId === item.document_id ? (
                  <div className="w-4 h-4 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and organize employee documents.
          </p>
        </div>

        {/* Breadcrumbs */}
        <Card className="p-4 mb-6">
          <nav className="flex items-center space-x-2">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={breadcrumb.path} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
                <button
                  onClick={() => setCurrentPath(breadcrumb.path)}
                  className={`text-sm font-medium ${
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

        {/* Header with Search and Actions */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
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
            
            <div className="flex items-center flex-wrap gap-2 md:space-x-4">
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  } rounded-l-lg`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-current"></div>
                    <div className="w-1.5 h-1.5 bg-current"></div>
                    <div className="w-1.5 h-1.5 bg-current"></div>
                    <div className="w-1.5 h-1.5 bg-current"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  } rounded-r-lg`}
                >
                  <div className="w-4 h-4 space-y-0.5">
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                    <div className="w-full h-0.5 bg-current"></div>
                  </div>
                </button>
              </div>
              
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Button>
              {currentPath !== '/' && items.some(i => i.type === 'document') && (
                <>
                  <Button
                    onClick={selectAllInView}
                    className="flex items-center space-x-2"
                  >
                    <span>Select All</span>
                  </Button>
                  <Button
                    onClick={clearSelection}
                    className="flex items-center space-x-2"
                    variant="outline"
                  >
                    <span>Clear</span>
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
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Selected</span>
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Content */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading documents...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No documents found matching your search.' : 'No documents found in this location.'}
                </p>
              </div>
            ) : (
            <div>
              {viewMode === 'grid' ? renderGridView() : renderListView()}
            </div>
            )}
        </Card>

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
