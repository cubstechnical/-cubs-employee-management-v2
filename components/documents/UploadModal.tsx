'use client';

import { useState, useRef, useEffect } from 'react';
import { X, User, Building, Upload, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { DocumentService } from '@/lib/services/documents';
import { EmployeeService } from '@/lib/services/employees';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onUploadComplete: () => void;
}

interface Employee {
  employee_id: string;
  name: string;
  company_name: string;
}

interface UploadFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

export default function UploadModal({ isOpen, onClose, currentPath, onUploadComplete }: UploadModalProps) {
  const [uploadType, setUploadType] = useState<'employee' | 'company'>('employee');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('OTHER');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: string]: 'pending' | 'uploading' | 'success' | 'error'}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search employees
  useEffect(() => {
    const searchEmployees = async () => {
      if (employeeSearch.trim().length < 2) {
        setEmployees([]);
        return;
      }

      try {
        const { data: employees } = await EmployeeService.getEmployees(
          { page: 1, pageSize: 10 },
          { search: employeeSearch }
        );
        setEmployees(employees);
      } catch (error) {
        log.error('Error searching employees:', error);
        setEmployees([]);
      }
    };

    const debounceTimer = setTimeout(searchEmployees, 300);
    return () => clearTimeout(debounceTimer);
  }, [employeeSearch]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newUploadFiles: UploadFile[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  // Remove file from upload list
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Handle employee selection
  const selectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeSearch(employee.name);
    setShowEmployeeDropdown(false);
  };

  // Handle upload
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (uploadType === 'employee' && !selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    setIsUploading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Initialize progress and status for all files
      const initialProgress: {[key: string]: number} = {};
      const initialStatus: {[key: string]: 'pending' | 'uploading' | 'success' | 'error'} = {};
      uploadFiles.forEach(file => {
        initialProgress[file.id] = 0;
        initialStatus[file.id] = 'pending';
      });
      setUploadProgress(initialProgress);
      setUploadStatus(initialStatus);

      for (const uploadFile of uploadFiles) {
        try {
          // Set status to uploading
          setUploadStatus(prev => ({ ...prev, [uploadFile.id]: 'uploading' }));
          let filePath: string;
          let employeeId: string;

          if (uploadType === 'employee' && selectedEmployee) {
            // Employee documents: COMPANY_PREFIX/EMPLOYEE_NAME/DOCUMENT_TYPE_filename.ext
            const employeeName = selectedEmployee.name.replace(/\s+/g, '_').toUpperCase();
            
            // Map company names to their Backblaze prefixes
            const companyPrefixMap: { [key: string]: string } = {
              'AL ASHBAL AJMAN': 'AL_ASHBAL_AJMAN',
              'CUBS CONTRACTING & SERVICES W L L': 'CUBS',
              'ASHBAL AL KHALEEJ': 'ASHBAL_AL_KHALEEJ',
              'FLUID': 'FLUID_ENGINEERING',
              'RUKIN': 'RUKIN_AL_ASHBAL',
              'GOLDEN CUBS': 'GOLDEN_CUBS',
              'AL MACEN': 'AL MACEN',
              'CUBS TECH': 'CUBS_TECH',
              'AL HANA TOURS & TRAVELS': 'EMP_ALHT',
              'AL HANA TOURS': 'EMP_ALHT',
              'ALHT': 'EMP_ALHT'
            };
            
            const companyPrefix = companyPrefixMap[selectedEmployee.company_name] || selectedEmployee.company_name.replace(/\s+/g, '_').toUpperCase();
            const docTypePrefix = documentType.toUpperCase();
            
            // Format: COMPANY_PREFIX/EMPLOYEE_NAME/DOCUMENT_TYPE_filename.ext
            // Use user-friendly folder structure: Company Name/Employee Name/document.ext
            const cleanCompanyName = selectedEmployee.company_name.replace(/[&]/g, 'and').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            const cleanEmployeeName = selectedEmployee.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
            filePath = `${cleanCompanyName}/${cleanEmployeeName}/${uploadFile.name}`;
            employeeId = selectedEmployee.employee_id;
          } else {
            // Company documents: Company Documents/filename
            filePath = `Company Documents/${uploadFile.name}`;
            employeeId = 'COMPANY_DOCS';
          }

          // Use API route for upload
          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('employeeId', employeeId);
          formData.append('documentType', documentType);
          formData.append('fileName', uploadFile.name);
          formData.append('fileSize', uploadFile.size.toString());
          // Note: filePath is now generated by the backend based on actual employee data
          formData.append('notes', `Uploaded via UI - ${uploadType} documents`);

          log.info('🧪 Testing upload with form data...');
          log.info('📄 Upload details:', {
            fileName: uploadFile.name,
            fileSize: uploadFile.size,
            employeeId,
            filePath,
            documentType
          });

          // Simulate progress (since we can't track real progress with FormData)
          setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 30 }));

          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
          });

          setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 80 }));

          if (!response.ok) {
            const errorText = await response.text();
            log.error('❌ Upload failed:', response.status, errorText);
            setUploadStatus(prev => ({ ...prev, [uploadFile.id]: 'error' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            setUploadStatus(prev => ({ ...prev, [uploadFile.id]: 'error' }));
            throw new Error(result.error || 'Upload failed');
          }

          setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 100 }));
          setUploadStatus(prev => ({ ...prev, [uploadFile.id]: 'success' }));
          successCount++;
        } catch (error) {
          log.error('Upload error:', error);
          setUploadStatus(prev => ({ ...prev, [uploadFile.id]: 'error' }));
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
        if (errorCount > 0) {
          toast.error(`Failed to upload ${errorCount} file(s)`);
        }
        
        // Auto-refresh the document list
        onUploadComplete();
        
        // Reset form after showing final status
        setTimeout(() => {
          setUploadFiles([]);
          setSelectedEmployee(null);
          setEmployeeSearch('');
          setDocumentType('OTHER');
          setUploadProgress({});
          setUploadStatus({});
          onClose();
        }, 2000);
      } else {
        toast.error('Failed to upload any files');
      }
    } catch (error) {
      log.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setUploadType('employee');
    setSelectedEmployee(null);
    setEmployeeSearch('');
    setEmployees([]);
    setUploadFiles([]);
    setDocumentType('other');
    setShowEmployeeDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Documents</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Employee Documents</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setUploadType('employee')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  uploadType === 'employee'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <User className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Employee Documents</span>
              </button>
              <button
                onClick={() => setUploadType('company')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  uploadType === 'company'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <Building className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">Company Documents</span>
              </button>
            </div>
          </div>

          {/* Employee Selection (only for employee documents) */}
          {uploadType === 'employee' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Employee</label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                      if (!e.target.value) {
                        setSelectedEmployee(null);
                      }
                    }}
                    className="pl-10 pr-10"
                  />
                  <button
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {showEmployeeDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Employee Dropdown */}
                {showEmployeeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {employees.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No employees found</p>
                        <p className="text-sm">Try a different search term</p>
                      </div>
                    ) : (
                      employees.map((employee) => (
                        <button
                          key={employee.employee_id}
                          onClick={() => selectEmployee(employee)}
                          className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{employee.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.company_name}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Type Selection - Optional */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Document Type (Optional)</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OTHER">Other (Default)</option>
              <option value="PASSPORT">Passport</option>
              <option value="VISA">Visa</option>
              <option value="EMIRATES_ID">Emirates ID</option>
              <option value="LABOR_CARD">Labor Card</option>
              <option value="CONTRACT">Contract</option>
              <option value="SALARY_CERTIFICATE">Salary Certificate</option>
              <option value="BANK_STATEMENT">Bank Statement</option>
              <option value="MEDICAL_CERTIFICATE">Medical Certificate</option>
              <option value="INSURANCE">Insurance</option>
              <option value="EDUCATION_CERTIFICATE">Education Certificate</option>
              <option value="EXPERIENCE_CERTIFICATE">Experience Certificate</option>
              <option value="GENERAL_DOCUMENT">General Document</option>
            </select>
          </div>

          {/* File Upload Area */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select files to upload</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click to browse files</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx"
              />
            </div>

            {/* Selected Files List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Files ({uploadFiles.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {uploadFiles.map((file) => {
                    const progress = uploadProgress[file.id] || 0;
                    const status = uploadStatus[file.id] || 'pending';
                    
                    return (
                      <div key={file.id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {status === 'success' && (
                              <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {status === 'error' && (
                              <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </div>
                            )}
                            {status === 'uploading' && (
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            <button
                              onClick={() => removeFile(file.id)}
                              className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              disabled={isUploading}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        {(status === 'uploading' || status === 'success') && (
                          <div className="px-3">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span>{status === 'success' ? 'Completed' : 'Uploading...'}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <div className="flex space-x-3">
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploadFiles.length === 0 || (uploadType === 'employee' && !selectedEmployee)}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}