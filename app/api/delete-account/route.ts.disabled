import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { log } from '@/lib/utils/productionLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, confirmation } = body;

        // Validate confirmation text
        if (confirmation !== 'DELETE MY ACCOUNT') {
            return NextResponse.json(
                { success: false, error: 'Invalid confirmation text' },
                { status: 400 }
            );
        }

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Verify email matches authenticated user
        if (user.email !== email) {
            return NextResponse.json(
                { success: false, error: 'Email does not match authenticated user' },
                { status: 403 }
            );
        }

        log.info('Processing account deletion request for:', email);

        // Delete user data in order (respecting foreign key constraints)

        // 1. Delete employee documents
        const { error: docsError } = await supabase
            .from('employee_documents')
            .delete()
            .eq('uploaded_by', user.id);

        if (docsError) {
            log.error('Error deleting documents:', docsError);
        }

        // 2. Delete employees (if user created any)
        const { error: employeesError } = await supabase
            .from('employee_table')
            .delete()
            .eq('created_by', user.id);

        if (employeesError) {
            log.error('Error deleting employees:', employeesError);
        }

        // 3. Delete notifications
        const { error: notificationsError } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user.id);

        if (notificationsError) {
            log.error('Error deleting notifications:', notificationsError);
        }

        // 4. Delete user profile
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            log.error('Error deleting profile:', profileError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete user profile' },
                { status: 500 }
            );
        }

        // 5. Delete from auth (this signs out the user automatically)
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteAuthError) {
            log.error('Error deleting auth user:', deleteAuthError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete authentication account' },
                { status: 500 }
            );
        }

        log.info('Account successfully deleted for:', email);

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        log.error('Delete account API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
