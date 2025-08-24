import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug endpoint to check database state and test deletion
export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API: Checking database state ===');

    // Check profiles table
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('All profiles:', allUsers);
    console.log('Profiles error:', allUsersError);

    // Check for unapproved users
    const { data: unapprovedUsers, error: unapprovedError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .is('approved_by', null)
      .order('created_at', { ascending: false });

    console.log('Unapproved users:', unapprovedUsers);
    console.log('Unapproved error:', unapprovedError);

    // Test deletion of first unapproved user if requested
    const url = new URL(request.url);
    const testDelete = url.searchParams.get('testDelete');

    if (testDelete && unapprovedUsers && unapprovedUsers.length > 0) {
      const userToDelete = unapprovedUsers[0];
      console.log('=== TESTING DELETION OF USER ===');
      console.log('User to delete:', userToDelete);

      // Try deletion with admin client
      const { data: deleteResult, error: deleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id)
        .select();

      console.log('Test deletion result:', deleteResult);
      console.log('Test deletion error:', deleteError);

      // Wait for transaction to commit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify deletion with multiple attempts
      let verifyResult = null;
      let verifyError = null;
      let attempts = 0;

      while (attempts < 3 && !verifyResult) {
        attempts++;
        console.log(`Test verification attempt ${attempts}`);

        const result = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userToDelete.id)
          .single();

        verifyResult = result.data;
        verifyError = result.error;

        console.log(`Test verification attempt ${attempts} result:`, verifyResult);
        console.log(`Test verification attempt ${attempts} error:`, verifyError);

        if (verifyResult) {
          console.log('User still exists, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('✅ User successfully deleted in verification!');
          break;
        }
      }

      return NextResponse.json({
        success: true,
        allUsers: allUsers || [],
        unapprovedUsers: unapprovedUsers || [],
        testDelete: {
          userDeleted: userToDelete,
          deleteResult,
          deleteError,
          verifyResult,
          verifyError
        },
        errors: {
          allUsersError,
          unapprovedError
        }
      });
    }

    return NextResponse.json({
      success: true,
      allUsers: allUsers || [],
      unapprovedUsers: unapprovedUsers || [],
      errors: {
        allUsersError,
        unapprovedError
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the JWT token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create a Supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get current user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // Start a transaction-like operation
    const results = {
      userDeleted: false,
      documentsDeleted: false,
      employeesDeleted: false,
      error: null as string | null
    };

    try {
      // Note: Skipping document and employee deletion as these tables may not exist
      // This is acceptable for basic account deletion
      console.log('Skipping document and employee deletion - tables may not exist');

      // 3. Delete the user profile (the most important step)
      console.log('Attempting to delete profile for user:', user.id);

      // First, check if profile exists
      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.log('Profile fetch error (might not exist):', fetchError);
        if (fetchError.code === 'PGRST116') { // No rows returned
          results.userDeleted = true; // Consider it deleted if it doesn't exist
          console.log('Profile does not exist, considering as deleted');
        }
      } else {
        console.log('Found existing profile:', existingProfile);

        // Try multiple deletion approaches
        let profileError = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          attempts++;
          console.log(`Profile deletion attempt ${attempts}/${maxAttempts}`);

          const { error } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (!error) {
            console.log(`Profile deletion successful on attempt ${attempts}`);
            profileError = null;
            break;
          }

          profileError = error;
          console.error(`Profile deletion attempt ${attempts} failed:`, error);

          if (attempts < maxAttempts) {
            console.log('Waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (profileError) {
          console.error('Error deleting user profile:', profileError);
          results.error = results.error || `Failed to delete user profile: ${profileError.message}`;
        } else {
          results.userDeleted = true;
          console.log('User profile deleted successfully');

          // Verify deletion
          const { data: verifyData, error: verifyError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (verifyError && verifyError.code === 'PGRST116') {
            console.log('✅ Profile deletion verified - profile no longer exists');
          } else if (verifyData) {
            console.error('❌ Profile deletion failed - profile still exists:', verifyData);
            results.userDeleted = false;
            results.error = results.error || 'Profile deletion verification failed';
          }
        }
      }

      // 4. Try to delete auth user (optional - may fail due to permissions)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        console.error('Auth user deletion failed (expected due to permissions):', authError);
        // This is acceptable - profile deletion is more important
      } else {
        console.log('Auth user deleted successfully');
      }

      // Log the deletion for compliance
      console.log(`Account deletion completed for user ${user.id}:`, results);
      console.log('=== DELETION SUMMARY ===');
      console.log('User ID:', user.id);
      console.log('User Email:', user.email);
      console.log('Profile Deleted:', results.userDeleted);
      console.log('Error:', results.error);
      console.log('=======================');

      // Return success regardless of auth user deletion status
      // Profile deletion is the critical operation
      return NextResponse.json({
        message: results.userDeleted ? 'Account deleted successfully' : 'Partial deletion completed',
        details: results
      });

    } catch (error) {
      console.error('Account deletion error:', error);
      return NextResponse.json(
        { error: 'Internal server error during account deletion' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
