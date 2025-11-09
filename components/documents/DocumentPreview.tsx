'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Download, ExternalLink, FileText, FileImage, FileVideo, FileAudio, Archive } from 'lucide-react';
import { log } from '@/lib/utils/productionLogger';

interface DocumentPreviewProps {
  document: {
    id: string;
    file_name: string;
    file_url: string;
    file_path: string;
    file_type: string;
    mime_type?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generatePreviewUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Use API route to get document preview URL
      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const response = await fetch(getApiUrl('api/documents/preview'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: document.file_path
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get preview URL');
      }

      if (result.data.previewUrl) {
        setPreviewUrl(result.data.previewUrl);
      } else {
        throw new Error('No preview URL received');
      }
    } catch (error) {
      log.error('Error generating preview URL:', error);
      setError('Failed to load document preview');
    } finally {
      setLoading(false);
    }
  }, [document]);

  useEffect(() => {
    if (isOpen && document) {
      generatePreviewUrl();
    }
  }, [isOpen, document, generatePreviewUrl]);

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/')) return <FileImage className="w-8 h-8 text-green-600" />;
    if (mimeType?.startsWith('video/')) return <FileVideo className="w-8 h-8 text-purple-600" />;
    if (mimeType?.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-orange-600" />;
    
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="w-8 h-8 text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="w-8 h-8 text-orange-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className="w-8 h-8 text-green-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="w-8 h-8 text-purple-600" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <FileAudio className="w-8 h-8 text-orange-600" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-8 h-8 text-gray-600" />;
      default:
        return <FileText className="w-8 h-8 text-gray-600" />;
    }
  };

  const canPreview = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Images
    if (mimeType?.startsWith('image/')) return true;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) return true;
    
    // PDFs
    if (extension === 'pdf') return true;
    
    // Videos
    if (mimeType?.startsWith('video/')) return true;
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) return true;
    
    // Audio
    if (mimeType?.startsWith('audio/')) return true;
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) return true;
    
    return false;
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 mb-2">Failed to load preview</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!canPreview(document.file_name, document.mime_type)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            {getFileIcon(document.file_name, document.mime_type)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
              {document.file_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This file type cannot be previewed
            </p>
            <div className="flex gap-2 justify-center">
              <a
                href={previewUrl}
                download={document.file_name}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>
          </div>
        </div>
      );
    }

    const extension = document.file_name.split('.').pop()?.toLowerCase();
    const mimeType = document.mime_type;

    // Image preview
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return (
        <div className="relative h-96 w-full">
          <Image
            src={previewUrl}
            alt={document.file_name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
            className="object-contain rounded-lg shadow-lg"
            onError={() => setError('Failed to load image')}
            priority={false}
          />
        </div>
      );
    }

    // PDF preview
    if (extension === 'pdf') {
      return (
        <div className="h-96">
          <iframe
            src={`${previewUrl}#toolbar=0`}
            className="w-full h-full border-0 rounded-lg"
            title={document.file_name}
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    }

    // Video preview
    if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return (
        <div className="flex items-center justify-center h-96">
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-full rounded-lg shadow-lg"
            onError={() => setError('Failed to load video')}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio preview
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(extension || '')) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            {getFileIcon(document.file_name, document.mime_type)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-4">
              {document.file_name}
            </h3>
            <audio
              src={previewUrl}
              controls
              className="w-full max-w-md"
              onError={() => setError('Failed to load audio')}
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {getFileIcon(document.file_name, document.mime_type)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document.file_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {document.file_path}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download={document.file_name}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
} 