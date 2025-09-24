import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    log.info('Document view requested', { documentId });

    // Get document from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      log.error('Document not found', { documentId, error });
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document has a file URL
    if (!document.file_url) {
      log.error('Document has no file URL', { documentId });
      return NextResponse.json(
        { success: false, error: 'Document file not found' },
        { status: 404 }
      );
    }

    // Redirect to the actual file URL
    // This allows the browser to handle the file opening appropriately
    const fileUrl = document.file_url;

    log.info('Document view redirect', { documentId, fileUrl });

    // Return HTML that redirects to the file
    // This approach works better for various file types and handles CORS issues
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Viewing Document</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f5f5f5;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              text-align: center;
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              max-width: 500px;
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #d3194f;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .button {
              background: #d3194f;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              margin-top: 20px;
            }
            .button:hover {
              background: #b0173a;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Loading Document...</h2>
            <p>If the document doesn't open automatically, click the button below:</p>
            <a href="${fileUrl}" target="_blank" class="button">Open Document</a>
          </div>
          <script>
            // Try to open the document immediately
            window.location.href = '${fileUrl}';
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    log.error('Error in document view route', { error, documentId: params.id });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
