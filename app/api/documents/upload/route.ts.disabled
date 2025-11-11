import { NextRequest, NextResponse } from 'next/server';
import { BackblazeService } from '@/lib/services/backblaze';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large file uploads

export async function POST(request: NextRequest) {
  try {
    log.info('📥 Received upload request');
    
    const formData = await request.formData();
    const file = formData.get('file');
    const employee_id = formData.get('employee_id') as string;
    const document_type = formData.get('document_type') as string;
    const file_name = formData.get('file_name') as string;
    const file_size_str = formData.get('file_size') as string;
    const file_size = file_size_str ? parseInt(file_size_str) : 0;
    const file_path = formData.get('file_path') as string;
    const file_type = formData.get('file_type') as string;
    const notes = formData.get('notes') as string | null;

    log.info('📋 Form data received:', {
      hasFile: !!file,
      fileType: file ? typeof file : 'null',
      fileSize: file_size,
      fileName: file_name,
      employee_id,
      document_type,
      file_name,
      file_size,
      file_path,
      file_type
    });

    // Validate required fields
    if (!file || !employee_id || !document_type || !file_name || !file_path) {
      log.error('❌ Missing required fields:', {
        hasFile: !!file,
        employee_id,
        document_type,
        file_name,
        file_path
      });
      return NextResponse.json(
        { error: 'Missing required fields: file, employee_id, document_type, file_name, file_path' },
        { status: 400 }
      );
    }

    // Validate file is actually a File object or Blob
    if (!file || (typeof file !== 'object')) {
      log.error('❌ File is null, undefined, or not an object');
      return NextResponse.json(
        { error: 'Invalid file object' },
        { status: 400 }
      );
    }
    
    // TypeScript type guard
    const fileObj = file as unknown;
    if (!(fileObj instanceof File) && !(fileObj instanceof Blob)) {
      log.error('❌ Invalid file object:', {
        type: typeof fileObj,
        constructor: (fileObj as any)?.constructor?.name,
        isFile: fileObj instanceof File,
        isBlob: fileObj instanceof Blob
      });
      return NextResponse.json(
        { error: 'Invalid file object' },
        { status: 400 }
      );
    }

    // Verify file can be read (check for arrayBuffer method)
    const fileForUpload = fileObj as File | Blob;
    if (!(fileForUpload as any).arrayBuffer && !(fileForUpload as any).stream) {
      log.error('❌ File object missing required methods:', {
        hasArrayBuffer: typeof (fileForUpload as any).arrayBuffer === 'function',
        hasStream: typeof (fileForUpload as any).stream === 'function',
        fileType: typeof fileForUpload
      });
      return NextResponse.json(
        { error: 'File object is not readable' },
        { status: 400 }
      );
    }

    log.info('📤 Server-side upload started:', {
      fileName: file_name,
      fileSize: file_size,
      employeeId: employee_id,
      filePath: file_path
    });

    // Extract company and employee names from file path
    const pathParts = file_path.split('/');
    let companyName = pathParts[0] || 'Unknown';
    if (companyName === 'AL HANA TOURS and TRAVELS' || companyName === 'AL HANA TOURS AND TRAVELS') {
      companyName = 'AL HANA TOURS & TRAVELS';
    }
    const employeeName = pathParts[1] || 'Unknown';

    log.info('📤 Starting Backblaze upload:', {
      companyName,
      employeeName,
      fileName: file_name,
      fileSize: file_size || ((fileForUpload as File).size || 0),
      mimeType: (fileForUpload as File).type || file_type
    });

    // Upload file to Backblaze B2 (server-side, has access to env vars)
    // Use file.size if file_size is 0 or invalid
    const actualFileSize = file_size > 0 ? file_size : ((fileForUpload as File).size || 0);
    const actualMimeType = (fileForUpload as File).type || file_type || 'application/octet-stream';
    
    let uploadResult;
    const uploadStartTime = Date.now();
    try {
      log.info('📤 Calling BackblazeService.uploadFile...');
      uploadResult = await BackblazeService.uploadFile(fileForUpload as File, {
        fileName: file_name,
        fileSize: actualFileSize,
        mimeType: actualMimeType,
        companyName,
        employeeName,
        documentType: document_type
      });
      const uploadDuration = Date.now() - uploadStartTime;
      log.info(`📥 BackblazeService.uploadFile completed in ${uploadDuration}ms:`, {
        duration: uploadDuration,
        timestamp: new Date().toISOString(),
        success: uploadResult?.success,
        hasFileKey: !!uploadResult?.fileKey,
        hasFileUrl: !!uploadResult?.fileUrl,
        error: uploadResult?.error
      });
    } catch (uploadError) {
      const uploadDuration = Date.now() - uploadStartTime;
      const errorDetails = {
        duration: uploadDuration,
        timestamp: new Date().toISOString(),
        message: uploadError instanceof Error ? uploadError.message : String(uploadError),
        name: uploadError instanceof Error ? uploadError.name : 'Unknown',
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        code: (uploadError as any)?.code,
        errno: (uploadError as any)?.errno,
        syscall: (uploadError as any)?.syscall,
        address: (uploadError as any)?.address,
        port: (uploadError as any)?.port
      };
      log.error(`❌ Backblaze upload exception after ${uploadDuration}ms:`, errorDetails);
      
      // Graceful degradation: Return user-friendly error with retry suggestion
      const isConnectionError = 
        errorDetails.code === 'ECONNRESET' ||
        errorDetails.code === 'ETIMEDOUT' ||
        errorDetails.message?.includes('ECONNRESET');
      
      return NextResponse.json(
        { 
          error: isConnectionError 
            ? 'Upload failed due to connection issue. Please try again in a moment.'
            : uploadError instanceof Error ? uploadError.message : 'Failed to upload file to Backblaze',
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
          retryable: isConnectionError,
          suggestion: isConnectionError ? 'This is usually temporary. Please retry the upload.' : undefined
        },
        { status: 500 }
      );
    }

    if (!uploadResult.success) {
      log.error('❌ Backblaze upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload file to Backblaze' },
        { status: 500 }
      );
    }

    log.info('✅ File uploaded to Backblaze:', uploadResult.fileKey);

    // Skip file verification to speed up uploads - Backblaze upload is reliable
    // Verification can be done asynchronously if needed

    // Normalize document_type to lowercase to match database check constraint
    // Database expects: 'passport', 'visa', 'emirates_id', 'labour_card', 'contract', 'other', etc.
    const normalizedDocumentType = document_type.toLowerCase().trim();
    
    // Map common variations to valid database values
    const documentTypeMap: Record<string, string> = {
      'other': 'other',
      'passport': 'passport',
      'visa': 'visa',
      'emirates_id': 'emirates_id',
      'labor_card': 'labour_card',
      'labour_card': 'labour_card',
      'contract': 'contract',
      'salary_certificate': 'other',
      'bank_statement': 'other',
      'medical_certificate': 'other',
      'insurance': 'other',
      'education_certificate': 'other',
      'experience_certificate': 'other',
      'general_document': 'other'
    };
    
    const finalDocumentType = documentTypeMap[normalizedDocumentType] || 'other';
    
    log.info('📝 Document type normalization:', {
      original: document_type,
      normalized: normalizedDocumentType,
      final: finalDocumentType
    });

    // Save document metadata to Supabase
    const { data: document, error: dbError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id,
        document_type: finalDocumentType,
        file_name,
        file_url: uploadResult.fileUrl || '',
        file_size: file_size,
        file_path: uploadResult.fileKey || file_path,
        file_type: file_type,
        mime_type: (fileForUpload as File).type,
        notes: notes || null,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      log.error('❌ Database insert error:', dbError);
      // Try to clean up uploaded file
      try {
        await BackblazeService.deleteFile(uploadResult.fileKey || file_path);
      } catch (deleteError) {
        log.error('Failed to delete file after database error:', deleteError);
      }
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    log.info('✅ Document uploaded successfully:', document?.id);

    return NextResponse.json({
      success: true,
      document: document
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    log.error('❌ Upload API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    );
  }
}

