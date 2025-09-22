import { NextRequest, NextResponse } from 'next/server';
import { BackblazeService } from '@/lib/services/backblaze';
import { supabase } from '@/lib/supabase/client';

// POST /api/documents/upload - Upload document
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Document upload request received');
    const formData = await request.formData();
      
    const employeeId = formData.get('employeeId') as string;
    const documentType = formData.get('documentType') as string;
    const fileName = formData.get('fileName') as string;
    const fileSize = parseInt(formData.get('fileSize') as string);
    const notes = formData.get('notes') as string;
    const file = formData.get('file') as File;

    console.log('📄 Upload data:', {
      employeeId,
      documentType,
      fileName,
      fileSize,
      notes,
      fileType: file?.type,
      originalFileName: file?.name
    });

    if (!employeeId || !fileName || !file) {
      console.error('❌ Missing required fields:', { employeeId, fileName, hasFile: !!file });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If uploading for an employee, verify the employee exists and get company info
    let companyName = 'Company Documents';
    let employeeName = '';
    
    if (employeeId !== 'COMPANY_DOCS') {
      const { data: employee, error: employeeError } = await supabase
        .from('employee_table')
        .select('employee_id, name, company_name')
        .eq('employee_id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('❌ Employee not found:', employeeId);
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      companyName = employee.company_name as string;
      employeeName = employee.name as string;
      console.log('✅ Employee verified:', employee.name, 'Company:', companyName);
    }

    // Map document types to database-compliant values (lowercase)
    const documentTypeMapping: { [key: string]: string } = {
      'PASSPORT': 'passport',
      'VISA': 'visa',
      'EMIRATES_ID': 'emirates_id',
      'LABOR_CARD': 'labor_card',
      'CONTRACT': 'contract',
      'SALARY_CERTIFICATE': 'salary_certificate',
      'BANK_STATEMENT': 'bank_statement',
      'MEDICAL_CERTIFICATE': 'medical_certificate',
      'INSURANCE': 'insurance',
      'EDUCATION_CERTIFICATE': 'education_certificate',
      'EXPERIENCE_CERTIFICATE': 'experience_certificate',
      'GENERAL_DOCUMENT': 'general_document',
      'OTHER': 'other'
    };

    // Map the document type to database-compliant format
    let finalDocumentType = documentTypeMapping[documentType] || 'other';
    
    // For company documents, use 'other' as the document type since 'company_docs' is not allowed by the database constraint
    if (employeeId === 'COMPANY_DOCS') {
      finalDocumentType = 'other';
    }
    
    console.log('📋 Document type mapping:', {
      original: documentType,
      mapped: finalDocumentType,
      isValid: Object.values(documentTypeMapping).includes(finalDocumentType)
    });

    // Upload file to Backblaze B2
    const uploadResult = await BackblazeService.uploadFile(file, {
      fileName: fileName,
      fileSize: fileSize,
      mimeType: file.type,
      companyName: companyName,
      employeeName: employeeName,
      documentType: finalDocumentType
    });

    if (!uploadResult.success) {
      console.error('❌ Backblaze upload failed:', uploadResult.error);
      return NextResponse.json(
        { error: `File upload failed: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    console.log('✅ File uploaded to Backblaze:', uploadResult.fileKey);

    // Save metadata to database
    const { data: document, error: dbError } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: employeeId,
        document_type: finalDocumentType,
        file_name: fileName,
        file_size: fileSize,
        file_path: uploadResult.fileKey,
        file_url: uploadResult.fileUrl,
        file_type: file.type,
        notes: notes || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error during document upload:', dbError);
      
      // If database save fails, delete the uploaded file
      try {
        await BackblazeService.deleteFile(uploadResult.fileKey!);
      } catch (deleteError) {
        console.error('Failed to delete uploaded file after DB error:', deleteError);
      }

      return NextResponse.json(
        { error: `Failed to save document metadata: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Document metadata saved to database');

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ DOCUMENT UPLOAD ERROR:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : 'No details available'
    }, { status: 500 });
  }
}
