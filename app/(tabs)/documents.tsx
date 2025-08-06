'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DocumentService, Document } from '@/lib/services/documents';
import { EdgeFunctionService } from '@/lib/services/edgeFunctions';
import { 
  Folder, 
  Search, 
  Upload, 
  MoreVertical,
  Copy,
  Scissors,
  Trash2,
  ChevronRight,
  FileText,
  Download,
  Eye,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  Grid,
  List,
  Calendar
} from 'lucide-react';
import { DocumentGridSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/date';


// Import UploadModal directly to avoid chunk loading issues
import UploadModal from '@/components/documents/UploadModal';

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
  documentType?: string;
  employee_id?: string;
  file_size?: number;
  uploaded_at?: string;
  is_active?: boolean;
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'folders' | 'documents'>('folders');
  const [employeeNameMap, setEmployeeNameMap] = useState<Map<string, string>>(new Map());

  // Enhanced debounce search term with better performance
  const [isSearching, setIsSearching] = useState(false);

  // Memoized expensive calculations
  const filteredFolders = useMemo(() => {
    if (!debouncedSearchTerm) return folders;
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [folders, debouncedSearchTerm]);

  const filteredDocuments = useMemo(() => {
    if (!debouncedSearchTerm) return documents;
    return documents.filter(doc => 
      doc.file_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [documents, debouncedSearchTerm]);

  // Memoized breadcrumbs with employee name mapping
  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    const result = [{ name: 'Documents', path: '/' }];
    
    let currentPathBuilder = '';
    parts.forEach((part, index) => {
      currentPathBuilder += `/${part}`;
      // For employee IDs (usually the second part), show the employee name if available
      const displayName = (index === 1 && employeeNameMap.has(part)) 
        ? employeeNameMap.get(part) 
        : part;
      result.push({ name: displayName || part, path: currentPathBuilder });
    });
    
    return result;
  }, [currentPath, employeeNameMap]);

  // Handle URL path parameter for direct navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathParam = urlParams.get('path');
    
    if (pathParam) {
      setCurrentPath(pathParam);
      // Clear the URL parameter after setting the path
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('path');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    setIsSearching(true);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load items when path changes
  useEffect(() => {
    loadItems();
  }, [currentPath]);

  // Search functionality
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchDocuments();
    } else {
      loadItems();
    }
  }, [debouncedSearchTerm]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Clear cache to ensure fresh data with employee names and Company Documents fix
    DocumentService.clearCache();
    
    try {
      if (currentPath === '/') {
        // Load both company folders and company-wide documents
        
        // Load root level folders (Company Documents and All Companies)
        const { folders: allFolders, error: folderError } = await DocumentService.getDocumentFolders();
        
        if (folderError) {
          console.error('❌ Error loading folders:', folderError);
          setError(folderError);
          return;
        }

        // Show only company folders at root level (not employee folders or documents)
        const rootFolders = allFolders.filter(folder => folder.type === 'company');

        const folderItems: DocumentItem[] = rootFolders.map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'folder' as const,
          size: '', // No document count display
          modified: folder.lastModified,
          path: folder.path,
          icon: getFolderIcon(folder.name, true),
          documentCount: folder.documentCount,
          companyName: folder.companyName
        }));

        setFolders(folderItems);
        setDocuments([]); // No documents at root level - only folders
        setCurrentView('folders');
      } else {
        // Load documents for specific path (company or employee level)
        const pathParts = currentPath.split('/').filter(Boolean);
        console.log(`🔍 Loading items for path: ${currentPath} (parts: ${pathParts.join(', ')})`);
        
        if (pathParts.length === 1) {
          // Company level - show employee folders and company documents
          const companyName = pathParts[0];
          console.log(`🏢 Loading for company: ${companyName}`);
          
          // Special handling for Company Documents folder
          if (companyName === 'Company Documents' || companyName === 'EMP_COMPANY_DOCS') {
            console.log('📄 Loading Company Documents (all company documents)...');
            const { documents: companyDocs, error: docError } = await DocumentService.getCompanyDocuments();
            
            if (docError) {
              console.error('❌ Error loading company documents:', docError);
              setError(docError);
              return;
            }

            setDocuments(companyDocs || []);
            setFolders([]);
            setCurrentView('documents');
            console.log(`📄 Loaded ${companyDocs?.length || 0} company documents`);
          } else {
            // For other companies, show ONLY employee folders (no documents mixed in)
            const { folders: employeeFolders, error: folderError } = await DocumentService.getEmployeeFolders(companyName);
            if (folderError) {
              console.error('❌ Error loading employee folders:', folderError);
              setError(folderError);
              return;
            }

            console.log(`📁 Found ${employeeFolders?.length || 0} employee folders for ${companyName}`);

            // Create folder items for employees and update name mapping
            const folderItems: DocumentItem[] = (employeeFolders || []).map(folder => {
              console.log('🔍 Creating folder item:', {
                id: folder.id,
                name: folder.name,
                employeeId: folder.employeeId,
                employeeName: folder.employeeName
              });
              return {
                id: folder.id,
                name: folder.name,
                type: 'folder' as const,
                size: '', // Remove document count display
                modified: folder.lastModified,
                path: folder.path,
                icon: getFolderIcon(folder.name, false),
                documentCount: folder.documentCount,
                employeeId: folder.employeeId,
                employeeName: folder.employeeName
              };
            });

            // Update employee name mapping for breadcrumbs
            const newNameMap = new Map(employeeNameMap);
            employeeFolders?.forEach(folder => {
              if (folder.employeeId && folder.employeeName) {
                newNameMap.set(folder.employeeId, folder.employeeName);
              }
            });
            setEmployeeNameMap(newNameMap);

            setFolders(folderItems);
            setDocuments([]); // No documents at company level
            setCurrentView('folders'); // Always show folders at company level
            console.log(`🏢 Loaded ${folderItems.length} employee folders for ${companyName}`);
          }
        } else if (pathParts.length === 2) {
          // Employee level - show employee documents
          const companyName = pathParts[0];
          const employeeId = pathParts[1];
          
          console.log(`📄 Loading documents for employee: ${employeeId} in company: ${companyName}`);
          const { documents: employeeDocs, error: docError } = await DocumentService.getEmployeeDocuments(companyName, employeeId);
          
          if (docError) {
            console.error('❌ Error loading employee documents:', docError);
            setError(docError);
            setDocuments([]);
            return;
          }

          setDocuments(employeeDocs || []);
          setFolders([]);
          setCurrentView('documents');
          console.log(`📄 Loaded ${employeeDocs?.length || 0} documents for employee ${employeeId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading items:', error);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  const searchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { documents: searchResults, error: searchError } = await DocumentService.getDocuments({
        file_path: debouncedSearchTerm
      });

      if (searchError) {
        setError(searchError);
        return;
      }

      setDocuments(searchResults);
      setFolders([]);
      setCurrentView('documents');
    } catch (error) {
      console.error('Error searching documents:', error);
      setError('Failed to search documents');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  const isFileViewable = (fileType: string, fileName: string) => {
    const type = fileType?.toLowerCase() || '';
    const name = fileName?.toLowerCase() || '';
    
    return type.includes('pdf') || 
           type.includes('image') || 
           type.includes('text') ||
           name.endsWith('.pdf') ||
           name.endsWith('.jpg') ||
           name.endsWith('.jpeg') ||
           name.endsWith('.png') ||
           name.endsWith('.gif') ||
           name.endsWith('.txt') ||
           name.endsWith('.html');
  };

  const getFileIcon = (fileType: string, documentType?: string) => {
    const type = fileType?.toLowerCase() || documentType?.toLowerCase() || '';
    
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('jpg') || type.includes('jpeg')) return <FileImage className="w-5 h-5 text-green-500" />;
    if (type.includes('png')) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (type.includes('doc') || type.includes('docx')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (type.includes('txt')) return <FileText className="w-5 h-5 text-gray-500" />;
    if (type.includes('image')) return <FileImage className="w-5 h-5 text-green-500" />;
    if (type.includes('video')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-5 h-5 text-orange-500" />;
    
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getFolderIcon = (folderName: string, isCompany: boolean = false) => {
    // All folders now use consistent blue color and medium size
    return <Folder className="w-6 h-6 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewDocument = useCallback(async (document: Document) => {
    try {
      const { previewUrl, error } = await DocumentService.getDocumentPreview(document.id);
      
      if (error) {
        toast.error(`Failed to preview document: ${error}`);
        return;
      }
      
      if (previewUrl) {
        const canDisplayInBrowser = isFileViewable(document.file_type, document.file_name);
        
        if (canDisplayInBrowser) {
          // Open document in new tab for viewable files
          window.open(previewUrl, '_blank');
          toast.success('Document opened in new tab');
        } else {
          // For non-viewable files, trigger download
          const link = window.document.createElement('a');
          link.href = previewUrl;
          link.download = document.file_name || 'document';
          link.target = '_blank';
          window.document.body.appendChild(link);
          link.click();
          window.document.body.removeChild(link);
          toast.success('Document downloaded (not viewable in browser)');
        }
      }
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view document');
    }
  }, []);

  const handleItemClick = useCallback((item: DocumentItem) => {
    if (item.type === 'folder') {
      // For employee folders, use employeeId instead of name for the path
      const pathSegment = item.employeeId || item.name;
      console.log('🔍 Folder clicked:', {
        name: item.name,
        employeeId: item.employeeId,
        pathSegment: pathSegment,
        currentPath: currentPath
      });
      const newPath = currentPath === '/' ? `/${pathSegment}` : `${currentPath}/${pathSegment}`;
      console.log('🔍 Setting new path:', newPath);
      setCurrentPath(newPath);
    } else {
      // Handle file click - use the proper view document function
      // Find the document in the documents array to get the full Document object
      const document = documents.find(doc => doc.id === item.id);
      if (document) {
        handleViewDocument(document);
      } else {
        // Fallback to direct URL if document not found
        if (item.fileUrl) {
          window.open(item.fileUrl, '_blank');
        }
      }
    }
  }, [currentPath, documents, handleViewDocument]);

  const handleBreadcrumbClick = useCallback((breadcrumb: BreadcrumbItem) => {
    setCurrentPath(breadcrumb.path);
  }, []);

  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allFolderIds = folders.map(folder => folder.id);
    const allDocumentIds = documents.map(doc => doc.id);
    const allIds = [...allFolderIds, ...allDocumentIds];
    
    if (selectedItems.length === allIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  }, [folders, documents, selectedItems.length]);

  const handleDownloadDocument = useCallback(async (document: Document) => {
    try {
      const { downloadUrl, error } = await DocumentService.downloadDocument(document.id);
      
      if (error) {
        toast.error(`Failed to download document: ${error}`);
        return;
      }

      if (downloadUrl) {
        // Create a temporary link and trigger download
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = document.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  }, []);

  const handleDeleteDocument = useCallback(async (document: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const { error } = await DocumentService.deleteDocument(document.id);
      
      if (error) {
        toast.error('Failed to delete document');
        return;
      }

      toast.success('Document deleted successfully');
      loadItems(); // Reload the current view
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  }, [loadItems]);



  const renderDocumentItem = (document: Document) => (
    <div 
      key={document.id}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer ${
        selectedItems.includes(document.id) ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleViewDocument(document)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getFileIcon(document.file_type, document.document_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {document.file_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {document.document_type} • {formatFileSize(document.file_size)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Uploaded {formatDate(document.uploaded_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDocument(document)}
            >
              {isFileViewable(document.file_type, document.file_name) ? (
                <Eye className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadDocument(document)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDocument(document)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFolderItem = (folder: DocumentItem) => (
    <div 
      key={folder.id}
      className={`group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer ${
        selectedItems.includes(folder.id) ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleItemClick(folder)}
    >
      <div className="p-4">
        <div className="flex items-center space-x-3">
                     <div className="flex-shrink-0">
             {folder.icon || getFolderIcon(folder.name, false)}
           </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {folder.name}
            </h3>
            {/* Document count removed as requested */}
            {folder.employeeName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Employee: {folder.employeeName}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
        </div>
      </div>
    </div>
  );

  const renderListView = () => {
    return (
      <div className="space-y-2">
        {/* Show folders OR documents, not both */}
        {filteredFolders.map(folder => renderFolderItem(folder))}
        {filteredDocuments.map(document => renderDocumentItem(document))}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="space-y-6">
        {/* Show folders OR documents, not both */}
        {filteredFolders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFolders.map(folder => renderFolderItem(folder))}
            </div>
          </div>
        )}
        
        {filteredDocuments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map(document => renderDocumentItem(document))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and view all employee documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>

          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
              <Input
                  type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <Card>
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.path} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb)}
                    className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                      index === breadcrumbs.length - 1 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
              >
                {breadcrumb.name}
              </button>
            </div>
          ))}
            </div>
          </Card>
        )}

        {/* Content */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                   {filteredFolders.length > 0 ? 'Folders' : 
                    filteredDocuments.length > 0 ? 'Documents' : 'Content'}
                   {loading && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
                 </h2>
              
              {!loading && (filteredFolders.length > 0 || filteredDocuments.length > 0) && (
                              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedItems.length === (filteredFolders.length + filteredDocuments.length)
                    ? 'Deselect All' 
                    : 'Select All'
                  }
                </Button>
              </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">{error}</p>
                          </div>
                        )}

            {loading ? (
              <DocumentGridSkeleton />
            ) : filteredFolders.length === 0 && filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No documents found matching your search.' : 'No documents found.'}
                </p>
              </div>
            ) : (
              viewMode === 'grid' ? renderGridView() : renderListView()
            )}
          </div>
        </Card>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentPath={currentPath}
        onUploadComplete={() => {
            setIsUploadModalOpen(false);
          loadItems();
        }}
      />
      </div>
    </Layout>
  );
} 
