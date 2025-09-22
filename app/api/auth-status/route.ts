import { NextRequest, NextResponse } from 'next/server';
import { getAuthState, isSupabaseAvailable } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking authentication status...');
    
    const authStatus = {
      supabaseAvailable: isSupabaseAvailable,
      timestamp: new Date().toISOString(),
      authState: null as any
    };

    if (isSupabaseAvailable) {
      try {
        const authState = await getAuthState();
        authStatus.authState = {
          hasUser: !!authState.user,
          hasSession: !!authState.session,
          userId: authState.user?.id || null,
          userEmail: authState.user?.email || null,
          sessionExpiry: authState.session?.expires_at || null,
          cacheTimestamp: authState.timestamp
        };
      } catch (error) {
        console.error('❌ Error getting auth state:', error);
        authStatus.authState = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication status retrieved successfully',
      data: authStatus
    });
    
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
