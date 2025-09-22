import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentService, UploadDocumentData, Document, DocumentFolder } from '@/lib/services/documents';
import toast from 'react-hot-toast';

// Query keys for consistent caching
export const documentKeys = {
  all: ['documents'] as const,
  folders: () => [...documentKeys.all, 'folders'] as const,
  companyFolders: (companyName: string) => [...documentKeys.folders(), 'company', companyName] as const,
  employeeDocuments: (employeeId: string) => [...documentKeys.all, 'employee', employeeId] as const,
  companyDocuments: (companyName: string) => [...documentKeys.all, 'company', companyName] as const,
  search: (searchTerm: string) => [...documentKeys.all, 'search', searchTerm] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

// Hook for fetching document folders (companies)
export function useDocumentFolders(useCache = true) {
  return useQuery({
    queryKey: documentKeys.folders(),
    queryFn: () => DocumentService.getDocumentFolders(useCache),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
}

// Hook for fetching employee folders for a specific company
export function useEmployeeFolders(companyName: string, useCache = true) {
  return useQuery({
    queryKey: documentKeys.companyFolders(companyName),
    queryFn: () => DocumentService.getEmployeeFolders(companyName, useCache),
    enabled: !!companyName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 2,
  });
}

// Hook for fetching documents for a specific employee
export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: documentKeys.employeeDocuments(employeeId),
    queryFn: () => DocumentService.getDocumentsForEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook for fetching company documents
export function useCompanyDocuments(companyName: string) {
  return useQuery({
    queryKey: documentKeys.companyDocuments(companyName),
    queryFn: () => DocumentService.getCompanyDocuments(companyName),
    enabled: !!companyName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// Hook for searching documents
export function useDocumentSearch(searchTerm: string) {
  return useQuery({
    queryKey: documentKeys.search(searchTerm),
    queryFn: () => DocumentService.searchDocuments(searchTerm),
    enabled: !!searchTerm && searchTerm.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Hook for getting search suggestions (autocomplete)
export function useSearchSuggestions(searchTerm: string, limit: number = 10) {
  return useQuery({
    queryKey: [...documentKeys.all, 'suggestions', searchTerm, limit],
    queryFn: () => DocumentService.getSearchSuggestions(searchTerm, limit),
    enabled: !!searchTerm && searchTerm.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Hook for getting a specific document
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => DocumentService.getDocumentById(documentId),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for uploading a document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, uploadData }: { file: File; uploadData: UploadDocumentData }) => 
      DocumentService.uploadDocument(file, uploadData),
    onSuccess: (result) => {
      if (result.document) {
        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: documentKeys.folders() });
        queryClient.invalidateQueries({ queryKey: documentKeys.employeeDocuments(result.document.employee_id) });
        
        // Extract company name from file path for cache invalidation
        const pathParts = result.document.file_path?.split('/') || [];
        const companyName = pathParts[0];
        if (companyName) {
          queryClient.invalidateQueries({ queryKey: documentKeys.companyFolders(companyName) });
          queryClient.invalidateQueries({ queryKey: documentKeys.companyDocuments(companyName) });
        }
        
        toast.success('Document uploaded successfully');
      } else {
        toast.error(result.error || 'Failed to upload document');
      }
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    },
  });
}

// Hook for deleting a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => DocumentService.deleteDocument(documentId),
    onSuccess: (result, documentId) => {
      if (!result.error) {
        // Remove the document from cache
        queryClient.removeQueries({ queryKey: documentKeys.detail(documentId) });
        
        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: documentKeys.folders() });
        queryClient.invalidateQueries({ queryKey: documentKeys.all });
        
        toast.success('Document deleted successfully');
      } else {
        toast.error(result.error);
      }
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    },
  });
}

// Hook for getting document presigned URL
export function useDocumentPresignedUrl(documentId: string) {
  return useQuery({
    queryKey: [...documentKeys.detail(documentId), 'presignedUrl'],
    queryFn: () => DocumentService.getDocumentPresignedUrl(documentId),
    enabled: !!documentId,
    staleTime: 8 * 60 * 1000, // 8 minutes (URLs typically expire in 10 minutes)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Don't retry too much for URL generation
  });
}

// Hook for refreshing document data
export function useRefreshDocuments() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
    toast.success('Document data refreshed');
  };
}

// Hook for clearing document cache
export function useClearDocumentCache() {
  const queryClient = useQueryClient();

  return () => {
    DocumentService.clearCache();
    queryClient.removeQueries({ queryKey: documentKeys.all });
    toast.success('Document cache cleared');
  };
}
