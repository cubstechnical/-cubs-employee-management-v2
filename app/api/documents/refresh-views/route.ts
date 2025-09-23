import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not available' },
        { status: 500 }
      );
    }

    // Create service role client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Refresh materialized views
    const views = [
      'company_document_folders_mv',
      'employee_counts_by_company_mv',
      'document_stats_mv'
    ];

    const results = [];
    for (const view of views) {
      try {
        const { error } = await supabaseAdmin.rpc('refresh_materialized_view', {
          view_name: view
        });
        
        if (error) {
          console.warn(`Failed to refresh ${view}:`, error);
          results.push({ view, status: 'error', error: error.message });
        } else {
          results.push({ view, status: 'success' });
        }
      } catch (err) {
        console.warn(`Error refreshing ${view}:`, err);
        results.push({ view, status: 'error', error: String(err) });
      }
    }

    return NextResponse.json({
      message: 'Materialized views refresh completed',
      results
    });

  } catch (error) {
    console.error('Error refreshing materialized views:', error);
    return NextResponse.json(
      { error: 'Failed to refresh materialized views' },
      { status: 500 }
    );
  }
}



