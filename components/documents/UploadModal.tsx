'use client';

import { useState, useRef, useEffect } from 'react';
import { X, User, Building, Upload, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { DocumentService } from '@/lib/services/documents';
import { EmployeeService } from '@/lib/services/employees';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

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
  const [documentType, setDocumentType] = useState('other');
  
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
        const { employees } = await EmployeeService.getEmployees(
          { page: 1, pageSize: 10 },
          { search: employeeSearch }
        );
        setEmployees(employees);
      } catch (error) {
        console.error('Error searching employees:', error);
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

      for (const uploadFile of uploadFiles) {
        try {
          let filePath: string;
          let employeeId: string;

          if (uploadType === 'employee' && selectedEmployee) {
            // Employee documents: company/employee_id/document_type/filename
            filePath = `${selectedEmployee.company_name}/${selectedEmployee.employee_id}/${documentType}/${uploadFile.name}`;
            employeeId = selectedEmployee.employee_id;
          } else {
            // Company documents: company-documents/document_type/filename
            filePath = `company-documents/${documentType}/${uploadFile.name}`;
            employeeId = 'company'; // Special ID for company documents
          }

          // Use API route for upload
          const formData = new FormData();
          formData.append('file', uploadFile.file);
          formData.append('employeeId', employeeId);
          formData.append('documentType', documentType);
          formData.append('fileName', uploadFile.name);
          formData.append('fileSize', uploadFile.size.toString());
          formData.append('filePath', filePath);
          formData.append('notes', `Uploaded via UI - ${uploadType} documents`);

          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Upload failed');
          }

          successCount++;
        } catch (error) {
          console.error('Upload error:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
        if (errorCount > 0) {
          toast.error(`Failed to upload ${errorCount} file(s)`);
        }
        onUploadComplete();
        handleClose();
      } else {
        toast.error('Failed to upload any files');
      }
    } catch (error) {
      console.error('Upload error:', error);
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

          {/* Document Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="passport">Passport</option>
              <option value="visa">Visa</option>
              <option value="emirates_id">Emirates ID</option>
              <option value="labor_card">Labor Card</option>
              <option value="contract">Contract</option>
              <option value="salary_certificate">Salary Certificate</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="medical_certificate">Medical Certificate</option>
              <option value="insurance">Insurance</option>
              <option value="education_certificate">Education Certificate</option>
              <option value="experience_certificate">Experience Certificate</option>
              <option value="general_document">General Document</option>
              <option value="other">Other</option>
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
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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