'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DocumentService } from '@/lib/services/documents';
import { EdgeFunctionService } from '@/lib/services/edgeFunctions';
import { 
  Folder, 
  Search, 
  Upload, 
  MoreVertical,
  Copy,
  Scissors,
  FolderOpen,
  Trash2,
  ChevronRight,
  Home,
  FileText,
  Download,
  Eye,
  Building,
  User,
  FolderPlus,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  Grid,
  List
} from 'lucide-react';
import UploadModal from '@/components/documents/UploadModal';
import { DocumentGridSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

interface DocumentItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  modified: string;
  path: string;
  icon?: React.ReactNode;
  documentCount?: number;
  companyName?: string;
  employeeId?: string;
  employeeName?: string;
  fileUrl?: string;
  fileType?: string;
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

export default function Documents() {
  return (
    <ProtectedRoute>
      <DocumentsContent />
    </ProtectedRoute>
  );
}

function DocumentsContent() {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { name: 'Documents', path: '/' }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('details');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced debounce search term with better performance
  const [isSearching, setIsSearching] = useState(false);
  const [originalItems, setOriginalItems] = useState<DocumentItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 50); // Further reduced to 50ms for faster response

    setIsSearching(true);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load items when path changes
  useEffect(() => {
    loadItems();
  }, [currentPath]);

  // Filter items when search term changes - OPTIMIZED
  useEffect(() => {
    if (!debouncedSearchTerm) {
      // If no search term, restore original items
      setItems(originalItems);
      return;
    }
    
    // Filter the original items based on search term
    const filtered = originalItems.filter(item => 
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      item.employeeName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
    
    setItems(filtered);
  }, [debouncedSearchTerm, originalItems]);

  const loadItems = useCallback(async () => {
    const startTime = performance.now();
    try {
      setLoading(true);
      setError(null);
      
      // Remove artificial delay for faster loading
      // await new Promise(resolve => setTimeout(resolve, 100));
      
      if (currentPath === '/') {
        // Root level - show company folders and Company Documents
        const { folders: documentFolders, error } = await DocumentService.getDocumentFolders();
        
        if (error) {
          console.error('Error loading document folders:', error);
          setError('Failed to load document folders');
          setItems([]);
          return;
        }

        const rootItems: DocumentItem[] = documentFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          modified: folder.lastModified,
          path: folder.path,
          icon: <Folder className="w-5 h-5 text-yellow-600" />,
          documentCount: folder.documentCount,
          companyName: folder.companyName
        }));

        setOriginalItems(rootItems);
        setItems(rootItems);
        
        const endTime = performance.now();
        console.log(`⚡ Documents loaded in ${(endTime - startTime).toFixed(2)}ms`);
      } else if (currentPath.startsWith('/company/')) {
        // Company level - show employees with real document data
        const companyName = currentPath.split('/').pop() || '';
        const { folders: employeeFolders, error } = await DocumentService.getEmployeeFolders(companyName);
        
        if (error) {
          console.error('Error loading employee folders:', error);
          setError('Failed to load employee folders');
          setItems([]);
          return;
        }

        const employeeItems: DocumentItem[] = employeeFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          modified: folder.lastModified,
          path: folder.path,
          icon: <User className="w-5 h-5 text-purple-600" />,
          documentCount: folder.documentCount,
          companyName: folder.companyName,
          employeeId: folder.employeeId,
          employeeName: folder.employeeName
        }));

        setOriginalItems(employeeItems);
        setItems(employeeItems);
      } else if (currentPath.startsWith('/company-documents')) {
        // Company Documents level - show actual documents (not subfolders)
        const { documents, error } = await DocumentService.getEmployeeDocuments('company-documents', 'company');
        
        if (error) {
          console.error('Error loading company documents:', error);
          setError('Failed to load company documents');
          setItems([]);
          return;
        }

        const documentItems: DocumentItem[] = documents.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          type: 'file' as const,
          modified: doc.uploaded_at,
          path: `/company-documents/document/${doc.id}`,
          icon: getFileIcon(doc.file_type),
          documentCount: 0,
          companyName: 'company-documents',
          employeeId: 'company',
          employeeName: undefined,
          fileUrl: doc.file_url,
          fileType: doc.file_type
        }));

        setOriginalItems(documentItems);
        setItems(documentItems);
      } else if (currentPath.includes('/employee/')) {
        // Employee level - show actual documents
        const pathParts = currentPath.split('/');
        const companyName = pathParts[2];
        const employeeId = pathParts[4];
        
        const { documents, error } = await DocumentService.getEmployeeDocuments(companyName, employeeId);

        if (error) {
          console.error('Error loading documents:', error);
          setError('Failed to load documents');
          setItems([]);
          return;
        }

        const documentItems: DocumentItem[] = documents.map(doc => ({
          id: doc.id,
          name: doc.file_name,
          type: 'file' as const,
          size: formatFileSize(doc.file_size),
          modified: doc.uploaded_at,
          path: doc.file_path,
          icon: getFileIcon(doc.file_type),
          fileUrl: doc.file_url,
          fileType: doc.file_type
        }));

        setItems(documentItems);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [currentPath, debouncedSearchTerm]);

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'tif':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
            <FileImage className="w-6 h-6 text-white" />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
        );
      case 'zip':
      case 'rar':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <FileArchive className="w-6 h-6 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-md">
            <File className="w-6 h-6 text-white" />
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleItemClick = (item: DocumentItem) => {
    if (item.type === 'folder') {
      const newPath = item.path;
      setCurrentPath(newPath);
      
      const newBreadcrumb: BreadcrumbItem = {
        name: item.name,
        path: newPath
      };
      setBreadcrumbs([...breadcrumbs, newBreadcrumb]);
      
      // The useEffect will automatically load items when currentPath changes
    } else {
      // Handle file click - open in new tab
      if (item.fileUrl) {
        window.open(item.fileUrl, '_blank');
      }
    }
  };

  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem) => {
    setCurrentPath(breadcrumb.path);
    const breadcrumbIndex = breadcrumbs.findIndex(b => b.path === breadcrumb.path);
    setBreadcrumbs(breadcrumbs.slice(0, breadcrumbIndex + 1));
    // The useEffect will automatically load items when currentPath changes
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleDownloadDocument = async (item: DocumentItem) => {
    if (!item.path || !item.name) {
      toast.error('Download URL not available');
      return;
    }

    try {
      // Use API route to get download URL
      const response = await fetch(`/api/documents/preview?filePath=${encodeURIComponent(item.path)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get download URL');
      }

      if (result.data.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  const handleDeleteDocument = async (item: DocumentItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      // Use API route to delete document
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: item.path,
          documentId: item.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document');
      }

      toast.success('Document deleted successfully');
      loadItems(); // Reload the list
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Documents
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and review employee documents</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setViewMode(viewMode === 'list' ? 'details' : 'list')}
              className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
            >
              {viewMode === 'list' ? 'Details' : 'List'} View
            </Button>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                    <option>All Types</option>
                    <option>Documents</option>
                    <option>Images</option>
                    <option>Videos</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                    <option>All Employees</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                  <Grid className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                  <List className="w-4 h-4" />
                </button>
                <Button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </Button>
              </div>
            </div>
          </div>

        {/* Breadcrumbs */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2 text-sm">
              <Home className="w-4 h-4 text-gray-400" />
          {breadcrumbs.map((breadcrumb, index) => (
                <div key={`breadcrumb-${index}-${breadcrumb.path}`} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                {breadcrumb.name}
              </button>
            </div>
          ))}
            </div>
        </div>

          {/* Windows Explorer Style Grid View */}
          <div className="overflow-auto">
                  {loading ? (
        <div className="p-6">
          <DocumentGridSkeleton count={8} />
                  </div>
      ) : (
              <div className="min-h-[500px] p-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Folder className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {debouncedSearchTerm ? 'No search results found' : 'No items found'}
                    </p>
                    {debouncedSearchTerm && (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {debouncedSearchTerm && (
                      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        Found {items.length} result{items.length !== 1 ? 's' : ''} for "{debouncedSearchTerm}"
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative flex flex-col items-center p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-700 ${
                          selectedItems.includes(item.id) 
                            ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-500 shadow-lg' 
                            : 'hover:border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl'
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleItemSelect(item.id);
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          />
                </div>
                
                        {/* Modern Folder/File Icon */}
                        <div className="mb-4 flex justify-center">
                          {item.type === 'folder' ? (
                            <div className="relative group">
                              {/* Modern gradient folder icon */}
                              <div className="w-20 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 dark:from-blue-600 dark:via-blue-700 dark:to-blue-800 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                                {/* Folder tab with gradient */}
                                <div className="w-14 h-3 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-t-lg mx-auto -mt-1 shadow-sm"></div>
                                {/* Folder content area */}
                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                  <Folder className="w-8 h-8 text-white drop-shadow-sm" />
                                </div>
                                {/* Shine effect */}
                                <div className="absolute top-1 left-1 w-3 h-3 bg-white bg-opacity-20 rounded-full"></div>
                </div>
              </div>
                          ) : (
                            <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
                              <div className="w-12 h-12 flex items-center justify-center">
                                {item.icon}
          </div>
            </div>
          )}
                        </div>

                        {/* Item Name */}
                        <div className="text-center w-full px-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white break-words leading-tight min-h-[3rem] flex items-center justify-center">
                            {item.name}
                          </h3>
                          
                        </div>

                        {/* File Actions (for files only) */}
                        {item.type === 'file' && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(item);
                              }}
                              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
            </button>
            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(item);
                              }}
                              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
            </button>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200 pointer-events-none"></div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{selectedItems.length} of {items.length} items selected</span>
                {selectedItems.length > 0 && (
            <button
                    onClick={() => setSelectedItems([])}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
                    Clear selection
            </button>
                )}
              </div>
              <span>{items.length} items</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentPath={currentPath}
        onUploadComplete={() => {
          loadItems();
          setIsUploadModalOpen(false);
        }}
      />
    </Layout>
  );
} 
