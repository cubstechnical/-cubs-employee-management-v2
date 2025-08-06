'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DocumentService, Document } from '@/lib/services/documents';
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
  FileArchive
} from 'lucide-react';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Document type options
  const documentTypes = [
    'passport', 'visa', 'emirates_id', 'labour_card', 
    'medical_certificate', 'insurance', 'contract', 'other'
  ];

  // Load employees for filter dropdown
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const result = await EmployeeService.getEmployees({ page: 1, pageSize: 1000 });
        setEmployees(result.employees);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadEmployees();
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (selectedEmployee) filters.employee_id = selectedEmployee;
      if (selectedType) filters.type = selectedType;
      if (searchTerm) filters.search = searchTerm;

      const result = await DocumentService.getDocuments(filters);
      setDocuments(result.documents);
      
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [selectedEmployee, selectedType, searchTerm]);

  // Effects
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  const DocumentCard = ({ document }: { document: Document }) => (
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

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
                  type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {documents.length} documents
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Documents Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading documents...</span>
        </div>
          ) : documents.length === 0 ? (
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
          ) : (
            <>
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </>
          )}
            </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={() => {
              setShowUploadModal(false);
              fetchDocuments();
            }}
            currentPath="/admin/documents"
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
    </Layout>
  );
} 