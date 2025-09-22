'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DocumentService, Document, DocumentFolder } from '@/lib/services/documents';
import { EmployeeService } from '@/lib/services/employees';
import { Employee } from '@/lib/supabase/client';
import UploadModal from '@/components/documents/UploadModal';
import DocumentPreview from '@/components/documents/DocumentPreview';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  File,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Plus,
  Folder,
  ChevronLeft,
  ChevronRight,
  FileImage,
  FileVideo,
  FileArchive,
  ArrowUpRight
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/usePerformance';
import { useRef } from 'react';

export default function AdminDocuments() {
  return (
    <ProtectedRoute>
      <AdminDocumentsContent />
    </ProtectedRoute>
  );
}

function AdminDocumentsContent() {
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [searchMode, setSearchMode] = useState<'documents' | 'folders'>('documents');
  const [isFolderSearch, setIsFolderSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Utility function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('document-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search term to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;

    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('document-recent-searches', JSON.stringify(updated));
  };

  // Document type options
  const documentTypes = [
    'passport', 'visa', 'emirates_id', 'labour_card', 
    'medical_certificate', 'insurance', 'contract', 'other'
  ];

  // Load employees for filter dropdown only when filters are shown
  useEffect(() => {
    const loadEmployees = async () => {
      if (!showFilters) return; // Don't load employees unless filters are visible

      try {
        // Load only essential employee data for filters (name and ID only)
        const result = await EmployeeService.getEmployees({ page: 1, pageSize: 100 });
        setEmployees(result.employees);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadEmployees();
  }, [showFilters]);

            // Fetch documents with pagination and progressive loading
  const fetchDocuments = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);
      setLoadingProgress(0);

      // Simulate progressive loading
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 12, 90));
      }, 120);

      const filters: any = {
        page,
        pageSize: 20 // Limit to 20 documents per page for better performance
      };
      if (selectedEmployee) filters.employee_id = selectedEmployee;
      if (selectedType) filters.type = selectedType;
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;

      const result = await DocumentService.getDocuments(filters);

      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Brief delay to show 100% progress
      setTimeout(() => {
        setDocuments(result.documents || []);
        setTotalPages(result.totalPages || 1);
        setTotalDocuments(result.total || 0);
        setLoading(false);
        setInitialLoading(false);
        setLoadingProgress(0);
      }, 200);

    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
      setLoading(false);
      setInitialLoading(false);
      setLoadingProgress(0);
    }
  }, [currentPage, selectedEmployee, selectedType, debouncedSearchTerm]);

  // Handle instant search for dropdown
  const handleInstantSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      // Get instant search results (limited to 5 for dropdown)
      const result = await DocumentService.getDocuments({
        search: searchTerm.trim(),
        page: 1,
        pageSize: 5
      });

      if (result.documents && result.documents.length > 0) {
        setSearchResults(result.documents);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Instant search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced instant search
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0 && searchMode === 'documents') {
      const timeoutId = setTimeout(() => {
        handleInstantSearch(searchTerm);
      }, 150); // Faster than main search for instant feel

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchTerm, handleInstantSearch, searchMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search employee folders
  const searchFolders = useCallback(async (search: string = debouncedSearchTerm) => {
    if (!search || search.trim().length === 0) {
      setFolders([]);
      setIsFolderSearch(false);
      return;
    }

    try {
      setLoading(true);
      setIsFolderSearch(true);

      const result = await DocumentService.searchEmployeeFolders(search, 50);
      setFolders(result.folders || []);

    } catch (error) {
      console.error('Error searching folders:', error);
      toast.error('Failed to search employee folders');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  // Effects
  useEffect(() => {
    if (searchMode === 'documents') {
      fetchDocuments();
    } else if (searchMode === 'folders' && debouncedSearchTerm) {
      searchFolders();
    } else if (searchMode === 'folders' && !debouncedSearchTerm) {
      setFolders([]);
      setIsFolderSearch(false);
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchMode, fetchDocuments, searchFolders, debouncedSearchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEmployee, selectedType, searchTerm]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDocuments();
    setIsRefreshing(false);
    toast.success('Documents refreshed');
  }, [fetchDocuments]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await DocumentService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const { downloadUrl, error } = await DocumentService.downloadDocument(document.id);
      if (error) {
        toast.error(`Failed to download document: ${error}`);
        return;
      }
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        toast.success('Download started');
      } else {
        toast.error('Failed to generate download URL');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handlePreviewDocument = async (document: Document) => {
    try {
      const previewUrl = await DocumentService.getDocumentPreview(document.id);
      if (previewUrl) {
        setPreviewDocument({ ...document, file_url: previewUrl.previewUrl || '' });
      } else {
        toast.error('Preview not available for this document');
      }
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Failed to preview document');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <FileArchive className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId || emp.employee_id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const FolderCard = ({ folder }: { folder: DocumentFolder }) => (
    <div onClick={() => {
      // Navigate to company/employee folder
      router.push(`/documents/company/${folder.companyName}/${folder.employeeId}`);
    }}>
      <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out group cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
            <Folder className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">
              {folder.name}
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {folder.employeeId}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {folder.companyName}
              </span>

            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            View Folder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {folder.companyName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Employee ID</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {folder.employeeId}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Modified</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(folder.lastModified)}
            </p>
          </div>
        </div>
      </div>
      </Card>
    </div>
  );

  const DocumentCardSkeleton = () => (
    <Card className="p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const DocumentCard = ({ document }: { document: Document }) => {
    return (
      <Card className="p-4 hover:shadow-lg transition-all duration-300 ease-in-out group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
            {getFileIcon(document.file_type)}
            </div>
            <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {document.file_name}
                </h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getEmployeeName(document.employee_id)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(document.file_size || 0)}
                </span>
            </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
            onClick={() => handlePreviewDocument(document)}
            >
            <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
            onClick={() => handleDownloadDocument(document)}
            >
            <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
            onClick={() => handleDeleteDocument(document.id)}
            className="text-red-600 hover:text-red-700"
            >
            <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <File className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {document.document_type?.replace('_', ' ') || 'Document'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded By</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {document.uploaded_by || 'System'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(document.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Active
            </span>
          </div>
        </div>
      </div>
      </Card>
    );
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Document Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view all employee documents
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder={searchMode === 'documents' ? "Search documents by name, employee..." : "Search employee folders by name, ID, company..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSearchDropdown(true)}
                  className="pl-10"
                />

                {/* Search Dropdown */}
                {showSearchDropdown && searchMode === 'documents' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Search Results
                        </div>
                        {searchResults.slice(0, 5).map((document, index) => (
                          <button
                            key={document.id}
                            onClick={() => {
                              setSearchTerm(document.file_name || '');
                              setShowSearchDropdown(false);
                              saveRecentSearch(document.file_name || '');
                              handlePreviewDocument(document);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 group"
                          >
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                              {getFileIcon(document.file_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white truncate">
                                {highlightSearchTerm(document.file_name || '', searchTerm)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {highlightSearchTerm(getEmployeeName(document.employee_id), searchTerm)} • {formatFileSize(document.file_size || 0)}
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                        {searchResults.length > 5 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            +{searchResults.length - 5} more results...
                          </div>
                        )}
                      </div>
                    ) : searchTerm && recentSearches.length > 0 ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Recent Searches
                        </div>
                        {recentSearches.slice(0, 3).map((recentTerm, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchTerm(recentTerm);
                              setShowSearchDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{recentTerm}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'No results found' : 'Start typing to search documents'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                disabled={searchMode === 'folders'}
                className={cn(
                  showFilters ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : '',
                  searchMode === 'folders' ? 'opacity-50 cursor-not-allowed' : ''
                )}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isFolderSearch ? `${folders.length} folders found` : `${totalDocuments} total documents`}
            </div>
          </div>

          {/* Search Mode Toggle */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Search in:</span>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setSearchMode('documents')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-l-lg transition-colors",
                  searchMode === 'documents'
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <FileText className="w-4 h-4 mr-2 inline" />
                Documents
              </button>
              <button
                onClick={() => setSearchMode('folders')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-r-lg transition-colors",
                  searchMode === 'folders'
                    ? "bg-green-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Folder className="w-4 h-4 mr-2 inline" />
                Employee Folders
              </button>
            </div>
          </div>

          {/* Filters - Only show for document search */}
          {showFilters && searchMode === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Type
                </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-blue-500"
            >
                  <option value="">All Types</option>
              {documentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </option>
              ))}
            </select>
              </div>
          </div>
          )}
        </Card>

        {/* Results Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {/* Progressive loading progress bar */}
              {loadingProgress > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Loading documents... {loadingProgress}%
                  </p>
                </div>
              )}

              {/* Show skeleton cards while loading */}
              {[...Array(6)].map((_, i) => (
                <DocumentCardSkeleton key={i} />
              ))}
            </div>
          ) : isFolderSearch && folders.length === 0 && debouncedSearchTerm ? (
            <Card className="p-12 text-center">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No employee folders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try searching by employee name, ID, or company name
              </p>
            </Card>
          ) : !isFolderSearch && documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documents found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || selectedEmployee || selectedType
                  ? 'Try adjusting your search or filters'
                  : 'Get started by uploading your first document'}
              </p>
              {!searchTerm && !selectedEmployee && !selectedType && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </Card>
          ) : isFolderSearch ? (
            <>
              {folders.map((folder) => (
                <FolderCard key={`${folder.companyName}-${folder.employeeId}`} folder={folder} />
              ))}
            </>
          ) : (
            <>
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </>
          )}
        </div>

        {/* Pagination - Only show for document search */}
        {totalPages > 1 && searchMode === 'documents' && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {currentPage} of {totalPages} ({totalDocuments} total documents)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    fetchDocuments(newPage);
                  }}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          fetchDocuments(page);
                        }}
                        className={cn(
                          "px-3 py-1 text-sm rounded-md transition-colors",
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    fetchDocuments(newPage);
                  }}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={() => {
              setShowUploadModal(false);
              fetchDocuments();
            }}
            currentPath="/documents"
          />
        )}

        {/* Preview Modal */}
        {previewDocument && (
          <DocumentPreview
            document={previewDocument}
            isOpen={!!previewDocument}
            onClose={() => setPreviewDocument(null)}
          />
        )}
    </div>
  );
} 