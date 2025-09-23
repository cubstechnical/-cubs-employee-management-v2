import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
  supabase?: any;
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from database (use profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is approved (profiles uses approved_by=null to indicate pending)
    if (profile.approved_by === null || profile.approved_by === undefined) {
      return NextResponse.json(
        { error: 'Account pending approval' },
        { status: 403 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = { ...user, ...profile };
    authenticatedRequest.supabase = supabase;

    return await handler(authenticatedRequest);
  } catch (error) {
    // Log error securely without exposing sensitive information
    console.error('Auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from database (use profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is approved and has admin role
    if ((profile.approved_by === null || profile.approved_by === undefined) || (profile.role !== 'admin' && profile.role !== 'master_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = { ...user, ...profile };
    authenticatedRequest.supabase = supabase;

    return await handler(authenticatedRequest);
  } catch (error) {
    // Log error securely without exposing sensitive information
    console.error('Admin auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function withMasterAdminAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from database (use profiles table)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user is approved and has master admin role
    if ((profile.approved_by === null || profile.approved_by === undefined) || profile.role !== 'master_admin') {
      return NextResponse.json(
        { error: 'Master admin access required' },
        { status: 403 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = { ...user, ...profile };
    authenticatedRequest.supabase = supabase;

    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Master admin auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }
  
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Duplicate entry' },
      { status: 409 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

export function validateRequiredFields(data: any, fields: string[]) {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
} 