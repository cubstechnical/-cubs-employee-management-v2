'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';

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
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Search, Folder, File, ChevronRight, Download, Eye, Trash2, FileText, Image, FileVideo, FileAudio, Archive, Loader2, X } from 'lucide-react';
import { saveAs } from 'file-saver';
import { DocumentService } from '@/lib/services/documents';
import UploadModal from '@/components/documents/UploadModal';
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
            <Folder className="w-8 h-8 text-blue-500" />
          ) : (
            getFileIcon(item.name, item.file_type)
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {item.name}
            </h3>
            {item.type === 'document' && item.file_size && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(item.file_size)}
              </p>
            )}
            {item.type === 'folder' && item.documentCount !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.documentCount} documents
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
  const [items, setItems] = useState<FolderItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<{
    companies: boolean;
    employees: boolean;  
    documents: boolean;
  }>({
    companies: false,
    employees: false,
    documents: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FolderItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loadingDocumentId, setLoadingDocumentId] = useState<string | null>(null);
  const shouldBypassCacheRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const activeRequestsRef = useRef<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  // Clear cache only on initial app load, not on every navigation
  useEffect(() => {
    if (!hasClearedCacheRef.current && currentPath === '/') {
      DocumentService.clearCache();
      hasClearedCacheRef.current = true;
      console.log('🧹 Cleared document cache on initial load');
    }
  }, []); // Remove currentPath dependency to prevent clearing on navigation

  const loadItems = useCallback(async () => {
    const startTime = performance.now();
    const requestId = ++latestRequestIdRef.current;
    const requestKey = `load-${currentPath}`;
    
    // Simple request deduplication - only skip if exact same request
    if (activeRequestsRef.current.has(requestKey)) {
      console.log('🚫 Skipping duplicate request for:', currentPath, 'Request ID:', requestId);
      return;
    }
    
    activeRequestsRef.current.add(requestKey);
      
    console.log('🔄 Starting to load items for path:', currentPath, 'Request ID:', requestId);
    
    // For root path, load real company folders
      if (currentPath === '/') {
      console.log('🔄 Loading real company folders for root path');
      setLoadingStates(prev => ({ ...prev, companies: true }));
      
      try {
        // Use cache unless explicitly bypassed
        const { folders, error } = await DocumentService.getDocumentFolders(!shouldBypassCacheRef.current);
        if (error) {
          console.error('❌ Error loading document folders:', error);
          toast.error(error);
          setLoading(false);
          return;
        }

        const folderItems: FolderItem[] = folders
          .filter((folder: any) => folder.type === 'company')
          .map((folder: any) => ({
            name: folder.name,
            type: 'folder',
            path: `/${folder.companyName}`
          }));
        
          setItems(folderItems);
        setLoadingStates(prev => ({ ...prev, companies: false }));
        setLoading(false); // Also set the main loading state for UI compatibility
        console.log(`✅ Loaded ${folderItems.length} real company folders ${!shouldBypassCacheRef.current ? '(cached)' : '(fresh)'}`);
      } catch (error) {
        console.error('❌ Error in loadItems:', error);
        setLoadingStates(prev => ({ ...prev, companies: false }));
        setLoading(false); // Also set the main loading state for UI compatibility
      }
      return;
    }
    
    // Set loading state for non-root paths
    setLoading(true);
    
    try {
      console.log('🔄 Loading items for path:', currentPath);
        const pathParts = currentPath.split('/').filter(Boolean);
        const companyName = pathParts[0];
        
        if (pathParts.length === 1) {
          // Company level - show employee folders or documents
          if (companyName === 'Company Documents') {
            // For Company Documents, show documents directly
            console.log('📁 Loading Company Documents...');
            const { documents, error } = await DocumentService.getCompanyDocuments('Company Documents');
            console.log('📁 Company Documents result:', { count: documents?.length, error });
            if (error) {
              toast.error(error);
            setLoading(false);
              return;
            }

          const documentItems: FolderItem[] = documents.map((doc: Document) => ({
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
              setLoading(false); // Also set the main loading state for UI compatibility
            }
                     } else {
             // For other companies, show employee folders
             console.log('🏢 Loading employee folders for company:', companyName);
             setLoadingStates(prev => ({ ...prev, employees: true }));
                          const { folders, error } = await DocumentService.getEmployeeFolders(companyName, !shouldBypassCacheRef.current);
             console.log('📁 Received folders:', folders, 'Error:', error);
             if (error) {
               toast.error(error);
            setLoadingStates(prev => ({ ...prev, employees: false }));
            setLoading(false); // Also set the main loading state for UI compatibility
               return;
             }

                           const folderItems: FolderItem[] = folders
            .filter((folder: any) => folder.type === 'employee')
            .map((folder: any) => ({
                  name: folder.employeeName || folder.name,
                  type: 'folder',
                  employeeId: folder.employeeId,
                  path: `${currentPath}/${folder.employeeId}`,
                  documentCount: folder.documentCount
                }));
             console.log(`📁 Created folder items: ${folderItems.length} ${!shouldBypassCacheRef.current ? '(cached)' : '(fresh)'}`);
          
            if (latestRequestIdRef.current === requestId) {
              setItems(folderItems);
              setLoadingStates(prev => ({ ...prev, employees: false }));
              setLoading(false); // Also set the main loading state for UI compatibility
            }
          }
                 } else {
           // Employee level - show documents
           const employeeId = pathParts[1];
           console.log('👤 Loading documents for employee:', employeeId, 'Type:', typeof employeeId);
           setLoadingStates(prev => ({ ...prev, documents: true }));
        
        try {
                      const { documents, error } = await DocumentService.getDocumentsForEmployee(employeeId);
           console.log('📄 Received documents for employee:', employeeId, 'Count:', documents?.length, 'Error:', error);
          
           if (error) {
            console.error('❌ Error loading employee documents:', error);
            toast.error(`Failed to load documents: ${error}`);
            setLoadingStates(prev => ({ ...prev, documents: false }));
            setLoading(false); // Also set the main loading state for UI compatibility
             return;
           }

          if (!documents || documents.length === 0) {
            console.warn('⚠️ No documents found for employee:', employeeId);
            toast.error(`No documents found for employee ${employeeId}`);
            setItems([]);
            setLoadingStates(prev => ({ ...prev, documents: false }));
            setLoading(false); // Also set the main loading state for UI compatibility
             return;
           }

          const documentItems: FolderItem[] = documents.map((doc: Document) => ({
             name: doc.file_name,
             type: 'document',
             path: doc.file_path,
             file_size: doc.file_size,
             file_url: doc.file_url,
             document_id: doc.id,
             file_type: doc.file_type
           }));
           console.log('📄 Created document items:', documentItems.length);
          
          if (latestRequestIdRef.current === requestId) {
            setItems(documentItems);
            setLoadingStates(prev => ({ ...prev, documents: false }));
            setLoading(false); // Also set the main loading state for UI compatibility
          }
        } catch (error) {
          console.error('❌ Exception loading employee documents:', error);
          toast.error('Failed to load employee documents');
          setLoadingStates(prev => ({ ...prev, documents: false }));
          setLoading(false); // Also set the main loading state for UI compatibility
        }
      }
      
      // Reset all loading states
      setLoadingStates({
        companies: false,
        employees: false,
        documents: false
      });
      setLoading(false); // Also set the main loading state for UI compatibility
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load documents');
      // Reset all loading states on error
      setLoadingStates({
        companies: false,
        employees: false,
        documents: false
      });
      setLoading(false); // Also set the main loading state for UI compatibility
    } finally {
      // Always remove from active requests when done
      activeRequestsRef.current.delete(requestKey);
    }
  }, [currentPath]);

  // Background preloading for better UX
  const preloadCompanyData = useCallback(async (companyName: string) => {
    // Preload employee folders in background
    setTimeout(async () => {
      try {
        await DocumentService.getEmployeeFolders(companyName);
        console.log('⚡ Preloaded employees for:', companyName);
      } catch (error) {
        console.log('❌ Preload failed for:', companyName);
      }
    }, 1000); // Delay to not interfere with main loading
  }, []);

  const handleItemClick = (item: FolderItem) => {
    if (item.type === 'folder') {
      console.log('📁 Folder clicked:', item.name, 'Path:', item.path);
      shouldBypassCacheRef.current = true;
      setCurrentPath(item.path);
      // cancel inflight and clear selections
      latestRequestIdRef.current++;
      setSelectedIds(new Set());
      
      // Trigger background preloading for company folders
      if (item.path.split('/').length === 2) { // Company level
        const companyName = item.name;
        preloadCompanyData(companyName);
      }
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
    items.forEach((i: FolderItem) => { if (i.type === 'document' && i.document_id) next.add(i.document_id); });
    setSelectedIds(next);
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Debounced loading to prevent rapid navigation issues
  const debouncedLoadItems = useCallback(
    debounce(loadItems, 300), // 300ms debounce
    [loadItems]
  );

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchValue: string) => {
      if (!searchValue || searchValue.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        console.log(`🔍 Performing document search for: "${searchValue}"`);
        
        // Use the new search function from DocumentService
        const { documents, error } = await DocumentService.searchDocuments(searchValue);
        
        if (error) {
          console.error('❌ Search error:', error);
          toast.error('Search failed: ' + error);
          setSearchResults([]);
          return;
        }

        if (!documents || documents.length === 0) {
          console.log('❌ No documents found matching search term');
          setSearchResults([]);
          return;
        }

        // Convert search results to FolderItem format
        const searchItems: FolderItem[] = documents.map((doc: any) => ({
          name: doc.file_name,
          type: 'document',
          path: doc.file_path,
          file_size: doc.file_size,
          file_url: doc.file_url,
          document_id: doc.id,
          file_type: doc.mime_type,
          employeeId: doc.employee_id,
          employeeName: doc.employee_name,
          companyName: doc.company_name
        }));

        console.log(`✅ Found ${searchItems.length} documents matching search`);
        setSearchResults(searchItems);
      } catch (error) {
        console.error('❌ Error in search:', error);
        toast.error('Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300), // 300ms debounce
    []
  );

  // Single useEffect for loading items
  useEffect(() => {
    console.log('🔄 useEffect triggered for path:', currentPath);
    debouncedLoadItems();
  }, [currentPath, debouncedLoadItems]);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearch]);



  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    shouldBypassCacheRef.current = true;
        loadItems();
  };

  const handleDocumentView = async (item: FolderItem) => {
    if (!item.document_id) return;

    try {
    setLoadingDocumentId(item.document_id);

      console.log('👁️ Opening document in new tab:', item.document_id);
      
      // Open document in new tab (not window) - this allows multiple documents to be open
      const newTab = window.open(
        `/api/documents/${item.document_id}/view`,
        '_blank'  // Remove window features to open in tab instead of popup window
      );
      
      if (newTab) {
        // Focus the new tab
        newTab.focus();
        console.log('✅ Document opened in new tab');
        toast.success(`Opened ${item.name} in new tab`);
              } else {
        console.warn('⚠️ Failed to open document tab (popup blocked?)');
        toast.error('Failed to open document. Please check popup settings and try again.');
      }
    } catch (error) {
      console.error('❌ Error opening document viewer:', error);
      toast.error('Failed to open document viewer');
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
      shouldBypassCacheRef.current = true;
      loadItems();
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
      shouldBypassCacheRef.current = true;
      setSelectedIds(new Set());
  };

  const breadcrumbParts = currentPath.split('/').filter(Boolean);
  
  // Show search results when searching, otherwise show regular filtered items
  const filteredItems = searchTerm.trim() 
    ? searchResults 
    : items.filter((item: FolderItem) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage employee documents and files</p>
        </div>

          <div className="flex flex-col sm:flex-row gap-3">
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
          <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents by name, employee, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}
            </div>
            
          {/* Quick Back to Root Button */}
          {currentPath !== '/' && (
            <div className="mb-4">
              <button
                onClick={() => {
                  console.log('🔄 "Back to Companies" button clicked - navigating to root');
                  // Clear any existing requests to allow navigation to proceed
                  activeRequestsRef.current.clear();
                  setCurrentPath('/');
                  shouldBypassCacheRef.current = false; // Use cache for faster loading
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
            <nav className="flex items-center space-x-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Back Button */}
              <button
                onClick={() => {
                  const pathParts = currentPath.split('/').filter(Boolean);
                  if (pathParts.length > 1) {
                    // Go back to company level
                    const companyPath = '/' + pathParts[0];
                    setCurrentPath(companyPath);
                    shouldBypassCacheRef.current = false; // Use cache for faster loading
                    setSelectedIds(new Set());
                  } else {
                    // Go back to root
                    setCurrentPath('/');
                    shouldBypassCacheRef.current = false; // Use cache for faster loading
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
                    shouldBypassCacheRef.current = false; // Use cache for faster loading
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
                        shouldBypassCacheRef.current = index === 0 ? false : true; // Use cache for company level
                        setSelectedIds(new Set());
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline max-w-32 truncate font-medium"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                <DocumentSkeleton key={i} />
              ))}
            </div>
              </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm.trim() ? 'No matching documents found' : 'No documents found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm.trim() 
                  ? `No documents found matching "${searchTerm}". Try searching by employee name, file name, or company.` 
                  : 'Upload some documents to get started'
                }
              </p>
            </div>
                   ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadComplete={handleUploadComplete}
          currentPath={currentPath}
        />
      </div>
    </Layout>
  );
}

export default function DocumentsOptimized() {
  return (
    <Suspense fallback={<DocumentSkeleton />}>
      <DocumentsContent />
    </Suspense>
  );
}