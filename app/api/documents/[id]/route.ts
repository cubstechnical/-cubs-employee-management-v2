import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting document:', documentId);

    // First, get the document to check if it exists and get file info
    const { data: document, error: fetchError } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      console.error('❌ Document not found:', fetchError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from Supabase database
    const { error: deleteError } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('❌ Error deleting document from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document from database' },
        { status: 500 }
      );
    }

    // Note: We're not deleting from Backblaze B2 here to avoid breaking existing files
    // In a production environment, you might want to implement B2 deletion as well
    
    console.log('✅ Document deleted successfully:', documentId);

    return NextResponse.json(
      { message: 'Document deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in document deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log('📄 Getting document:', documentId);

    // Get document details
    const { data: document, error } = await supabase
      .from('employee_documents')
      .select(`
        *,
        employee_table (
          name,
          employee_id,
          company_name
        )
      `)
      .eq('id', documentId)
      .single();

    if (error || !document) {
      console.error('❌ Document not found:', error);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document }, { status: 200 });

  } catch (error) {
    console.error('❌ Error getting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
