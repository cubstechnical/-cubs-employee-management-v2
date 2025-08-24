import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/middleware';
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
      // filePath is now generated automatically based on employee data
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

      // If uploading for an employee, verify the employee exists
      if (employeeId !== 'COMPANY_DOCS' && employeeId !== 'company') {
        console.log('🔍 Verifying employee exists:', employeeId);
        const { data: employee, error: employeeError } = await supabase
          .from('employee_table')
          .select('id, name, company_name')
          .eq('employee_id', employeeId)
          .single();

        if (employeeError || !employee) {
          console.error('❌ Employee not found:', employeeId, employeeError);
          return NextResponse.json(
            { error: `Employee with ID ${employeeId} not found. Please ensure the employee exists in the system before uploading documents.` },
            { status: 400 }
          );
        }
        
        console.log('✅ Employee verified:', employee.name, 'from', employee.company_name);
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
      const finalDocumentType = documentTypeMapping[documentType] || 'other';
      
      console.log('📋 Document type mapping:', {
        original: documentType,
        mapped: finalDocumentType,
        isValid: Object.values(documentTypeMapping).includes(finalDocumentType)
      });

      // Upload to Backblaze B2
      console.log('🚀 Starting Backblaze upload...');
      // Get actual company and employee names for user-friendly paths
      let actualCompanyName: string;
      let actualEmployeeName: string;
      
      if (employeeId === 'COMPANY_DOCS') {
        actualCompanyName = 'Company Documents';
        actualEmployeeName = '';
      } else {
        // We already verified the employee exists, get their details from the verification
        const { data: employee } = await supabase
          .from('employee_table')
          .select('name, company_name')
          .eq('employee_id', employeeId)
          .single();
        
        if (employee) {
          // Clean names for folder paths (replace special characters, normalize spaces)
          actualCompanyName = (employee.company_name as string).replace(/[&]/g, 'and').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          actualEmployeeName = (employee.name as string).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
          
          console.log('🏢 Company name mapping:', {
            original: employee.company_name,
            cleaned: actualCompanyName,
            employeeName: actualEmployeeName
          });
        } else {
          // Fallback to form data if employee lookup fails
          actualCompanyName = 'Employee Documents';
          actualEmployeeName = employeeId;
        }
      }

      const uploadResult = await BackblazeService.uploadFile(file, {
        fileName,
        fileSize,
        mimeType: file.type,
        companyName: actualCompanyName,
        employeeName: actualEmployeeName,
        documentType: finalDocumentType
      });
      
      console.log('📤 Backblaze upload result:', uploadResult);

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || 'Failed to upload file' },
          { status: 500 }
        );
      }

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