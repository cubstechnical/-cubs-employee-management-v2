import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, handleApiError } from '@/lib/api/middleware';
import { FileUploadService } from '@/lib/services/fileUpload';

// GET /api/documents - Get all documents with filters
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const employeeId = searchParams.get('employee_id');
      const type = searchParams.get('type');
      
      let documents;
      
      if (employeeId) {
        documents = await FileUploadService.getDocumentsByEmployee(employeeId);
      } else if (type) {
        documents = await FileUploadService.getDocumentsByType(type);
      } else {
        // Get all documents (you might want to add pagination here)
        documents = await FileUploadService.getDocumentsByType('all');
      }

      return NextResponse.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      return handleApiError(error);
    }
  });
}

// POST /api/documents - Upload a new document
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const formData = await req.formData();
      
      const employee_id = formData.get('employee_id') as string;
      const name = formData.get('name') as string;
      const type = formData.get('type') as 'passport' | 'visa' | 'contract' | 'id_card' | 'other';
      const file = formData.get('file') as File;
      
      if (!employee_id || !name || !type || !file) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate file
      const validation = FileUploadService.validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      const uploadedFile = await FileUploadService.uploadFile({
        employee_id,
        name,
        type,
        file,
        uploaded_by: req.user.id,
      });

      if (!uploadedFile) {
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: uploadedFile,
        message: 'Document uploaded successfully',
      }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  });
} 